from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
import requests
import json
import re
import datetime
import io
import os
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import google.auth  # 👈 Importar la librería de autenticación de Google
from google.auth.transport.requests import Request  # 👈 Importante para refrescar las credenciales
import google.generativeai as genai  # Importación de la biblioteca de Gemini

# ============================
# CONFIGURACIÓN STRAVA
# ============================
# 🔹 CREDENCIALES DE STRAVA (OBTÉN ESTOS DATOS DESDE https://www.strava.com/settings/api)
STRAVA_CLIENT_ID = "147006"  # Reemplaza con tu Client ID
STRAVA_CLIENT_SECRET = "D:\\Programación\\SoloLeveling\\claves\\strava_client_secret.txt"
STRAVA_REFRESH_TOKEN = "D:\\Programación\\SoloLeveling\\claves\\strava_refresh_token.txt"
STRAVA_ACCESS_TOKEN = None  # Inicialmente vacío
TOKEN_EXPIRATION = None  # Guardaremos la fecha de expiración

# ============================
# CONFIGURACIÓN GEMINI
# ============================
# 🔹 CREDENCIALES DE GEMINI (OBTÉN LA API KEY DESDE Google AI Studio)
GEMINI_API_KEY_PATH = "D:\\Programación\\SoloLeveling\\claves\\gemini_api_key.txt"

def cargar_clave_desde_archivo(archivo_ruta):
    """
    Lee y devuelve la clave desde un archivo de texto.
    Elimina espacios en blanco al principio y al final de la clave.
    """
    try:
        with open(archivo_ruta, 'r') as f:
            clave = f.readline().strip()  # Lee la primera línea y elimina espacios en blanco
        return clave
    except FileNotFoundError:
        print(f"Error: Archivo de clave no encontrado: {archivo_ruta}")
        return None  # Devuelve None si el archivo no se encuentra

# Carga las claves desde los archivos
STRAVA_CLIENT_SECRET = cargar_clave_desde_archivo(STRAVA_CLIENT_SECRET)
STRAVA_REFRESH_TOKEN = cargar_clave_desde_archivo(STRAVA_REFRESH_TOKEN)

# Intentar cargar la API KEY de Gemini
try:
    GEMINI_API_KEY = cargar_clave_desde_archivo(GEMINI_API_KEY_PATH)
    if GEMINI_API_KEY:
        # Configurar Gemini con la API key
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ API Key de Gemini cargada correctamente")
    else:
        print("❌ No se pudo cargar la API Key de Gemini")
except Exception as e:
    print(f"❌ Error al configurar Gemini: {str(e)}")
    GEMINI_API_KEY = None

# 🔹 URL para obtener un nuevo `Access Token`
TOKEN_URL = "https://www.strava.com/oauth/token"

def refresh_access_token():
    """
    📌 Obtiene un nuevo access_token usando el refresh_token cuando el actual expira.
    """
    global STRAVA_ACCESS_TOKEN, TOKEN_EXPIRATION, STRAVA_REFRESH_TOKEN

    url = "https://www.strava.com/oauth/token"
    payload = {
        "client_id": STRAVA_CLIENT_ID,
        "client_secret": STRAVA_CLIENT_SECRET,
        "refresh_token": STRAVA_REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }

    response = requests.post(url, data=payload)
    if response.status_code == 200:
        data = response.json()
        STRAVA_ACCESS_TOKEN = data["access_token"]
        STRAVA_REFRESH_TOKEN = data["refresh_token"]  # A veces cambia, hay que actualizarlo
        TOKEN_EXPIRATION = datetime.datetime.fromtimestamp(data["expires_at"])
        print("✅ Nuevo token de acceso obtenido:", STRAVA_ACCESS_TOKEN)
    else:
        print("❌ Error al renovar token:", response.json())


