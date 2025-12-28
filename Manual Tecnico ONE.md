# Manual Técnico — ONE

**Fecha:** 2025-12-27  
**Autor:** Luis Ernesto Mérida de León  

---

## Índice

1. [Contexto y propósito](#1-contexto-y-propósito)  
2. [Visión de la aplicación (lo que quise construir)](#2-visión-de-la-aplicación-lo-que-quise-construir)  
3. [Estructura del proyecto](#3-estructura-del-proyecto)  
4. [Cómo correr la aplicación](#4-cómo-correr-la-aplicación)  
5. [Arquitectura: Offline-first + sincronización](#5-arquitectura-offline-first--sincronización)  
6. [Frontend (HTML/CSS/JS)](#6-frontend-htmlcssjs)  
7. [Backend (Django + API)](#7-backend-django--api)  
8. [Sincronización: qué se manda, cuándo y cómo](#8-sincronización-qué-se-manda-cuándo-y-cómo)  
9. [APIs externas y permisos](#9-apis-externas-y-permisos)  
10. [Checklist de pruebas](#10-checklist-de-pruebas)  
11. [Problemas típicos y solución](#11-problemas-típicos-y-solución)  
12. [Limitaciones y mejoras futuras](#12-limitaciones-y-mejoras-futuras)  
13. [Apéndices](#13-apéndices)  

---

## 1. Contexto y propósito

Este documento explica cómo está construida mi aplicación, cómo se ejecuta, cómo fluye la información, y cómo funciona la sincronización.

Mi intención con el manual es que cualquier persona pueda:

- Entender la **idea general** del proyecto.
- Saber **cómo correrlo** sin perderse.
- Ubicar cada parte del código: **dónde vive cada cosa y para qué sirve**.
- Entender el **flujo real**: datos en pantalla → guardado local → sincronización con backend.

---

## 2. Visión de la aplicación

La idea de la aplicación que quise construir es una que permita **gestionar la vida de los usuarios**, sin depender de qué tipo de usuario es: ya sea un estudiante, una persona normal o una persona trabajadora.

La idea de mi aplicación es **gestionar la vida del usuario** de una manera:

- **Rápida**
- **Sencilla**
- **Fácil de adoptar** (algo que la gente pueda usar sin sentirse abrumada)

Para la aplicación que construí me inspiré mucho en aplicaciones que uso en mi vida diaria, como **Tweek** y **Notion**.

Algo que también quise cuidar es que ONE pudiera funcionar incluso si se va el internet, y por eso me enfoqué en una estructura **offline-first**, donde primero se guarda local y luego, cuando ya hay conexión, se sincroniza.

### 2.1 Por qué nació ONE

Aunque ONE se ve como una app de productividad “más”, en realidad nació de algo muy simple: **durante varios semestres (y en mi vida en general) sentía que, aunque soy organizado, con tantas cosas por hacer me podía perder**.  
Yo quería una forma clara de **tener control**: qué toca hacer, cuándo, en qué contexto, y qué tanto avance llevo.

Con el tiempo probé varias herramientas:

- **Tweek** me gustó muchísimo porque es **rápida, directa y fácil de usar**. Yo literalmente la uso en el día a día para anotar cosas.
- **Notion** me encanta por todo lo que permite hacer, pero también detecté algo: tiene **tantas opciones** que a veces me abruma y termino sin usarlo para lo “rápido” del día a día.
- También me influenciaron cosas como **Microsoft To Do**, **Notas del iPhone**, **Bloc de notas**, e incluso el hábito de mucha gente de anotarse cosas en **WhatsApp**.

El punto es que yo veía esto:

- Si uso algo **muy sencillo**, me falta orden (por ejemplo, separar bien mi vida).
- Si uso algo **muy completo**, me tardo más y me abruma.
- Y si uso mil cosas diferentes, termino con todo **regadísimo**.

Ahí fue cuando dije: “quiero una app que sea como una **fusión entre Tweek y Notion**, pero aterrizada, sencilla y adoptable”.

### 2.2 El problema específico que quise resolver

Una cosa que detecté muy rápido es que en apps tipo Tweek se me mezclaba todo:

- Escuela con vida personal
- Trabajo con pendientes de salud
- Cosas pequeñas con proyectos grandes

Yo quería que el usuario pudiera separar su vida por **espacios** (por ejemplo: *Personal, Escuela, Trabajo*) para que no se mezcle todo y para que sea más fácil “ver” tu vida sin ruido.

Además, yo noté que **no basta con tener tareas sueltas**. Muchas veces lo que haces es trabajar en algo grande (un proyecto) y dentro de eso hay un montón de tareas pequeñas.  
Por ejemplo, una certificación o un objetivo grande no es “una tarea”; son muchas actividades con un mismo objetivo. Por eso decidí incluir **proyectos** y la idea de que tengan **tareas asociadas**.

Y también me pasó con los **hábitos**: muchas veces no los cumples no porque “no quieras”, sino porque:

- Se te olvidan
- No los tienes presentes
- No puedes ver tu avance de forma visual

Por eso implementé hábitos con una lógica visual tipo cuadrícula (inspiración estilo GitHub) para que el progreso sea claro y motivante.

### 2.3 Algo que para mí era clave: que funcionara sin internet (offline-first)

Otra necesidad real que yo veía (y que sí me frustraba en otras apps) es que a veces:

- vas en el metro,
- se va el internet,
- se cae la app,
- o se pierde lo que acabas de escribir.

Entonces decidí priorizar algo muy importante para mí: que ONE fuera **offline-first**.  
Eso significa que la app **no depende de internet para funcionar**: primero guarda localmente y luego, cuando vuelve la conexión, se sincroniza.

(En este manual técnico lo explico a fondo en la sección de arquitectura offline-first, pero aquí lo menciono porque **sí es parte del porqué del proyecto**: lo hice pensando en la vida real.)

### 2.4 Misión

La misión de ONE es:

- Ayudar a que el usuario **gestione su vida** (sin importar si es estudiante, trabajador o cualquier persona).
- Que lo haga de una forma **sencilla, rápida y adoptable**.
- Que tenga orden por **espacios**, y que no se mezcle todo.
- Que el usuario pueda ver y controlar tareas, proyectos y hábitos sin sentirse abrumado.
- Y que la app sea confiable incluso sin internet.

### 2.5 Visión (a dónde quiero llevar el proyecto)

Yo sí le veo futuro a mi aplicación. Mi visión es:

- **Seguirla después de la materia**, no dejarla ahí.
- Desplegarla para que otras personas la puedan usar de verdad.
- A mediano plazo, crear también una **app móvil** (porque la mayoría de la gente usa mucho el teléfono).
- Integrar **inteligencia artificial** para cosas como:
  - detectar si tu semana está muy cargada,
  - recomendar ajustes reales,
  - estimar mejor tiempos de tareas densas,
  - y dar retroalimentación como “vas bajando esta semana, te conviene mover esto”.

Algo importante: me gustaría que, si algún día se monetiza, sea **justo**.  
Yo he visto apps que cobran caro por cosas que no lo valen; yo no quiero que el usuario sienta que es un “robo”, sino que realmente diga: “sí vale la pena”.

También quiero escuchar feedback real. Muchas apps grandes ignoran a la comunidad; yo con ONE sí quiero construir en base a lo que la gente necesita.

### 2.6 Objetivo general del proyecto

El objetivo general de ONE es:

- **Ayudar a gestionar la vida del usuario** con una app sencilla, rápida y confiable, centralizando tareas, proyectos y hábitos, y evitando que se pierdan datos aunque no haya internet.

### 2.7 Objetivos específicos (lo que busqué lograr)

**Objetivos enfocados al usuario**

- Que el usuario pueda separar su vida por **espacios** para no mezclar todo.
- Que pueda ver su información en diferentes vistas (por ejemplo, por día/semana/mes) para que se adapte a cómo trabaja cada quien.
- Que el progreso se sienta **visual y motivante** (dashboard, rachas, gráficas, hábitos tipo cuadrícula).
- Que exista un modo para enfocarse (pomodoro / enfoque) y evitar distracciones.

**Objetivos técnicos**

- Reforzar mis bases de **HTML, CSS y JavaScript** construyendo una app completa sin frameworks.
- Aprender e integrar un **backend real** con Django + API.
- Conectar frontend-backend con rutas claras para guardar y sincronizar datos.
- Implementar una arquitectura **offline-first** con base local y sincronización.

**Objetivos de producto (pensando a futuro)**

- Construir algo que no sea “solo para sacar una calificación”, sino una base real para convertirlo en producto.
- Dejar la app lista para crecer (más funciones, IA, móvil, despliegue, etc.).

### 2.8 Alcance actual y límites (para ser honesto)

ONE es una aplicación grande y completa, pero también es importante decirlo claro:

- Este proyecto lo desarrollé **yo solo** y en un periodo aproximado de **4 meses**.
- Elegí priorizar **funcionalidad real** (offline-first, orden por espacios, experiencia simple) antes que meter cosas como IA desde el inicio.
- Hay ideas que me encantaría agregar después (IA, móvil, mejoras extra), pero preferí primero construir una base sólida que sí sea útil desde ya.

---

## 3. Estructura del proyecto

El proyecto vive dentro de dos carpetas:

- `one/frontend/` → **HTML + CSS + JS** (lo que se ve en el navegador)
- `one/backend/` → **Django** (API + base de datos + autenticación)

### 3.1 Resumen rápido de qué hay en cada lado

- Frontend:
  - Páginas en (login, semana, proyectos, hábitos, dashboard, etc.)
  - Estilos
  - Lógica
  - Íconos/audio/imágenes

- Backend:
  - Proyecto Django
  - Apps por módulo: `accounts`, `spaces`, `tasks`, `projects`, `habits` (y `sync` como base)
  - Base de datos SQLite
  - Dependencias

---

## 4. Cómo correr la aplicación

Aquí va lo más “operativo”: **lo que alguien debe hacer para levantar el proyecto**.

### 4.1 Requisitos

- Python instalado (recomendado: **3.10 o superior**, porque el backend usa Django 5.x).
- `pip` funcionando.
- Un servidor simple para el frontend (por ejemplo, Live Server de VS Code o `python -m http.server`).

---

### 4.2 Correr el backend (Django)

1) Entra a la carpeta del backend:

```bash
cd one/backend
```

2) Crea y activa un entorno virtual.

**macOS / Linux**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell)**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

3) Instala dependencias:

```bash
pip install -r requirements.txt
```

4) Aplica migraciones (para que se creen tablas en la base de datos):

```bash
python manage.py migrate
```

5) (Opcional) Crea un usuario admin para entrar al panel de Django:

```bash
python manage.py createsuperuser
```

6) Levanta el servidor:

```bash
python manage.py runserver
```

Resultado esperado:
- Backend corriendo en: `http://127.0.0.1:8000/`
- API base (según el frontend): `http://127.0.0.1:8000/api/`

---

### 4.3 Correr el frontend (HTML/CSS/JS)

La forma correcta es **servir** la carpeta `one/frontend` con un servidor, no abrir el HTML con `file://`.

Opción A: Live Server (VS Code)
1) Abre la carpeta `one/frontend` en VS Code.  
2) Da clic derecho a `pages/login.html` → **Open with Live Server**.  
3) Abre la URL que te muestra VS Code.

Opción B: servidor simple de Python
1) Entra a la carpeta:

```bash
cd one/frontend
```

2) Levanta servidor:

```bash
python -m http.server 3000
```

3) Entra desde el navegador:

