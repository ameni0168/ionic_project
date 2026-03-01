from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permet à Ionic d'accéder à l'API

@app.route('/')
def home():
    return "Backend Flask fonctionne 🚀"

@app.route('/api/test')
def test():
    return jsonify({"message": "API OK"})

if __name__ == '__main__':
    app.run(debug=True)