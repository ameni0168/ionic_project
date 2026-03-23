# app/services/auth_service.py
from flask_jwt_extended import create_access_token, create_refresh_token
from pymongo.errors     import DuplicateKeyError

from app.extension import bcrypt
from app.models.users_model      import (
    get_users_collection, create_user,
    get_user_by_email, get_user_by_id,
    get_user_by_username, update_last_login,
    update_user, serialize_user,
)
from app.models.client_model import (
    create_client, get_client_by_user_id, serialize_client,
)
from app.models.freelancer_model import (
    create_freelancer, get_freelancer_by_user_id, serialize_freelancer,
)


# ── REGISTER ──────────────────────────────────────────────────────
def register_user(data: dict) -> tuple[dict, int]:
    for field in ["username", "email", "password", "full_name", "role"]:
        if not str(data.get(field, "")).strip():
            return {"error": f"Champ obligatoire manquant : {field}"}, 400

    role = data["role"].strip().lower()
    if role not in ("client", "freelancer"):
        return {"error": "Le role doit etre 'client' ou 'freelancer'"}, 400

    if len(data["password"]) < 6:
        return {"error": "Mot de passe : minimum 6 caracteres"}, 400

    if get_user_by_email(data["email"]):
        return {"error": "Cet email est deja utilise"}, 409
    if get_user_by_username(data["username"]):
        return {"error": "Ce nom d'utilisateur est deja pris"}, 409

    # Hash correct avec encode obligatoire
    pw_hash = bcrypt.generate_password_hash(
        data["password"].encode("utf-8")
    ).decode("utf-8")

    try:
        user_id = create_user({
            "username":      data["username"],
            "email":         data["email"],
            "password_hash": pw_hash,
            "full_name":     data["full_name"],
            "role":          role,
        })
    except DuplicateKeyError:
        return {"error": "Email ou username deja utilise"}, 409
    except Exception as e:
        return {"error": f"Erreur creation compte : {str(e)}"}, 500

    user_id_str = str(user_id)

    try:
        if role == "client":
            create_client(user_id_str, {
                "phone":    data.get("phone", ""),
                "location": data.get("location", ""),
                "company":  data.get("company", ""),
                "website":  data.get("website", ""),
                "bio":      data.get("bio", ""),
            })
        else:
            create_freelancer(user_id_str, {
                "title":       data.get("title", ""),
                "bio":         data.get("bio", ""),
                "phone":       data.get("phone", ""),
                "location":    data.get("location", ""),
                "hourly_rate": data.get("hourly_rate", 0),
                "category":    data.get("category", ""),
                "skills":      data.get("skills", []),
            })
    except Exception as e:
        get_users_collection().delete_one({"_id": user_id})
        return {"error": f"Erreur creation profil : {str(e)}"}, 500

    user   = get_user_by_id(user_id_str)
    tokens = _make_tokens(user_id_str, role)

    return {
        "message":       "Inscription reussie",
        "access_token":  tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "user":          serialize_user(user),
        "redirect_to":   "/dashboard/client" if role == "client" else "/dashboard/freelancer",
    }, 201


# ── LOGIN ──────────────────────────────────────────────────────────
def login_user(data: dict) -> tuple[dict, int]:
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return {"error": "Email et mot de passe requis"}, 400

    user = get_user_by_email(email)

    if user is None:
        return {"error": "Email ou mot de passe incorrect"}, 401

    # Vérifier que le hash est valide avant de comparer
    pw_hash = user.get("password_hash", "")
    if not pw_hash or not pw_hash.startswith("$2"):
        return {"error": "Compte invalide. Veuillez vous réinscrire."}, 401

    try:
        password_ok = bcrypt.check_password_hash(
            pw_hash,
            password.encode("utf-8")
        )
    except ValueError:
        return {"error": "Compte invalide. Veuillez vous réinscrire."}, 401

    if not password_ok:
        return {"error": "Email ou mot de passe incorrect"}, 401

    if not user.get("is_active", True):
        return {"error": "Compte desactive. Contactez le support."}, 403

    user_id = str(user["_id"])
    role    = user.get("role", "client")

    update_last_login(user_id)

    if role == "client":
        raw     = get_client_by_user_id(user_id)
        profile = serialize_client(raw) if raw else {}
    else:
        raw     = get_freelancer_by_user_id(user_id)
        profile = serialize_freelancer(raw) if raw else {}

    tokens = _make_tokens(user_id, role)

    return {
        "message":       "Connexion reussie",
        "access_token":  tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "user":          serialize_user(user),
        "profile":       profile,
        "redirect_to":   "/dashboard/client" if role == "client" else "/dashboard/freelancer",
    }, 200


# ── REFRESH ────────────────────────────────────────────────────────
def refresh_access_token(user_id: str, role: str) -> dict:
    return {
        "access_token": create_access_token(
            identity=user_id,
            additional_claims={"role": role}
        )
    }


# ── ME ─────────────────────────────────────────────────────────────
def get_current_user(user_id: str) -> tuple[dict, int]:
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "Utilisateur non trouve"}, 404
    role = user.get("role", "client")
    if role == "client":
        raw     = get_client_by_user_id(user_id)
        profile = serialize_client(raw) if raw else {}
    else:
        raw     = get_freelancer_by_user_id(user_id)
        profile = serialize_freelancer(raw) if raw else {}
    return {
        "user":        serialize_user(user),
        "profile":     profile,
        "redirect_to": "/dashboard/client" if role == "client" else "/dashboard/freelancer",
    }, 200


# ── CHANGE PASSWORD ────────────────────────────────────────────────
def change_password(user_id: str, data: dict) -> tuple[dict, int]:
    old_pw = data.get("old_password", "")
    new_pw = data.get("new_password", "")
    if not old_pw or not new_pw:
        return {"error": "Ancien et nouveau mot de passe requis"}, 400
    if len(new_pw) < 6:
        return {"error": "Minimum 6 caracteres"}, 400
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "Utilisateur non trouve"}, 404
    try:
        if not bcrypt.check_password_hash(user["password_hash"], old_pw.encode("utf-8")):
            return {"error": "Ancien mot de passe incorrect"}, 400
    except ValueError:
        return {"error": "Compte invalide"}, 400
    new_hash = bcrypt.generate_password_hash(new_pw.encode("utf-8")).decode("utf-8")
    update_user(user_id, {"password_hash": new_hash})
    return {"message": "Mot de passe modifie avec succes"}, 200


# ── HELPER ─────────────────────────────────────────────────────────
def _make_tokens(user_id: str, role: str) -> dict:
    claims = {"role": role}
    return {
        "access_token":  create_access_token(identity=user_id,  additional_claims=claims),
        "refresh_token": create_refresh_token(identity=user_id, additional_claims=claims),
    }