# ONE — Organizador personal offline-first

ONE es una aplicación de organización personal pensada para **gestionar la vida diaria de forma sencilla, rápida y fácil de adoptar**, sin importar si el usuario es estudiante, trabaja o solo quiere orden.  
Me inspiré en herramientas que uso todos los días (como Tweek y Notion): quería algo **directo y visual**, pero con **orden real**, y que **no dependa del internet** para funcionar.

La app sigue una filosofía **offline-first**: primero guarda todo de forma local y, si hay backend/conexión, puede sincronizar como respaldo.

---

## ¿Qué incluye ONE?

ONE está dividida en secciones claras, cada una con un propósito concreto:

- **Semana**: gestión diaria de tareas por día/semana.
- **Proyectos**: objetivos grandes con tareas asociadas y progreso.
- **Hábitos**: seguimiento visual de constancia por días.
- **Dashboard**: resumen general con progreso y estadísticas.
- **Focus**: modo enfoque con temporizador y sonidos ambientales.
- **Horario**: gestión del horario de clases (días, horas, materia, profesor, salón).
- **Finanzas**: control de gastos y presupuestos mensuales.
- **Perfil / Capacidad / Notificaciones**: secciones de apoyo para carga, datos del usuario y avisos.

---

## Lo más importante: offline-first

- La app **funciona sin internet**.
- Los datos se guardan localmente en el navegador.
- Si el backend está activo, la información puede sincronizarse.
- No se pierden cambios aunque se vaya la conexión.

---

## Tecnologías

**Frontend**
- HTML, CSS y JavaScript (sin frameworks)
- Chart.js para gráficas
- IndexedDB para almacenamiento local

**Backend**
- Python + Django
- Django REST Framework
- SQLite (desarrollo)
- API REST para sincronización

---

## Estructura del proyecto

```text
one/
  frontend/   # Interfaz (HTML, CSS, JS)
  backend/    # API y base de datos (Django)
```

---

## Cómo correr el proyecto

### Backend
```bash
cd one/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd one/frontend
python -m http.server 3000
```

Abrir en el navegador:
- http://localhost:3000/pages/login.html

> Recomendación: no abrir los HTML con `file://`, usar siempre un servidor local.

---

## Autor

**Luis Ernesto Mérida de León**  
Proyecto académico — Organizador personal offline-first.
