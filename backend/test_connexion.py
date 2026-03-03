# test_connexion.py
from pymongo import MongoClient
import certifi
import ssl

# Votre URI
uri = "mongodb+srv://Ameni:ameni123@cluster0.g13wqla.mongodb.net/freelancehub?retryWrites=true&w=majority&appName=Cluster0"

print("=" * 50)
print("🔍 TEST DE CONNEXION MONGODB ATLAS")
print("=" * 50)

print(f"📌 URI: {uri}")
print()

try:
    # Option 1: Connexion simple
    print("🔄 Tentative de connexion...")
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    
    # Ping
    client.admin.command('ping')
    print("✅ SUCCÈS: Connecté à MongoDB!")
    
    # Liste les bases
    dbs = client.list_database_names()
    print(f"📚 Bases de données disponibles: {dbs}")
    
    # Vérifie si freelancehub existe
    if 'freelancehub' in dbs:
        print("✅ Base 'freelancehub' existe")
        db = client.freelancehub
        collections = db.list_collection_names()
        print(f"📁 Collections: {collections}")
    else:
        print("⚠️ Base 'freelancehub' n'existe pas encore")
        print("   Elle sera créée automatiquement à la première insertion")
    
except Exception as e:
    print(f"❌ ERREUR: {e}")
    print()
    print("💡 SUGGESTIONS:")
    print("1. Vérifiez que votre IP est autorisée dans Atlas (Network Access)")
    print("2. Vérifiez que le nom d'utilisateur et mot de passe sont corrects")
    print("3. Essayez avec l'option tlsCAFile=certifi.where()")
    
    # Tentative avec certificat
    try:
        print("\n🔄 Tentative avec certificat SSL...")
        client2 = MongoClient(uri, 
                             serverSelectionTimeoutMS=10000,
                             tlsCAFile=certifi.where())
        client2.admin.command('ping')
        print("✅ SUCCÈS avec certificat!")
    except Exception as e2:
        print(f"❌ Échec avec certificat: {e2}")

print("=" * 50)