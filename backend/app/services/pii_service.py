# services/pii_service.py
from openai import OpenAI
import json, os

# Client Groq — interface identique à OpenAI
_client = OpenAI(
    api_key=os.getenv('GROQ_API_KEY'),
    base_url='https://api.groq.com/openai/v1'
)

# Instructions permanentes données au LLM (System Prompt)
SYSTEM_PROMPT = """Tu es un filtre de securite pour une plateforme freelance.
Analyse le message et detecte toute donnee personnelle (PII).

Detecte :
- Adresse email (ex: jean@gmail.com, 'mon mail c est jean point...')
- Numero de telephone (tous formats : +213, 06, 07...)
- Nom complet (prenom + nom ensemble)
- Numero de carte bancaire ou IBAN
- Adresse postale
- Liens : WhatsApp, Telegram, LinkedIn, Instagram...
- Tentatives de contournement en langage naturel

Reponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "contains_pii": true | false,
  "pii_types": ["email", "phone", "name", ...],
  "explanation": "Explication courte en francais pour l'utilisateur",
  "severity": "low" | "medium" | "high"
}"""

def analyze_message(text: str) -> dict:
    if not os.getenv("GROQ_API_KEY"):
        print("[PII Error] GROQ_API_KEY is missing")
        return {
            "contains_pii": False,
            "pii_types": [],
            "explanation": "",
            "severity": "none"
        }

    try:
        response = _client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            max_tokens=300,
            temperature=0,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': text}
            ]
        )
        raw = response.choices[0].message.content.strip()
        # Nettoyer si Groq ajoute des balises markdown
        raw = raw.removeprefix('```json').removeprefix('```')
        raw = raw.removesuffix('```').strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        # JSON invalide -> laisser passer sans bloquer
        return {'contains_pii': False, 'pii_types': [],
                'explanation': '', 'severity': 'none'}
    except Exception as e:
        print(f'[PII Error] {e}')
        return {'contains_pii': False, 'pii_types': [],
                'explanation': '', 'severity': 'none'}