def get_valid_access_token():
    """
    📌 Devuelve un `access_token` válido, renovándolo si ha caducado.
    """
    global TOKEN_EXPIRATION

    if not STRAVA_ACCESS_TOKEN or not TOKEN_EXPIRATION or datetime.datetime.now() >= TOKEN_EXPIRATION:
        refresh_access_token()

    return STRAVA_ACCESS_TOKEN

# Obtener el `Access Token`
ACCESS_TOKEN = get_valid_access_token()

def get_activities():
    """ Obtiene las actividades de los últimos 7 días en Strava """
    if not ACCESS_TOKEN:
        return {"error": "No se pudo obtener un Access Token"}

    url = "https://www.strava.com/api/v3/athlete/activities"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print("❌ Error al obtener actividades:", response.json())
        return {"error": "No se pudieron obtener las actividades"}


# ============================
# CONFIGURACIÓN GOOGLE
# ============================
SCOPES_GOOGLE_API = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive'
]
SERVICE_ACCOUNT_FILE = 'claves/calendario.json'

if not os.path.exists(SERVICE_ACCOUNT_FILE):
    print(f"❌ ERROR: No se encontró el archivo de credenciales en {SERVICE_ACCOUNT_FILE}")
    exit(1)

credentials_google = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES_GOOGLE_API)
    
# Conectar con Google Calendar y Google Drive (sin cambios)
try:
    service_calendar = build('calendar', 'v3', credentials=credentials_google)
    service_drive = build('drive', 'v3', credentials=credentials_google)
    print("✅ Conexión con Google Calendar y Drive establecida correctamente.")
except Exception as e:
    print(f"❌ ERROR al conectar con Google Calendar/Drive: {str(e)}")
    exit(1)

calendar_id = 'cuenta.ia.compartida.pablo@gmail.com'

