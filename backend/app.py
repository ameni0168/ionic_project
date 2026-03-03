from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
from config import Config

mongo = PyMongo()

def create_app():
    app = Flask(__name__)
    app.config["MONGO_URI"] = Config.MONGO_URI

    mongo.init_app(app)
    CORS(app)

    from routes.freelancer_routes import freelancer_bp
    from routes.category_routes import category_bp

    app.register_blueprint(freelancer_bp, url_prefix="/api")
    app.register_blueprint(category_bp, url_prefix="/api")

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)