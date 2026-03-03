# run.py
from app import create_app
from dotenv import load_dotenv
import os
import sys

# Charger .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"🔄 Chargement du .env depuis: {env_path}")
print(f"📁 Fichier existe? {os.path.exists(env_path)}")

load_dotenv(env_path)

# Vérifier que c'est chargé
mongo_uri = os.getenv('MONGO_URI')
print(f"📌 MONGO_URI après chargement: {mongo_uri}")

if not mongo_uri:
    print("❌ ERREUR: MONGO_URI toujours pas chargé!")
    sys.exit(1)

# Créer l'app UNE SEULE fois
app = create_app()

if __name__ == "__main__":
    print("🚀 Démarrage du serveur Flask...")
    # Désactiver le debug reloader qui cause le problème
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)