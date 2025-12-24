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
            Store.state.tareas = parsed.tareas || [];
            Store.state.proyectos = parsed.proyectos || [];
            Store.state.habitos = parsed.habitos || [];
            // Si ya existía un espacio seleccionado, podríamos guardarlo, por ahora default Personal
        } else {
            // Datos iniciales (Seed)
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
        Store.state.usuario = user;
        localStorage.setItem(Store.KEYS.USUARIO, JSON.stringify(user));
    },

    cerrarSesion: () => {
        localStorage.clear(); // Limpiar todo para demo
        location.reload();
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
            ...tarea
        };
        Store.state.tareas.push(nuevaTarea);
        Store.guardarEstado();
        return nuevaTarea;
    },

    eliminarTarea: (id) => {
        Store.state.tareas = Store.state.tareas.filter(t => t.id !== id);
        Store.guardarEstado();
    },

    actualizarTarea: (id, cambios) => {
        const index = Store.state.tareas.findIndex(t => t.id === id);
        if (index !== -1) {
            Store.state.tareas[index] = { ...Store.state.tareas[index], ...cambios };
            Store.guardarEstado();
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
            ...proyecto
        };
        Store.state.proyectos.push(nuevoProyecto);
        Store.guardarEstado();
    },

    // --- HÁBITOS (Globales, no por espacio necesariamente, o sí?) ---
    // Por simplicidad, los hábitos son globales por ahora
    obtenerHabitos: () => Store.state.habitos,

    guardarHabitos: (habitos) => {
        Store.state.habitos = habitos;
        Store.guardarEstado();
    },

    // --- SEED DATA (Datos de prueba dinámicos) ---
    seedData: () => {
        console.log("Generando datos de prueba...");

        // Helper para obtener fechas de esta semana
        const getFechaSemana = (diaIndex) => { // 0=Lunes, 6=Domingo
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1) + diaIndex;
            const fecha = new Date(d.setDate(diff));
            return fecha.toISOString().split('T')[0];
        };

        const LUNES = getFechaSemana(0);
        const MARTES = getFechaSemana(1);
        const MIERCOLES = getFechaSemana(2);
        const VIERNES = getFechaSemana(4);

        Store.state.tareas = [
            // ESCUELA
            { id: 1, titulo: "Probabilidad", descripcion: "Ejercicios Tarea 2", espacio: "Escuela", fecha: LUNES, horaInicio: "16:00", horaFin: "18:00", tipo: "horario-escuela" },
            { id: 2, titulo: "Redes", descripcion: "Topología Packet Tracer", espacio: "Escuela", fecha: MARTES, horaInicio: "14:00", horaFin: "16:00", tipo: "horario-escuela" },
            { id: 3, titulo: "Métodos Numéricos", descripcion: "Práctica Gauss-Jordan", espacio: "Escuela", fecha: MIERCOLES, horaInicio: "15:00", horaFin: "17:00", tipo: "horario-escuela" },

            // PERSONAL
            { id: 4, titulo: "Gimnasio", descripcion: "Rutina tren superior", espacio: "Personal", fecha: LUNES, horaInicio: "19:00", horaFin: "20:00", tipo: "horario-personal" },
            { id: 5, titulo: "Fútbol", descripcion: "Partido con amigos", espacio: "Personal", fecha: VIERNES, horaInicio: "20:00", horaFin: "22:00", tipo: "horario-personal" },

            // TRABAJO
            { id: 6, titulo: "Reunión de equipo", descripcion: "Sprint Planning", espacio: "Trabajo", fecha: LUNES, horaInicio: "09:00", horaFin: "10:00", tipo: "horario-trabajo" },
            { id: 7, titulo: "Desarrollo Frontend", descripcion: "Componentes React", espacio: "Trabajo", fecha: MIERCOLES, horaInicio: "10:00", horaFin: "13:00", tipo: "horario-trabajo" }
        ];

        Store.state.proyectos = [
            { id: 1, titulo: "Minishell en C", descripcion: "Sistemas Operativos", espacio: "Escuela", etiquetas: "C · SysOp" },
            { id: 2, titulo: "Portafolio Web", descripcion: "Rediseño personal", espacio: "Trabajo", etiquetas: "Web · Design" }
        ];

        Store.state.habitos = [
            {
                id: 1,
                nombre: "Estudiar inglés",
                // Registros usando fecha ISO YYYY-MM-DD
                registros: {
                    [LUNES]: { completado: true, nota: "Verbos irregulares" },
                    [MIERCOLES]: { completado: true, nota: "Listening practice" }
                }
            },
            {
                id: 2,
                nombre: "Leer 20 mins",
                registros: {
                    [MARTES]: { completado: true, nota: "Atomic Habits - Cap 3" },
                    [VIERNES]: { completado: false, nota: "" } // Opcional guardar los false
                }
            }
        ];

        Store.guardarEstado();
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
        }
    },

    agregarHabito: (nombre) => {
        Store.state.habitos.push({
            id: Date.now(),
            nombre,
            registros: {}
        });
        Store.guardarEstado();
    }
};

// Inicializar al cargar
Store.init();
