
import requests
import json
import datetime

BASE_URL = "http://127.0.0.1:8000/api"
EMAIL = "debug_user@example.com"
PASSWORD = "password123"

def run_debug():
    session = requests.Session()
    
    # 1. Register/Login
    print("--- 1. Authenticating ---")
    try:
        # Try login first
        login_payload = {"email": EMAIL, "password": PASSWORD, "username": EMAIL}
        res = session.post(f"{BASE_URL}/login/", json=login_payload)
        
        if res.status_code != 200:
            print("Login failed, trying register...")
            register_payload = {
                "username": EMAIL, 
                "email": EMAIL, 
                "password": PASSWORD,
                "first_name": "Debug User"
            }
            res = session.post(f"{BASE_URL}/users/", json=register_payload)
            print(f"Register Status: {res.status_code}")
            # Login again to get cookies if needed, though session might store them
            res = session.post(f"{BASE_URL}/login/", json=login_payload)
            
        print(f"Login Status: {res.status_code}")
        print("Cookies:", session.cookies.get_dict())
        
        # Get CSRF
        csrf = session.cookies.get('csrftoken')
        headers = {"X-CSRFToken": csrf, "Content-Type": "application/json"}
        
    except Exception as e:
        print(f"Auth Error: {e}")
        return

    # 2. Simulate User Data Payload (Task)
    print("\n--- 2. Testing Task Creation ---")
    task_payload = {
        "id": int(datetime.datetime.now().timestamp() * 1000), # Frontend sends timestamp int
        "titulo": "Tarea Debug",
        "fecha": datetime.datetime.now().strftime("%Y-%m-%d"),
        "horaInicio": "10:00",
        "horaFin": "11:00",
        "color": "azul",
        "espacio": "Personal",
        "completada": False
    }
    
    res = session.post(f"{BASE_URL}/tasks/", json=task_payload, headers=headers)
    print(f"Create Task Status: {res.status_code}")
    if res.status_code != 201:
        print("Error Details:", res.text)
        
    # 3. Simulate User Data Payload (Habit)
    print("\n--- 3. Testing Habit Creation ---")
    # Frontend logic: send 'registros' dictionary
    # Backend expects: 'registros_input'?
    habit_payload = {
        "id": int(datetime.datetime.now().timestamp() * 1000) + 1,
        "nombre": "Habito Debug",
        "registros": {
            datetime.datetime.now().strftime("%Y-%m-%d"): {"completado": True, "nota": "Test"}
        }
    }
    
    res = session.post(f"{BASE_URL}/habits/", json=habit_payload, headers=headers)
    print(f"Create Habit Status: {res.status_code}")
    if res.status_code != 201:
        print("Error Details:", res.text)
    else:
        print("Habit Created:", res.json())
        # Check if logs persisted
        if not res.json().get('registros'):
            print("WARNING: 'registros' is empty in response! Persistence logic likely failed.")

if __name__ == "__main__":
    run_debug()
