from flask import Blueprint, jsonify
from app import mongo

category_bp = Blueprint("category_bp", __name__)

@category_bp.route("/categories", methods=["GET"])
def get_categories():

    categories = list(mongo.db.categories.find())

    for c in categories:
        c["_id"] = str(c["_id"])

    return jsonify(categories)