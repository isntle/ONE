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
    deduplicarPorId: (items) => {
        const uniques = new Map();
        (items || []).forEach(item => {
            if (!item || item.id == null) return;
            const key = String(item.id);
            if (!uniques.has(key)) uniques.set(key, item);
        });
        return Array.from(uniques.values());
    },
    generarId: () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `${Date.now().toString()}-${Math.random().toString(16).slice(2)}`;
    },

    cargarDatos: () => {
        const usuario = localStorage.getItem(Store.KEYS.USUARIO);
        const data = localStorage.getItem(Store.KEYS.DATA);

        if (usuario) Store.guardarUsuario(JSON.parse(usuario));

        if (data) {
            const parsed = JSON.parse(data);
            // Filtrado por usuario actual (Soporte para múltiples usuarios en caché)
            const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;

            if (currentUserEmail) {
                const tareasConOwner = (parsed.tareas || []).map(t => {
                    if (t && !t.owner_email) return { ...t, owner_email: currentUserEmail };
                    return t;
                });
                const proyectosConOwner = (parsed.proyectos || []).map(p => {
                    if (p && !p.owner_email) return { ...p, owner_email: currentUserEmail };
                    return p;
                });
                const habitosConOwner = (parsed.habitos || []).map(h => {
                    if (h && !h.owner_email) return { ...h, owner_email: currentUserEmail };
                    return h;
                });

                Store.state.tareas = Store.deduplicarPorId(tareasConOwner.filter(t => t.owner_email === currentUserEmail));
                Store.state.proyectos = Store.deduplicarPorId(proyectosConOwner.filter(p => p.owner_email === currentUserEmail));

                Store.state.habitos = Store.deduplicarPorId(habitosConOwner
                    .filter(h => h.owner_email === currentUserEmail)
                    .map(h => {
                        if (typeof h.nombre === 'object' && h.nombre !== null) {
                            h.nombre = h.nombre.nombre || "Nuevo Hábito";
                        }
                        return h;
                    }));
            } else {
                // Respaldo si no hay usuario logueado
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
        Store.state.tareas = Store.deduplicarPorId(Store.state.tareas);
        Store.state.proyectos = Store.deduplicarPorId(Store.state.proyectos);
        Store.state.habitos = Store.deduplicarPorId(Store.state.habitos);

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
        const usuario = { ...user };
        if (!usuario.preferences) usuario.preferences = {};

        if (usuario.minutosFocus == null) {
            usuario.minutosFocus = usuario.preferences.minutosFocus || 0;
        }
        usuario.preferences.minutosFocus = usuario.minutosFocus;

        if (usuario.espaciosHabilitados && Array.isArray(usuario.espaciosHabilitados)) {
            usuario.preferences.espaciosHabilitados = usuario.espaciosHabilitados;
        } else if (Array.isArray(usuario.preferences.espaciosHabilitados)) {
            usuario.espaciosHabilitados = usuario.preferences.espaciosHabilitados;
        } else {
            usuario.espaciosHabilitados = ['Personal', 'Escuela', 'Trabajo'];
            usuario.preferences.espaciosHabilitados = usuario.espaciosHabilitados;
        }

        if (!usuario.email && usuario.username) {
            usuario.email = usuario.username;
        }

        Store.state.usuario = usuario;
        localStorage.setItem(Store.KEYS.USUARIO, JSON.stringify(usuario));
    },

    registrarTiempoFocus: (minutos) => {
        if (!Store.state.usuario) return; // Si no hay usuario, no guardamos (o guardamos en temporal?)
        if (!Store.state.usuario.minutosFocus) Store.state.usuario.minutosFocus = 0;
        Store.state.usuario.minutosFocus += minutos;
        Store.guardarUsuario(Store.state.usuario);
        if (typeof DBManager !== 'undefined') {
            DBManager.save('users', Store.state.usuario);
        }
        console.log(`⏱️ Tiempo focus registrado: +${minutos}m. Total: ${Store.state.usuario.minutosFocus}m`);
    },

    cerrarSesion: () => {
        const limpiarYRecargar = () => {
            localStorage.clear();
            location.reload();
        };

        if (typeof DBManager !== 'undefined') {
            DBManager.clearAll().then(limpiarYRecargar).catch(limpiarYRecargar);
        } else {
            limpiarYRecargar();
        }
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
        const tareas = Store.deduplicarPorId(Store.state.tareas);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        return tareas.filter(t => {
            if (currentUserEmail && t.owner_email && t.owner_email !== currentUserEmail) return false;
            return t.espacio === Store.state.espacioActual;
        });
    },

    agregarTarea: (tarea) => {
        const nuevaTarea = {
            id: Store.generarId(),
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
        const tarea = Store.state.tareas.find(t => String(t.id) === String(id));
        const targetId = tarea ? tarea.id : id;
        Store.state.tareas = Store.state.tareas.filter(t => String(t.id) !== String(id));
        Store.guardarEstado();
        // SYNC: Registrar borrado
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('tareas', targetId);
        }
    },

    actualizarTarea: (id, cambios) => {
        const index = Store.state.tareas.findIndex(t => String(t.id) === String(id));
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
        const proyectos = Store.deduplicarPorId(Store.state.proyectos);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        return proyectos.filter(p => {
            if (currentUserEmail && p.owner_email && p.owner_email !== currentUserEmail) return false;
            const espacio = p.espacio || p.espacio_nombre;
            return espacio === Store.state.espacioActual;
        });
    },

    agregarProyecto: (proyecto) => {
        const nuevoProyecto = {
            id: Store.generarId(),
            espacio: Store.state.espacioActual,
            progreso: 0,
            notas: '',
            tareas: [],
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

    actualizarProyecto: (id, cambios) => {
        const index = Store.state.proyectos.findIndex(p => String(p.id) === String(id));
        if (index !== -1) {
            Store.state.proyectos[index] = { ...Store.state.proyectos[index], ...cambios };
            Store.guardarEstado();
            if (typeof DBManager !== 'undefined') {
                DBManager.save('proyectos', Store.state.proyectos[index]);
            }
            return Store.state.proyectos[index];
        }
        return null;
    },

    eliminarProyecto: (id) => {
        const proyecto = Store.state.proyectos.find(p => String(p.id) === String(id));
        const targetId = proyecto ? proyecto.id : id;
        Store.state.proyectos = Store.state.proyectos.filter(p => String(p.id) !== String(id));
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('proyectos', targetId);
        }
    },

    actualizarProyecto: (id, cambios) => {
        const index = Store.state.proyectos.findIndex(p => String(p.id) === String(id));
        if (index !== -1) {
            Store.state.proyectos[index] = { ...Store.state.proyectos[index], ...cambios };
            Store.guardarEstado();
            if (typeof DBManager !== 'undefined') {
                DBManager.save('proyectos', Store.state.proyectos[index]);
            }
            return Store.state.proyectos[index];
        }
        return null;
    },

    // --- HÁBITOS (Globales, no por espacio necesariamente, o sí?) ---
    // Por simplicidad, los hábitos son globales por ahora
    obtenerHabitos: () => {
        const habitos = Store.deduplicarPorId(Store.state.habitos);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        if (!currentUserEmail) return habitos;
        return habitos.filter(h => !h.owner_email || h.owner_email === currentUserEmail);
    },

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
            console.log("Iniciando aplicación sin datos (Limpieza)...");
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
        const habito = Store.state.habitos.find(h => String(h.id) === String(idHabito));
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
            id: Store.generarId(),
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
        const habito = Store.state.habitos.find(h => String(h.id) === String(id));
        const targetId = habito ? habito.id : id;
        Store.state.habitos = Store.state.habitos.filter(h => String(h.id) !== String(id));
        Store.guardarEstado();
        // SYNC
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('habitos', targetId);
        }
    }
};

// Inicializar al cargar
Store.init();
