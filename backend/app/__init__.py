from datetime import timedelta
import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from app.extension import socketio
# from app.socket import chat_socket
from app.routes.auth_routes       import auth_bp
from app.routes.freelancer_routes import freelancer_bp
from app.routes.client_routes import client_bp
from app.routes.gig_routes        import gig_bp
from app.routes.order_routes      import order_bp, catalog_bp
from app.routes.job_routes        import job_bp
from app.routes.proposal_routes        import proposal_bp
from app.routes.chat import chat_bp


from app.routes.admin_routes import admin_bp
from app.routes.contract_routes import contract_bp
from app.routes.sprint_plan_routes import sprint_plan_bp
from app.routes.sprint_routes import sprint_bp
from app.routes.payment_routes import payment_bp



load_dotenv()

jwt = JWTManager()
# socketio = SocketIO(cors_allowed_origins="*")   # IMPORTANT


def create_app():
    app = Flask(__name__)
    CORS(app,
     resources={r"/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
    jwt.init_app(app)
    socketio.init_app(app)

    mongo_uri = os.getenv("MONGO_URI")
    client    = MongoClient(mongo_uri)
    db_name   = mongo_uri.split("/")[-1].split("?")[0]
    app.db    = client[db_name]

    app.register_blueprint(auth_bp,       url_prefix="/api/auth")
    app.register_blueprint(freelancer_bp, url_prefix="/api/freelancer")
    app.register_blueprint(gig_bp,        url_prefix="/api/gigs")
    app.register_blueprint(order_bp,      url_prefix="/api/orders")
    app.register_blueprint(catalog_bp,    url_prefix="/api/catalog")
    app.register_blueprint(client_bp,        url_prefix="/api/client")
    app.register_blueprint(job_bp,           url_prefix="/api/jobs")
    app.register_blueprint(proposal_bp,           url_prefix="/api/proposals")
    app.register_blueprint(admin_bp,         url_prefix="/api/admin")
    app.register_blueprint(contract_bp,      url_prefix="/api/contracts")
    app.register_blueprint(sprint_plan_bp,   url_prefix="/api")
    app.register_blueprint(sprint_bp,        url_prefix="/api/sprints")
    app.register_blueprint(payment_bp,       url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    from app.socket import chat_socket   # IMPORTANT




    return app