- `http://localhost:3000/pages/login.html`
- `http://127.0.0.1:3000/pages/login.html`

---

### 4.4 Nota importante de CORS (si no te deja hacer fetch)

El backend trae configurado `CORS_ALLOWED_ORIGINS` en `one/backend/one_backend/settings.py` para:

- `http://localhost:3000`

Si el frontend lo estás corriendo en `3000`, entonces hay que agregar:

- `http://localhost:3000`

en estas listas del backend:

- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

Después reinicia el backend.

---

## 5. Arquitectura: Offline-first + sincronización

Esta es la idea central de ONE y vale la pena explicarla simple:

### 5.1 ¿Qué significa “offline-first” aquí?

Significa esto:

1) **Primero guardo local** (en la compu del usuario).  
2) **Después sincronizo** con el backend cuando hay internet.

Ventaja:
- Si se va el internet, la app **no se muere**.
- La información **no se pierde**.

---

### 5.2 Las 3 capas de datos en ONE

En ONE hay tres lugares donde se guardan cosas (cada uno con un objetivo):

1) **Memoria (estado en JS)**  
   - Vive en `Store.state`
   - Es lo que la interfaz usa para renderizar rápido

2) **IndexedDB (base local del navegador)**  
   - Vive en `assets/js/db.js`  
   - Guarda: tareas, proyectos, hábitos, logs, usuarios, outbox, etc.

