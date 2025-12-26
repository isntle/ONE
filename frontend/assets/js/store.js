/*
 * store.js
 * Gestión de estado V2: Espacios, Tareas, Proyectos y Persistencia
 */

const Store = {
    KEYS: {
        USUARIO: 'one_usuario',
        DATA: 'one_data', // Nuevo objeto unificado para datos del usuario
        SESION: 'one_sesion'
    },

    // Estado en memoria
    state: {
        usuario: null,
        espacioActual: 'Personal', // 'Personal', 'Escuela', 'Trabajo'
        tareas: [],
        proyectos: [],
        habitos: []
    },

    init: () => {
        Store.cargarDatos();
    },

    // --- CARGA Y GUARDADO ---
    cargarDatos: () => {
        const usuario = localStorage.getItem(Store.KEYS.USUARIO);
        const data = localStorage.getItem(Store.KEYS.DATA);

        if (usuario) Store.state.usuario = JSON.parse(usuario);

        if (data) {
            const parsed = JSON.parse(data);
            // Filtrado por usuario actual (Multi-User Cache support)
            const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;

            if (currentUserEmail) {
                Store.state.tareas = (parsed.tareas || []).filter(t => t.owner_email === currentUserEmail);
                Store.state.proyectos = (parsed.proyectos || []).filter(p => p.owner_email === currentUserEmail);

                let habitosCrudos = parsed.habitos || [];
                Store.state.habitos = habitosCrudos
                    .filter(h => h.owner_email === currentUserEmail)
                    .map(h => {
                        if (typeof h.nombre === 'object' && h.nombre !== null) {
                            h.nombre = h.nombre.nombre || "Nuevo Hábito";
                        }
                        return h;
                    });
            } else {
                // Fallback si no hay usuario logueado (pantalla login?)
                Store.state.tareas = [];
                Store.state.proyectos = [];
                Store.state.habitos = [];
            }
        } else {
            Store.seedData();
        }

        // Doble check: Si cargó datos pero están vacíos (usuario nuevo sync), intentar seed
        if (Store.state.tareas.length === 0 && Store.state.proyectos.length === 0) {
            Store.seedData();
        }
    },

    guardarEstado: () => {
        const data = {
            tareas: Store.state.tareas,
            proyectos: Store.state.proyectos,
            habitos: Store.state.habitos
        };
        localStorage.setItem(Store.KEYS.DATA, JSON.stringify(data));
    },

    // --- USUARIO ---
    obtenerUsuario: () => Store.state.usuario,

    guardarUsuario: (user) => {
        // Asegurar que tenga campo minutosFocus
        if (!user.minutosFocus) user.minutosFocus = 0;
        Store.state.usuario = user;
        localStorage.setItem(Store.KEYS.USUARIO, JSON.stringify(user));
    },

    registrarTiempoFocus: (minutos) => {
        if (!Store.state.usuario) return; // Si no hay usuario, no guardamos (o guardamos en temporal?)
        if (!Store.state.usuario.minutosFocus) Store.state.usuario.minutosFocus = 0;
        Store.state.usuario.minutosFocus += minutos;
        Store.guardarUsuario(Store.state.usuario);
        console.log(`⏱️ Tiempo focus registrado: +${minutos}m. Total: ${Store.state.usuario.minutosFocus}m`);
    },

    cerrarSesion: () => {
        localStorage.clear();  // Limpia usuario activo
        location.reload();     // Recarga App, Store.cargarDatos filtrará (y no encontrará usuario, so empty)
    },

    // --- ESPACIOS ---
    setEspacioActual: (espacio) => {
        Store.state.espacioActual = espacio;
        // Disparar evento de cambio para que la UI se actualice
        document.dispatchEvent(new CustomEvent('cambio-espacio', { detail: espacio }));
    },

    obtenerEspacioActual: () => Store.state.espacioActual,

    // --- TAREAS ---
    obtenerTareas: () => {
        // Retorna tareas filtradas por el espacio actual
        return Store.state.tareas.filter(t => t.espacio === Store.state.espacioActual);
    },

    agregarTarea: (tarea) => {
        const nuevaTarea = {
            id: Date.now(),
            espacio: Store.state.espacioActual,
            completada: false,
            owner_email: Store.state.usuario ? Store.state.usuario.email : null,
            ...tarea
        };
        Store.state.tareas.push(nuevaTarea);
        Store.guardarEstado();
        // SYNC: Enviar a IndexedDB/Backend
        if (typeof DBManager !== 'undefined') {
            DBManager.save('tareas', nuevaTarea);
        }
        return nuevaTarea;
    },

    eliminarTarea: (id) => {
        Store.state.tareas = Store.state.tareas.filter(t => t.id !== id);
        Store.guardarEstado();
        // SYNC: Registrar borrado
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('tareas', id);
        }
    },

    actualizarTarea: (id, cambios) => {
        const index = Store.state.tareas.findIndex(t => t.id === id);
        if (index !== -1) {
            Store.state.tareas[index] = { ...Store.state.tareas[index], ...cambios };
            Store.guardarEstado();
            // SYNC: Actualizar en backend
            if (typeof DBManager !== 'undefined') {
                DBManager.save('tareas', Store.state.tareas[index]);
            }
            return Store.state.tareas[index];
        }
        return null;
    },

    // --- PROYECTOS ---
    obtenerProyectos: () => {
        return Store.state.proyectos.filter(p => p.espacio === Store.state.espacioActual);
    },

    agregarProyecto: (proyecto) => {
        const nuevoProyecto = {
            id: Date.now(),
            espacio: Store.state.espacioActual,
            progreso: 0,
            owner_email: Store.state.usuario ? Store.state.usuario.email : null,
            ...proyecto
        };
        Store.state.proyectos.push(nuevoProyecto);
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.save('proyectos', nuevoProyecto);
        }
    },

    eliminarProyecto: (id) => {
        Store.state.proyectos = Store.state.proyectos.filter(p => String(p.id) !== String(id));
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('proyectos', id);
        }
    },

    // --- HÁBITOS (Globales, no por espacio necesariamente, o sí?) ---
    // Por simplicidad, los hábitos son globales por ahora
    obtenerHabitos: () => Store.state.habitos,

    guardarHabitos: (habitos) => {
        Store.state.habitos = habitos;
        Store.guardarEstado();
    },

    // --- SEED DATA (Datos de prueba dinámicos) ---
    // --- SEED DATA (Datos de prueba dinámicos) ---
    seedData: () => {
        // Solo sembrar datos si el usuario es el Demo "juan@gmail.com"
        const usuario = Store.state.usuario;
        if (usuario && usuario.email === 'juan@gmail.com') {
            console.log("🌱 Sembrando datos de ejemplo para Juan Pablo...");

            const hoy = new Date();
            const hoyIso = Store.fechaIsoLocal(hoy);

            // Generar fechas relativas
            const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
            const mananaIso = Store.fechaIsoLocal(manana);

            const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
            const ayerIso = Store.fechaIsoLocal(ayer);

            Store.state.tareas = [
                { id: 101, titulo: "Gimnasio", fecha: hoyIso, horaInicio: "19:00", horaFin: "20:30", color: "morado", espacio: "Personal", completada: false },
                { id: 102, titulo: "Fútbol", fecha: mananaIso, horaInicio: "20:00", horaFin: "22:00", color: "verde", espacio: "Personal", completada: false },
                { id: 103, titulo: "Estudiar Probabilidad", fecha: hoyIso, horaInicio: "16:00", horaFin: "18:00", color: "azul", espacio: "Escuela", completada: true },
                { id: 104, titulo: "Entrega de Proyecto", fecha: mananaIso, horaInicio: "09:00", horaFin: "10:00", color: "rojo", espacio: "Trabajo", completada: false },
                { id: 105, titulo: "Leer 20 mins", fecha: ayerIso, horaInicio: "21:00", horaFin: "21:20", color: "amarillo", espacio: "Personal", completada: true }
            ];

            Store.state.proyectos = [
                { id: 201, titulo: "Tesis de Grado", descripcion: "Investigación final para titulación", progreso: 65, color: "#3B82F6", espacio: "Escuela", etiquetas: "Urgente, Tesis" },
                { id: 202, titulo: "Portafolio Web", descripcion: "Rediseño de sitio personal", progreso: 30, color: "#8B5CF6", espacio: "Personal", etiquetas: "Diseño, Dev" }
            ];

            Store.state.habitos = [
                { id: 301, nombre: "Tomar Agua (2L)", registros: { [hoyIso]: { completado: true } } },
                { id: 302, nombre: "Leer 20 mins", registros: { [ayerIso]: { completado: true } } }
            ];

            Store.guardarEstado();
        } else {
            console.log("Iniciando aplicación sin datos (Clean Slate)...");
            Store.guardarEstado();
        }
    },

    // --- FECHAS ---
    // ISO local YYYY-MM-DD (evita desfases por zona horaria con toISOString)
    fechaIsoLocal: (fecha) => {
        const f = new Date(fecha);
        const y = f.getFullYear();
        const m = String(f.getMonth() + 1).padStart(2, '0');
        const d = String(f.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    // --- HÁBITOS HELPERS ---
    toggleHabitoDia: (idHabito, fechaIso, nota = "") => {
        const habito = Store.state.habitos.find(h => h.id === idHabito);
        if (habito) {
            if (!habito.registros) habito.registros = {};

            // Si ya existe y está completado, lo quitamos (toggle off)
            // A MENOS que estemos enviando una nota nueva, en cuyo caso actualizamos
            const registroActual = habito.registros[fechaIso];

            if (registroActual && registroActual.completado && !nota) {
                // Toggle OFF si no estoy guardando nota explícita
                delete habito.registros[fechaIso];
            } else {
                // Toggle ON / Update Note
                habito.registros[fechaIso] = {
                    completado: true,
                    nota: nota || (registroActual ? registroActual.nota : "")
                };
            }
            Store.guardarEstado();
            // SYNC: Actualizar habito en backend
            if (typeof DBManager !== 'undefined') {
                DBManager.save('habitos', habito);
            }
        }
    },

    agregarHabito: (data) => {
        let nombreVal = "Nuevo Hábito";
        if (typeof data === 'string') nombreVal = data;
        else if (data && data.nombre) nombreVal = data.nombre;

        const nuevoHabito = {
            id: Date.now(),
            nombre: String(nombreVal),
            registros: {},
            owner_email: Store.state.usuario ? Store.state.usuario.email : null
        };
        Store.state.habitos.push(nuevoHabito);
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.save('habitos', nuevoHabito);
        }
    },

    eliminarHabito: (id) => {
        // Comparación flexible (número o string)
        Store.state.habitos = Store.state.habitos.filter(h => String(h.id) !== String(id));
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('habitos', id);
        }
    }
};

// Inicializar al cargar
Store.init();
