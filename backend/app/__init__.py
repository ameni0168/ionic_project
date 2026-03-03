# app/__init__.py
# VERSION COMPLÈTE ET CORRIGÉE

from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv

# Instance PyMongo globale
mongo = PyMongo()

def create_app():
    app = Flask(__name__)
    
    # ==================== CONFIGURATION ====================
    
    # Récupérer les variables d'environnement (déjà chargées dans run.py)
    mongo_uri = os.getenv("MONGO_URI")
    secret_key = os.getenv("SECRET_KEY")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    
    # Afficher les infos de debug
    print("=" * 50)
    print("🔍 CONFIGURATION APPLICATION")
    print("=" * 50)
    print(f"📌 MONGO_URI: {mongo_uri[:50] if mongo_uri else 'None'}...")
    print(f"📌 SECRET_KEY: {'Présente' if secret_key else 'Manquante'}")
    print(f"📌 JWT_SECRET_KEY: {'Présente' if jwt_secret_key else 'Manquante'}")
    
    # Configurer l'application
    app.config["MONGO_URI"] = mongo_uri
    app.config["SECRET_KEY"] = secret_key
    app.config["JWT_SECRET_KEY"] = jwt_secret_key
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    
    # Configuration upload
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    app.config['UPLOAD_FOLDER'] = 'uploads'
    
    # ==================== CORS ====================
    CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:8100",
            "http://localhost:8101", 
            "http://localhost:8102",
            "http://localhost:8103",  # ← AJOUTEZ VOTRE PORT
            "http://192.168.118.73:8100",
            "http://192.168.118.73:8103"
        ],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600  # Cache preflight requests for 10 minutes
    }
})
    
    # ==================== INITIALISATION MONGODB ====================
    
    # Initialiser PyMongo
    mongo.init_app(app)
    
    # Tester la connexion MongoDB
    with app.app_context():
        try:
            from pymongo import MongoClient
            import certifi
            
            client = MongoClient(
                app.config["MONGO_URI"], 
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where()
            )
            client.admin.command('ping')
            print("✅ Connexion MongoDB réussie!")
            
            # Voir les bases disponibles
            dbs = client.list_database_names()
            print(f"📚 Bases disponibles: {dbs}")
            
            # Vérifier/Créer la base freelancehub
            if 'freelancehub' not in dbs:
                print("📝 La base 'freelancehub' sera créée à la première insertion")
            
            # Vérifier les collections
            db = client['freelancehub']
            collections = db.list_collection_names()
            print(f"📁 Collections existantes: {collections}")
            
        except Exception as e:
            print(f"❌ Erreur de connexion MongoDB: {e}")
    
    # Rendre mongo accessible via app.mongo
    app.mongo = mongo
    
    # ==================== INITIALISATION JWT ====================
    
    jwt = JWTManager(app)
    
    # ==================== JWT ERROR HANDLERS ====================
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"error": "Token has expired", "message": "Please login again"}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"error": "Invalid token"}, 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {"error": "Authorization required"}, 401
    
    @jwt.token_verification_failed_loader
    def token_verification_failed_callback(jwt_header, jwt_payload):
        return {"error": "Token verification failed"}, 401
    
    # ==================== BLUEPRINTS ====================
    
    try:
        # Route auth existante
        from app.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        print("✅ Blueprint auth enregistré")
        
        # Routes freelancer
        from app.routes.freelancer_routes import freelancer_bp
        app.register_blueprint(freelancer_bp, url_prefix="/api/freelancer")
        print("✅ Blueprint freelancer enregistré")
        
        # Routes gigs
        from app.routes.gig_routes import gig_bp
        app.register_blueprint(gig_bp, url_prefix="/api/gigs")
        print("✅ Blueprint gigs enregistré")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'enregistrement des blueprints: {e}")
    
    print("=" * 50)
    
    # ==================== ROUTES PRINCIPALES ====================
    
    @app.route('/')
    def index():
        return {
            "message": "FreelanceHub API",
            "status": "running",
            "version": "1.0.0",
            "endpoints": {
                "auth": "/api/auth/*",
                "freelancer": "/api/freelancer/*",
                "gigs": "/api/gigs/*",
                "health": "/api/health"
            }
        }
    
    @app.route('/api/health')
    def health():
        """Endpoint de vérification de santé"""
        # Test connexion MongoDB
        try:
            mongo.db.command('ping')
            db_status = "connected"
            db_details = "OK"
        except Exception as e:
            db_status = "disconnected"
            db_details = str(e)
        
        return {
            "status": "ok",
            "database": {
                "status": db_status,
                "details": db_details
            },
            "server": "running",
            "timestamp": str(datetime.now()),
            "message": "FreelanceHub API is running"
        }
    
    @app.route('/api/debug/env')
    def debug_env():
        """Endpoint de debug pour vérifier les variables d'environnement"""
        if os.getenv('FLASK_ENV') == 'development':
            return {
                "mongo_uri": os.getenv("MONGO_URI", "Non défini")[:50] + "...",
                "secret_key": "Présente" if os.getenv("SECRET_KEY") else "Manquante",
                "jwt_secret": "Présente" if os.getenv("JWT_SECRET_KEY") else "Manquante"
            }
        return {"error": "Debug mode disabled"}, 403
    
    # ==================== ERROR HANDLERS ====================
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            "error": "Resource not found",
            "message": "The requested URL was not found on the server"
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }, 500
    
    print("🚀 Application Flask créée avec succès!")
    print("=" * 50)
    
    return app

# Import datetime pour les timestamps
from datetime import datetime