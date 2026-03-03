from flask import Blueprint, request, jsonify
from app import mongo

freelancer_bp = Blueprint("freelancer_bp", __name__)

# =============================
# 1️⃣ Top Rated Experts
# =============================
@freelancer_bp.route("/freelancer/top", methods=["GET"])
def get_top_freelancer():

    freelancer = list(
        mongo.db.freelancer.find().sort("rating", -1).limit(5)
    )

    for f in freelancer:
        f["_id"] = str(f["_id"])

    return jsonify(freelancer)


# =============================
# 2️⃣ High Job Success
# =============================
@freelancer_bp.route("/freelancer/high-success", methods=["GET"])
def get_high_success():

    freelancer = list(
        mongo.db.freelancer.find({
            "jobSuccess": {"$gte": 90}
        }).sort("jobSuccess", -1).limit(10)
    )

    for f in freelancer:
        f["_id"] = str(f["_id"])

    return jsonify(freelancer)


# =============================
# 3️⃣ Local Talent (Tunisia)
# =============================
@freelancer_bp.route("/freelancer/local", methods=["GET"])
def get_local_freelancer():

    location = request.args.get("location", "Tunisia")

    freelancer = list(
        mongo.db.freelancer.find({
            "location": location
        }).limit(10)
    )

    for f in freelancer:
        f["_id"] = str(f["_id"])

    return jsonify(freelancer)


# =============================
# 4️⃣ Filter + Search
# =============================
@freelancer_bp.route("/freelancer", methods=["GET"])
def get_freelancers():

    category = request.args.get("category")
    if category:
        query["category"] = category

    subCategory = request.args.get("subCategory")
    if subCategory:
        query["subCategory"] = subCategory

    search = request.args.get("search")
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    location = request.args.get("location")
    if location:
        query["location"] = location

    freelancer = list(mongo.db.freelancer.find())

    for f in freelancer:
        f["_id"] = str(f["_id"])

    return jsonify(freelancer)