3) **Backend (SQLite + Django)**  
   - Vive en `one/backend/`  
   - Es el lugar “central” cuando se quiere persistencia real del lado servidor.

---

### 5.3 ¿Cómo se sincroniza?

El patrón es:

- Cuando creas/actualizas/elimininas algo:
  1) Se guarda local (IndexedDB)
  2) Se agrega una operación a una cola llamada **Outbox**
  3) Si hay internet, se manda al backend
  4) Si no hay internet, se queda pendiente y se manda luego

En el código, la sincronización está concentrada en:

- `one/frontend/assets/js/db.js` (DBManager + Outbox + Sync)

---

## 6. Frontend (HTML/CSS/JS)

### 6.1 Mapa de páginas (qué archivo carga qué)

Este cuadro sirve para ubicar rápido: “estoy en X página → se ejecuta Y JS”.

| Página (HTML) | CSS que carga | JS que carga (orden) |
| --- | --- | --- |
| capacidad.html | base.css, capacidad.css | icons.js, db.js, store.js, capacidad.js, app.js |
| dashboard.html | base.css, dashboard.css | icons.js, db.js, store.js, dashboard.js, ui.js, app.js |
| detalle-proyecto.html | base.css, detalle-proyecto.css, proyectos.css | icons.js, db.js, store.js, ui.js, detalle-proyecto.js, app.js, app.js |
| focus.html | base.css, focus.css | icons.js, db.js, store.js, ui.js, focus.js, app.js |
| habitos.html | base.css, habitos.css | icons.js, db.js, store.js, ui.js, habitos.js, app.js |
| login.html | base.css, auth.css | icons.js, db.js, store.js, ui.js, auth.js, app.js |
| notificaciones.html | base.css | icons.js, store.js, app.js |
| perfil.html | base.css, auth.css | icons.js, store.js, app.js |
| proyectos.html | base.css, proyectos.css | icons.js, db.js, store.js, ui.js, proyectos.js, app.js |
| registro.html | base.css, auth.css | icons.js, db.js, store.js, ui.js, auth.js, app.js |
| semana.html | base.css, semana.css | icons.js, db.js, store.js, semana.js, ui.js, app.js |


