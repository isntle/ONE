
import urllib.request
import urllib.parse
import json
import http.cookiejar
import datetime

BASE_URL = "http://127.0.0.1:8000/api"
EMAIL = "debug_user_v2@example.com"
PASSWORD = "password123"

# Setup cookie jar
cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
urllib.request.install_opener(opener)

def make_request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data_bytes = None
    
    # Add CSRF if available
    csrf_cookie = None
    for cookie in cookie_jar:
        if cookie.name == 'csrftoken':
            csrf_cookie = cookie.value
            break
    
    if csrf_cookie:
        headers['X-CSRFToken'] = csrf_cookie

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with opener.open(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

def run_debug():
    print("--- 1. Authenticating ---")
    # Try login
    login_payload = {"email": EMAIL, "password": PASSWORD, "username": EMAIL}
    status, body = make_request(f"{BASE_URL}/login/", 'POST', login_payload)
    
    if status != 200:
        print("Login failed/User missing. Registering...")
        reg_payload = {"username": EMAIL, "email": EMAIL, "password": PASSWORD, "first_name": "Debug V2"}
        status, body = make_request(f"{BASE_URL}/users/", 'POST', reg_payload)
        print(f"Register: {status}")
        # Login again
        status, body = make_request(f"{BASE_URL}/login/", 'POST', login_payload)
    
    print(f"Login: {status}")
    if status != 200:
        print("Auth failed.")
        return

    # 2. Task (Integer ID test)
    print("\n--- 2. Testing Task (Integer ID) ---")
    task_id = int(datetime.datetime.now().timestamp() * 1000)
    task_payload = {
        "id": task_id, 
        "titulo": f"Tarea IntID {task_id}",
        "fecha": datetime.datetime.now().strftime("%Y-%m-%d"),
        "horaInicio": "10:00",
        "horaFin": "11:00",
        "color": "verde",
        "espacio": "Personal",
        "completada": False
    }
    
    status, body = make_request(f"{BASE_URL}/tasks/", 'POST', task_payload)
    print(f"Create Task: {status}")
    if status not in [200, 201]:
        print(f"ERROR: {body}")
    else:
        print("Task Created OK.")

    # 3. Habit (Registros mapping test)
    print("\n--- 3. Testing Habit (Log Mapping) ---")
    habit_id = task_id + 1
    today_iso = datetime.datetime.now().strftime("%Y-%m-%d")
    habit_payload = {
        "id": habit_id,
        "nombre": "Habito Logs Test",
        "registros": {
            today_iso: {"completado": True, "nota": "Funciona?"}
        }
    }
    
    status, body = make_request(f"{BASE_URL}/habits/", 'POST', habit_payload)
    print(f"Create Habit: {status}")
    if status not in [200, 201]:
        print(f"ERROR: {body}")
    else:
        print("Habit Created OK.")
        # Verify logs in response
        if body.get('registros') and today_iso in body['registros']:
            print("LOGS PERSISTED: YES")
        else:
            print(f"LOGS PERSISTED: NO. Response: {body}")

if __name__ == "__main__":
    run_debug()