# 🔹 FUNCIÓN PARA OBTENER EVENTOS DEL CALENDARIO
def get_events(start_time, end_time):
    """
    Obtiene los eventos del calendario entre dos fechas.
    """
    try:
        events_result = service_calendar.events().list(
            calendarId=calendar_id,
            timeMin=start_time,
            timeMax=end_time,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        return events_result.get('items', [])
    except Exception as e:
        print(f"❌ ERROR al obtener eventos del calendario: {str(e)}")
        return []

# 🔹 FUNCIÓN PARA OBTENER ARCHIVOS DE GOOGLE DRIVE
def get_drive_file(file_name):
    """
    Obtiene un archivo de Google Drive por su nombre.
    """
    try:
        results = service_drive.files().list(q=f"name='{file_name}'", fields="files(id, name)").execute()
        items = results.get('files', [])
        if not items:
            print(f"❌ ERROR: No se encontró el archivo {file_name} en Google Drive.")
            return None

        file_id = items[0]['id']
        request_file = service_drive.files().get_media(fileId=file_id)
        file_data = io.BytesIO()
        downloader = MediaIoBaseDownload(file_data, request_file)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        file_data.seek(0)
        print(f"✅ Archivo {file_name} descargado correctamente.")
        return pd.read_excel(file_data, sheet_name=None)

    except Exception as e:
        print(f"❌ ERROR al obtener el archivo de Google Drive: {str(e)}")
        return None

# ============================
# CONFIGURACIÓN DE LA APLICACIÓN FLASK
# ============================
app = Flask(__name__)
CORS(app)  # Habilitar CORS para permitir peticiones desde el frontend

# 📂 Verificar si Flask está detectando correctamente la carpeta de templates
print(f"📂 Flask está usando la carpeta de templates en: {os.path.abspath(app.template_folder)}")

# Agregar esta línea para debug de archivos estáticos
print(f"📂 Directorio estático de Flask: {app.static_folder}")

@app.route('/static/js/<path:filename>')
def serve_static(filename):
    """Servir archivos estáticos con cache-control desactivado"""
    print(f"🔍 Solicitud de archivo JS: {filename}")
    
    # Si el archivo es strava.js, redirigir a strava_v2.js
    #if filename == 'strava.js':
    #    filename = 'strava_v2.js'
    #    print(f"📝 Redirigiendo a: {filename}")
    
    try:
        response = send_from_directory(app.static_folder + '/js', filename)
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        print(f"✅ Sirviendo archivo JS: {filename}")
        return response
    except Exception as e:
        print(f"❌ Error sirviendo {filename}: {str(e)}")
        return f"Error: {str(e)}", 404

# 🔹 ENDPOINT PARA LA PÁGINA PRINCIPAL
@app.route('/')
def home():
    """
    Carga la página principal con index.html
    """
    template_path = os.path.join(app.template_folder, 'index.html')

    # Verifica si el archivo index.html existe
    if not os.path.exists(template_path):
        print(f"❌ ERROR: No se encuentra index.html en {template_path}")
        return f"❌ ERROR: No se encuentra index.html en {template_path}", 404

    print("✅ index.html encontrado. Cargando en el navegador...")
    return render_template('index.html', title="JD Leveling")

# 🔹 ENDPOINT PARA OBTENER EVENTOS DEL CALENDARIO
@app.route('/events', methods=['GET'])
def events():
    """
    Devuelve los eventos del día actual y del día siguiente.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    tomorrow = now + datetime.timedelta(days=1)
    now_iso = now.isoformat()
    tomorrow_iso = tomorrow.isoformat()

    events_today = get_events(now_iso, tomorrow_iso)

    if not events_today:
        print("📅 No hay eventos registrados en Google Calendar para hoy o mañana.")
    print("📤 JSON devuelto por /events:", events_today)  
    return jsonify(events_today)

# 🔹 ENDPOINT PARA OBTENER ACTIVIDADES DE STRAVA
@app.route('/strava/activities', methods=['GET'])
def strava_activities():
    """
    📌 Obtiene todas las actividades del usuario desde Strava.
    """
    try:
        access_token = get_valid_access_token()
        if not access_token:
            return jsonify({"error": "No se pudo obtener un Access Token"}), 401

        url = "https://www.strava.com/api/v3/athlete/activities"
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "per_page": 100,  # Máximo número de actividades por página
            "page": 1        # Primera página
        }

        print(f"🔍 Solicitando todas las actividades a Strava")
        print(f"- URL: {url}")
        print(f"- Per page: {params['per_page']}")

        response = requests.get(url, headers=headers, params=params)
        
        print("📋 Headers de respuesta:", dict(response.headers))
        
        if response.status_code != 200:
            print(f"❌ Error {response.status_code} de Strava:", response.text)
            return jsonify({"error": f"Error {response.status_code} de Strava"}), response.status_code

        activities = response.json()
        
        print(f"✅ Recibidas {len(activities)} actividades de Strava")
        for idx, activity in enumerate(activities):
            print(f"📅 Actividad {idx + 1}: {activity['name']} - {activity['start_date']}")

        return jsonify(activities)

    except Exception as e:
        print("❌ Error en strava_activities:", str(e))
        return jsonify({"error": str(e)}), 500

# 🔹 ENDPOINT PARA OBTENER DATOS DEL ARCHIVO EXCEL
def format_heroe_data(df_heroe):
    """
    Formatea los datos de la hoja HEROE en un diccionario JSON.
    """
    return {row['Atributo']: row['Valor'] for _, row in df_heroe.iterrows()}

@app.route('/load_excel', methods=['GET'])
def load_excel():
    """
    Carga el archivo Excel desde Google Drive y devuelve la información de la hoja 'HEROE'.
    """
    file_name = 'RPG_LifeMaker.xlsx'
    sheets = get_drive_file(file_name)

    if sheets is None:
        return jsonify({"error": "No se pudo obtener el archivo"}), 404

    if 'HEROE' not in sheets:
        return jsonify({"error": "No se encontró la hoja HEROE"}), 404

    df_heroe = sheets['HEROE']
    return jsonify(format_heroe_data(df_heroe))

@app.route('/load_enemies', methods=['GET'])
def load_enemies():
    """Carga la hoja de Enemigos del archivo Excel."""
    file_name = 'RPG_LifeMaker.xlsx'
    sheets = get_drive_file(file_name)

    if sheets is None:
        return jsonify({"error": "No se pudo obtener el archivo"}), 404

    if 'ENEMIGOS' not in sheets:
        return jsonify({"error": "No se encontró la hoja Enemigos"}), 404

    df_enemies = sheets['Enemigos']
    return jsonify(df_enemies.to_dict('records'))

@app.route('/load_rules', methods=['GET'])
def load_rules():
    """Carga la hoja de REGLAS del archivo Excel."""
    file_name = 'RPG_LifeMaker.xlsx'
    sheets = get_drive_file(file_name)

    if sheets is None:
        return jsonify({"error": "No se pudo obtener el archivo"}), 404

    if 'REGLAS' not in sheets:
        return jsonify({"error": "No se encontró la hoja REGLAS"}), 404

    df_rules = sheets['REGLAS']
    contenido = df_rules.iloc[0,0] if not df_rules.empty else "No hay reglas disponibles"
    return jsonify({"contenido": contenido})

SYSTEM_PROMPT = """
🎭 **ROL DEL MODELO: Dungeon Master Inteligente y Adaptativo**  
Eres un Dungeon Master altamente inmersivo y adaptable.  
Tu misión es dirigir una aventura de rol en la que el jugador pueda tomar cualquier decisión y el mundo reaccionará lógicamente.  

📌 **Reglas del Juego:**  
✔️ **Empieza la aventura de inmediato, sin esperar instrucciones.**  
✔️ **No expliques reglas, simplemente actúa como el Dungeon Master.**  
✔️ **Cada personaje tiene motivaciones y personalidad propia.**  
✔️ **El jugador puede sugerir cualquier acción, incluso si no la propusiste.**  
✔️ **No repitas opciones si el jugador intenta algo nuevo.**  

📜 **Estructura de Respuesta:**  
1️⃣ **Narración del entorno y situación actual.**  
2️⃣ **Reacciones de PNJs o del mundo ante las decisiones del jugador.**  
3️⃣ **Si la acción requiere decisión incierta, usa lógica y probabilidad.**  
4️⃣ **Cierra cada respuesta dejando en claro que el jugador puede tomar una nueva decisión.**  
"""

@app.route("/api", methods=["POST"])
def chat_with_gemini():
    """Recibe un mensaje del usuario y lo envía a Gemini"""
    try:
        data = request.json
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"response": "No se recibió un mensaje válido"}), 400

        # Verificar que tenemos la API key configurada
        if not GEMINI_API_KEY:
            return jsonify({"response": "Error: API Key de Gemini no configurada"}), 500

        try:
            # Configurar el modelo de Gemini
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Crear una conversación con el prompt del sistema
            chat = model.start_chat(history=[
                {
                    "role": "user",
                    "parts": [SYSTEM_PROMPT]
                },
                {
                    "role": "model",
                    "parts": ["Entendido, actuaré como un Dungeon Master inmersivo y adaptativo."]
                }
            ])
            
            # Enviar el mensaje del usuario
            response = chat.send_message(user_message)
            
            # Extraer la respuesta
            bot_response = response.text
            
            # Limpiar la respuesta si es necesario
            bot_response = re.sub(r"<think>.*?</think>", "", bot_response, flags=re.DOTALL)
            bot_response = re.sub(r"\\boxed{(.*?)}", r"\1", bot_response)
            bot_response = bot_response.strip()
            
            return jsonify({"response": bot_response})
            
        except Exception as e:
            print(f"❌ Error específico de Gemini: {str(e)}")
            return jsonify({"response": f"Error al comunicarse con Gemini: {str(e)}"}), 500

    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        return jsonify({"response": f"Error: {str(e)}"}), 500

# 🔹 INICIAR SERVIDOR
if __name__ == "__main__":
    print("🚀 Servidor iniciado en http://localhost:8080")
    app.run(debug=True, port=8080, host='0.0.0.0')