---

### 6.2 Estilos (CSS)

En el frontend, los CSS principales son:

- `auth.css`
- `base.css`
- `capacidad.css`
- `dashboard.css`
- `detalle-proyecto.css`
- `focus.css`
- `habitos.css`
- `proyectos.css`
- `semana.css`

**Pieza clave:** `base.css`  
- Tiene el reset, layout base, y las variables `:root` con colores.
- La app usa una paleta oscura consistente y componentes reutilizables.

---

### 6.3 JS base del frontend (los que se repiten)

Estos archivos aparecen en muchas páginas porque son el “núcleo”:

- `js/app.js`
- `js/auth.js`
- `js/capacidad.js`
- `js/dashboard.js`
- `js/db.js`
- `js/detalle-proyecto.js`
- `js/focus.js`
- `js/habitos.js`
- `js/icons.js`
- `js/proyectos.js`
- `js/semana.js`
- `js/store.js`
- `js/ui.js`

Ahora lo importante es entender qué hace cada uno.

---

### 6.4 `assets/js/store.js` — Estado global (Store)

Este archivo concentra el estado “central” del frontend.

#### 6.4.1 ¿Qué guarda `Store.state`?

- `usuario`: el usuario actual que inició sesión (local)
- `tareas`: lista de tareas
- `proyectos`: lista de proyectos
- `habitos`: lista de hábitos
- `habitLogs`: registros diarios de hábitos
- `espacios`: los espacios base (Personal/Escuela/Trabajo)
- `config`: configuración (por ejemplo si se usa backend o solo local)

#### 6.4.2 ¿Por qué existe Store?

Porque la app necesita:

- Tener una sola “fuente” de verdad para lo que se ve en pantalla.
- Renderizar rápido sin estar leyendo la base local a cada rato.
- Centralizar acciones: “agregar tarea”, “eliminar proyecto”, “marcar hábito”, etc.

#### 6.4.3 Funciones importantes dentro de Store (idea simple)

- `cargarDatos()`  
  Carga lo que existe en IndexedDB / localStorage y lo mete en `Store.state`.

- `guardarEstado()` / `guardarDatos()`  
  Persiste el estado (principalmente local).

- `agregarTarea()`, `eliminarTarea()`, `toggleTareaCompletada()`  
  Modifica tareas y además llama a `DBManager.save()` / `DBManager.delete()`.

- `agregarProyecto()`, `eliminarProyecto()`  
  Manejo de proyectos.

- `agregarHabito()`, `toggleHabitoDia()` (logs)  
  Manejo de hábitos.

- `registrarTiempoFocus(minutos)`  
  Acumula minutos de enfoque dentro del usuario.

---

### 6.5 `assets/js/db.js` 

Este archivo define la base local (IndexedDB) y toda la lógica de sincronización.

#### 6.5.1 ¿Qué es IndexedDB en palabras simples?

Es una base de datos que vive dentro del navegador.  
Sirve para guardar información estructurada como si fuera una mini base local.

En ONE se usa para que el usuario pueda:

- Cerrar el navegador
- Abrirlo mañana
- Y seguir con sus tareas/proyectos/hábitos tal cual

#### 6.5.2 Tablas que crea ONE en IndexedDB

Stores:

- `tasks`
- `projects`
- `habitos`
- `habitLogs`
- `spaces`
- `users`
- `outbox`

Cada store tiene índices para buscar rápido (por ejemplo, tareas por fecha o por espacio).

#### 6.5.3 La Outbox (la cola de sincronización)

`outbox` guarda operaciones pendientes:

- `create`
- `update`
- `delete`

Formato general de una operación:

- `timestamp`
- `type` (create/update/delete)
- `store` (tasks/projects/habitos...)
- `payload` (el objeto a mandar o el id a borrar)

#### 6.5.4 ¿Cuándo se sincroniza?

En dos momentos:

1) Cuando el usuario hace cambios y está online (se intenta de inmediato)
2) Cuando el navegador recupera internet:

```js
window.addEventListener("online", () => DBManager.syncWithBackend())
```

---

### 6.6 `assets/js/auth.js` — Login y registro

Aquí pasa lo más importante del acceso:

- Registro: crea usuario en `users` (IndexedDB).
- Login:
  - Busca al usuario local por email
  - Valida contraseña local
  - Carga datos
  - Redirige a `dashboard.html`


---

### 6.7 Vistas principales (qué hace cada página)

Aquí describo la intención de cada pantalla.

#### 6.7.1 `pages/login.html`
- Pantalla de inicio de sesión.
- Lógica: `auth.js`
- Guarda sesión en `localStorage` y carga datos del Store.

#### 6.7.2 `pages/registro.html`
- Registro local.
- Crea un usuario en IndexedDB (`users`).

#### 6.7.3 `pages/dashboard.html`
- Resumen: tareas del día, progreso semanal, motivación (frase), minutos de foco.
- Usa Chart.js y también puede traer frases de un API externo.

#### 6.7.4 `pages/semana.html`
- Vista semanal.
- Permite:
  - Ver tareas por día
  - Crear/editar/eliminar
  - Marcar completadas
- Lógica principal: `semana.js` + `Store` + `DBManager`

#### 6.7.5 `pages/proyectos.html`
- Lista de proyectos.
- Crea, muestra y elimina proyectos.
- Permite entrar a detalle: `detalle_proyecto.html`

#### 6.7.6 `pages/detalle_proyecto.html`
- Vista de un proyecto individual:
  - Descripción
  - Progreso
  - Tareas relacionadas
- Lógica: `detalle-proyecto.js`

#### 6.7.7 `pages/habitos.html`
- Gestión de hábitos:
  - Crear hábito
  - Ver racha/consistencia por días
  - Marcar “hecho” en un día (genera logs)
- Lógica: `habitos.js` (usa `habitLogs`)

#### 6.7.8 `pages/focus.html`
- Modo enfoque (tipo pomodoro / concentración con ambiente).
- Tiene:
  - Timer
  - Sonidos (café / lluvia / fuego)
  - Clima (si el usuario da permisos)
- Lógica: `focus.js`

#### 6.7.9 `pages/capacidad.html`
- Calcula capacidad en base a carga de tareas / planificación.
- Lógica: `capacidad.js`

#### 6.7.10 `pages/perfil.html`
- Perfil del usuario:
  - Racha (streak)
  - Minutos de foco
  - Energía (energy_level)
- Lógica base: `app.js` + `Store`

#### 6.7.11 `pages/notificaciones.html`
- Página de notificaciones (estructura lista para crecer).

---

### 6.8 Recursos estáticos (íconos, audio, imágenes)

#### 6.8.1 Íconos

La app carga SVGs desde:
- `assets/icons/`

Los íconos se inyectan vía `assets/js/icons.js` usando `fetch()` y atributos tipo `data-app-icon`.

#### 6.8.2 Audio

Usado en Focus:

- `frontend/assets/audio/cafe.mp3`
- `frontend/assets/audio/fuego.mp3`
- `frontend/assets/audio/lluvia.mp3`

#### 6.8.3 Icono de ONE

- `assets/img/ONE.ico`

---

## 7. Backend (Django + API)

### 7.1 ¿Para qué existe el backend en ONE?

El backend existe para:

- Guardar información en un servidor (no solo en el navegador).
- Tener una API estándar para:
  - tareas
  - proyectos
  - hábitos
  - espacios
- Manejar autenticación/sesión del lado servidor (cuando se decide usarla).

### 7.2 Dependencias (requirements)

El backend usa:

- Django 5.1.2
- Django REST Framework
- django-cors-headers

Archivo: `backend/requirements.txt`

---

### 7.3 Estructura del backend (qué carpetas hay)

- `backend/manage.py` → comando principal de Django  
- `backend/one_backend/` → configuración del proyecto (settings, urls, wsgi)  
- `backend/accounts/` → usuarios + login + streak  
- `backend/spaces/` → espacios  
- `backend/projects/` → proyectos  
- `backend/tasks/` → tareas  
- `backend/habits/` → hábitos + logs  
- `backend/sync/` → base para sincronización (por ahora simple)  
- `backend/db.sqlite3` → base de datos local (desarrollo)

---

### 7.4 Configuración principal (settings.py)

Archivo: `backend/one_backend/settings.py`

Cosas importantes:

- Base de datos: SQLite 
- CORS configurado (permite front en ciertos orígenes)
- `AUTH_USER_MODEL = "accounts.User"` (usuario custom)
- `SESSION_COOKIE_AGE` definido para sesión
- `REST_FRAMEWORK` configurado para auth por sesión

---

### 7.5 Rutas (URLs) del backend

Base: `/api/`

#### 7.5.1 Recursos registrados con router

| Recurso | ViewSet |
| --- | --- |
| users | UserViewSet |
| spaces | SpaceViewSet |
| projects | ProjectViewSet |
| tasks | TaskViewSet |
| habits | HabitViewSet |
| habit-logs | HabitLogViewSet |


Eso crea endpoints tipo:

- `/api/users/`
- `/api/tasks/`
- `/api/projects/`
- `/api/spaces/`
- `/api/habits/`
- `/api/habit-logs/`

#### 7.5.2 Endpoints extra (acciones específicas)

- `/api/blog/`
- `/api/admin/`
- `/api/api/register/`
- `/api/api/login/`
- `/api/api/streak/`

---

### 7.6 Modelos (qué tablas existen)

#### 7.6.1 Usuario (accounts/User)

Campos extra agregados al usuario:

- `streak` (racha)
- `last_login_streak` (fecha del último login para racha)
- `energy_level` (nivel de energía)

#### 7.6.2 Space (spaces/Space)

Representa un “contexto”:

- Personal
- Escuela
- Trabajo

Campos típicos:
- `id` (string)
- `name`, `color`, `icon`
- `user` (propietario)

#### 7.6.3 Project (projects/Project)

Campos:
- `id`
- `title`, `description`, `color`
- `space`
- `progress` (int)
- `deleted` (soft delete)
- `user` (propietario)

#### 7.6.4 Task (tasks/Task)

Campos:
- `id`
- `title`, `notes`
- `date`
- `space`, `project` (opcional)
- `start_time`, `end_time`, `duration`, `location`
- `completed`
- `deleted` (soft delete)
- `user`

#### 7.6.5 Habit y HabitLog (habits)

- Habit:
  - `title`
  - `goal_type`, `goal_target`
  - `color`
  - `space`
  - `user`
  - `deleted`

- HabitLog:
  - `habit`
  - `date`
  - `done`

---

### 7.7 Serializers (mapeo JSON ↔ modelo)

Aquí hay un detalle importante: el backend está pensado para recibir/enviar datos con nombres “amigables” (ej. `titulo`) y convertirlos a campos reales (ej. `title`).

Ejemplo en `tasks/serializers.py`:

- JSON: `titulo` → Modelo: `title`
- JSON: `completada` → Modelo: `completed`
- JSON: `horaInicio` → Modelo: `start_time`

Esto se hace con `to_representation()` y `to_internal_value()`.

---

### 7.8 Vistas y permisos (qué requiere login)

- `tasks`, `projects`, `habits` normalmente usan `IsAuthenticated`.
- `spaces` trae el permiso comentado (por compatibilidad / pruebas).
- `accounts` tiene partes `AllowAny` (registro/login).

Esto es importante porque:
- Se activan permisos estrictos
- Se obliga a que el frontend tenga sesión válida para sincronizar

---

### 7.9 Scripts de depuración

Sirven para probar endpoints rápidamente (tipo “mini cliente”) sin tener que abrir el navegador.

---

## 8. Sincronización: qué se manda, cuándo y cómo

Aquí aterrizo la sincronización en términos prácticos.

### 8.1 Qué manda el frontend al backend

La sincronización toma operaciones de `outbox` y construye requests:

- Create → `POST /api/<store>/`
- Update → `PUT /api/<store>/<id>/`
- Delete → `DELETE /api/<store>/<id>/`

Siempre usando:

- `credentials: "include"` (para cookies de sesión)
- `X-CSRFToken` (cuando aplica)

### 8.2 Cómo evita duplicar sincronizaciones

Después de sincronizar correctamente:

1) Marca el registro local como `syncStatus = "synced"`
2) Borra la operación correspondiente de `outbox`

### 8.3 Descarga del backend hacia el frontend

Además del “push” (frontend → backend), existe el “pull”:

- `DBManager.loadAllFromBackend()`

Esto baja datos y los guarda en IndexedDB, y también actualiza el Store.

---

## 9. APIs externas y permisos

ONE usa algunas APIs externas (no del backend propio):

### 9.1 Focus: clima

`focus.js` usa Open-Meteo. Para eso:

- Pide permiso de ubicación
- Si el usuario lo permite, obtiene lat/lon
- Consulta el clima

Si el usuario no da permisos:
- La pantalla sigue funcionando, solo sin clima.

### 9.2 Dashboard: frases

`dashboard.js` intenta obtener frases de `api.quotable.io`.

Si no responde:
- Usa frases de respaldo.

---

## 10. Checklist de pruebas

Pruebas mínimas que confirman que todo lo importante funciona:

### 10.1 Frontend base

- [ ] Abre `login.html` desde servidor (no `file://`)
- [ ] Registras un usuario y se guarda en IndexedDB (`users`)
- [ ] Haces login y te manda a dashboard

### 10.2 Tareas (semana)

- [ ] Crear tarea en un día
- [ ] Editar tarea
- [ ] Marcar completada
- [ ] Borrar tarea
- [ ] Cerrar el navegador y volver: los datos siguen

### 10.3 Hábitos

- [ ] Crear hábito
- [ ] Marcar un día como hecho
- [ ] Ver el calendario (logs)
- [ ] Recargar página y conservar

### 10.4 Offline-first

- [ ] Crear algo sin internet (modo avión)
- [ ] Regresar internet
- [ ] Confirmar que se sincroniza (si backend está activo y configurado)

---

## 11. Problemas típicos y solución

### 11.1 “CORS policy” / fetch bloqueado

- Agrega el origen del frontend a:
  - `CORS_ALLOWED_ORIGINS`
  - `CSRF_TRUSTED_ORIGINS`
- Reinicia backend

### 11.2 403 CSRF

- Verifica que:
  - el backend esté enviando cookie `csrftoken`
  - el frontend mande `X-CSRFToken`
  - el fetch use `credentials: "include"`

### 11.3 Datos no aparecen al recargar

- Asegúrate de correr desde servidor
- Abre DevTools → Application → IndexedDB → `ONE_DB`
- Revisa que sí existan registros en `tasks`, `projects`, etc.

---

## 12. Limitaciones y mejoras futuras

Estas son mejoras que ya están claras si el proyecto crece:

- Sincronización con resolución de conflictos (si dos dispositivos editan lo mismo).
- Registro y login 100% por backend (si se quiere cuentas reales online).
- Permisos más estrictos en `spaces` (activar el `IsAuthenticated`).
- Encriptar o hashear contraseña en el usuario local (IndexedDB).

---

## 13. Apéndices

### 13.1 Árbol de carpetas (proyecto real)

```text
one/
  backend/
    accounts/
      migrations/
        0001_initial.py
        0002_alter_user_groups_alter_user_user_permissions.py
        __init__.py
      __init__.py
      admin.py
      apps.py
      authentication.py
      models.py
      serializers.py
      tests.py
      views.py
    habits/
      migrations/
        0001_initial.py
        __init__.py
      __init__.py
      admin.py
      apps.py
      models.py
      serializers.py
      tests.py
      views.py
    one_backend/
      __init__.py
      asgi.py
      settings.py
      urls.py
      wsgi.py
    projects/
      migrations/
        0001_initial.py
        __init__.py
      __init__.py
      admin.py
      apps.py
      models.py
      serializers.py
      tests.py
      views.py
    spaces/
      migrations/
        0001_initial.py
        __init__.py
      __init__.py
      admin.py
      apps.py
      models.py
      serializers.py
      tests.py
      views.py
    sync/
      migrations/
        __init__.py
      __init__.py
      admin.py
      apps.py
      models.py
      tests.py
      views.py
    tasks/
      migrations/
        0001_initial.py
        __init__.py
      __init__.py
      admin.py
      apps.py
      models.py
      serializers.py
      tests.py
      views.py
    db.sqlite3
    manage.py
    requirements.txt
  frontend/
    assets/
      audio/
        cafe.mp3
        fuego.mp3
        lluvia.mp3
      css/
        auth.css
        base.css
        capacidad.css
        dashboard.css
        detalle-proyecto.css
        focus.css
        habitos.css
        proyectos.css
        semana.css
      icons/
        new icons/
          regular-free-icon-svgs/
            align-text-center.svg
            arrow-left.svg
            bold.svg
            bolt-2.svg
            briefcase-1.svg
            bulb-2.svg
            calendar-days.svg
            check-circle-1.svg
            gauge-1.svg
            graduation-cap-1.svg
            hand-stop.svg
            layout-26.svg
            layout-9.svg
            link-2-angular-right.svg
            menu-hamburger-1.svg
            minus-circle.svg
            pause.svg
            pencil-1.svg
            pie-chart-2.svg
            play.svg
            plus.svg
            target-user.svg
            user-4.svg
            xmark-circle.svg
      img/
        ONE.ico
      js/
        ONE_Merida de Leon Luis Ernesto.code-workspace
        app.js
        auth.js
        capacidad.js
        dashboard.js
        db.js
        detalle-proyecto.js
        focus.js
        habitos.js
        icons.js
        proyectos.js
        semana.js
        store.js
        ui.js
    pages/
      capacidad.html
      dashboard.html
      detalle-proyecto.html
      focus.html
      habitos.html
      login.html
      notificaciones.html
      perfil.html
      proyectos.html
      registro.html
      semana.html
```

### 13.2 Inventario de archivos (frontend)

Páginas:

- `/pages/capacidad.html`
- `/pages/dashboard.html`
- `/pages/detalle-proyecto.html`
- `/pages/focus.html`
- `/pages/habitos.html`
- `/pages/login.html`
- `/pages/notificaciones.html`
- `/pages/perfil.html`
- `/pages/proyectos.html`
- `/pages/registro.html`
- `/pages/semana.html`

CSS:

- `/assets/css/auth.css`
- `/assets/css/base.css`
- `/assets/css/capacidad.css`
- `/assets/css/dashboard.css`
- `/assets/css/detalle-proyecto.css`
- `/assets/css/focus.css`
- `/assets/css/habitos.css`
- `/assets/css/proyectos.css`
- `/assets/css/semana.css`

JS:

- `/assets/js/app.js`
- `/assets/js/auth.js`
- `/assets/js/capacidad.js`
- `/assets/js/dashboard.js`
- `/assets/js/db.js`
- `/assets/js/detalle-proyecto.js`
- `/assets/js/focus.js`
- `/assets/js/habitos.js`
- `/assets/js/icons.js`
- `/assets/js/proyectos.js`
- `/assets/js/semana.js`
- `/assets/js/store.js`
- `/assets/js/ui.js`

Audio:

- `/assets/audio/cafe.mp3`
- `/assets/audio/fuego.mp3`
- `/assets/audio/lluvia.mp3`

---

### 13.3 Inventario de archivos (backend)

- `backend/accounts/__init__.py`
- `backend/accounts/admin.py`
- `backend/accounts/apps.py`
- `backend/accounts/authentication.py`
- `backend/accounts/migrations/0001_initial.py`
- `backend/accounts/migrations/__init__.py`
- `backend/accounts/models.py`
- `backend/accounts/serializers.py`
- `backend/accounts/tests.py`
- `backend/accounts/views.py`
- `backend/db.sqlite3`
- `backend/habits/__init__.py`
- `backend/habits/admin.py`
- `backend/habits/apps.py`
- `backend/habits/migrations/0001_initial.py`
- `backend/habits/migrations/__init__.py`
- `backend/habits/models.py`
- `backend/habits/serializers.py`
- `backend/habits/tests.py`
- `backend/habits/views.py`
- `backend/manage.py`
- `backend/one_backend/__init__.py`
- `backend/one_backend/asgi.py`
- `backend/one_backend/settings.py`
- `backend/one_backend/urls.py`
- `backend/one_backend/wsgi.py`
- `backend/projects/__init__.py`
- `backend/projects/admin.py`
- `backend/projects/apps.py`
- `backend/projects/migrations/0001_initial.py`
- `backend/projects/migrations/__init__.py`
- `backend/projects/models.py`
- `backend/projects/serializers.py`
- `backend/projects/tests.py`
- `backend/projects/views.py`
- `backend/requirements.txt`
- `backend/spaces/__init__.py`
- `backend/spaces/admin.py`
- `backend/spaces/apps.py`
- `backend/spaces/migrations/0001_initial.py`
- `backend/spaces/migrations/__init__.py`
- `backend/spaces/models.py`
- `backend/spaces/serializers.py`
- `backend/spaces/tests.py`
- `backend/spaces/views.py`
- `backend/sync/__init__.py`
- `backend/sync/admin.py`
- `backend/sync/apps.py`
- `backend/sync/migrations/__init__.py`
- `backend/sync/models.py`
- `backend/sync/tests.py`
- `backend/sync/views.py`
- `backend/tasks/__init__.py`
- `backend/tasks/admin.py`
- `backend/tasks/apps.py`
- `backend/tasks/migrations/0001_initial.py`
- `backend/tasks/migrations/__init__.py`
- `backend/tasks/models.py`
- `backend/tasks/serializers.py`
- `backend/tasks/tests.py`
- `backend/tasks/views.py`

---

### 13.4 Glosario

- **API**: conjunto de rutas (URLs) que aceptan y devuelven datos.
- **Endpoint**: una ruta específica de la API (por ejemplo `/api/tasks/`).
- **Frontend**: lo que corre en el navegador (HTML/CSS/JS).
- **Backend**: lo que corre en el servidor (Django).
- **IndexedDB**: base local del navegador para guardar datos.
- **Outbox**: cola de operaciones pendientes de sincronizar.
- **CORS**: regla de seguridad del navegador que limita llamadas entre puertos/dominios.
- **CSRF**: protección para evitar que un sitio ajeno haga acciones como si fueras tú.

---

