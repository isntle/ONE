/*
 * store.js
 * Gestión de estado V2: Espacios, Tareas, Proyectos y Persistencia
 */

const Store = {
    KEYS: {
        USUARIO: 'one_usuario',
        DATA: 'one_data', // Nuevo objeto unificado para datos del usuario
        SESION: 'one_sesion',
        ESPACIO: 'one_espacio_actual'
    },

    // Estado en memoria
    state: {
        usuario: null,
        espacioActual: 'Personal', // 'Personal', 'Escuela', 'Trabajo'
        tareas: [],
        proyectos: [],
        habitos: [],
        gastos: [],
        presupuestos: [],
        clases: []
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
        const espacioGuardado = localStorage.getItem(Store.KEYS.ESPACIO);

        if (espacioGuardado && ['Personal', 'Escuela', 'Trabajo'].includes(espacioGuardado)) {
            Store.state.espacioActual = espacioGuardado;
        }

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
                const gastosConOwner = (parsed.gastos || []).map(g => {
                    if (g && !g.owner_email) return { ...g, owner_email: currentUserEmail };
                    return g;
                });
                const presupuestosConOwner = (parsed.presupuestos || []).map(p => {
                    if (p && !p.owner_email) return { ...p, owner_email: currentUserEmail };
                    return p;
                });
                const clasesConOwner = (parsed.clases || []).map(c => {
                    if (c && !c.owner_email) return { ...c, owner_email: currentUserEmail };
                    return c;
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
                Store.state.gastos = Store.deduplicarPorId(gastosConOwner.filter(g => g.owner_email === currentUserEmail));
                Store.state.presupuestos = Store.deduplicarPorId(presupuestosConOwner.filter(p => p.owner_email === currentUserEmail));
                Store.state.clases = Store.deduplicarPorId(clasesConOwner.filter(c => c.owner_email === currentUserEmail));
            } else {
                // Respaldo si no hay usuario logueado
                Store.state.tareas = [];
                Store.state.proyectos = [];
                Store.state.habitos = [];
                Store.state.gastos = [];
                Store.state.presupuestos = [];
                Store.state.clases = [];
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
        Store.state.gastos = Store.deduplicarPorId(Store.state.gastos);
        Store.state.presupuestos = Store.deduplicarPorId(Store.state.presupuestos);
        Store.state.clases = Store.deduplicarPorId(Store.state.clases);

        const data = {
            tareas: Store.state.tareas,
            proyectos: Store.state.proyectos,
            habitos: Store.state.habitos,
            gastos: Store.state.gastos,
            presupuestos: Store.state.presupuestos,
            clases: Store.state.clases
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
        if (!['Personal', 'Escuela', 'Trabajo'].includes(espacio)) return;
        Store.state.espacioActual = espacio;
        localStorage.setItem(Store.KEYS.ESPACIO, espacio);
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

    // --- FINANZAS ---
    obtenerGastos: () => {
        const gastos = Store.deduplicarPorId(Store.state.gastos);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        return gastos.filter(g => {
            if (currentUserEmail && g.owner_email && g.owner_email !== currentUserEmail) return false;
            const espacio = g.espacio || g.espacio_nombre;
            return espacio === Store.state.espacioActual;
        });
    },

    agregarGasto: (gasto) => {
        const montoNum = Number(gasto.monto);
        const fechaVal = gasto.fecha || Store.fechaIsoLocal(new Date());
        const nuevoGasto = {
            id: Store.generarId(),
            espacio: Store.state.espacioActual,
            owner_email: Store.state.usuario ? Store.state.usuario.email : null,
            descripcion: gasto.descripcion,
            categoria: gasto.categoria || '',
            fecha: fechaVal,
            monto: Number.isNaN(montoNum) ? 0 : montoNum
        };
        Store.state.gastos.push(nuevoGasto);
        Store.guardarEstado();
        if (typeof DBManager !== 'undefined') {
            DBManager.save('gastos', nuevoGasto);
        }
        return nuevoGasto;
    },

    actualizarGasto: (id, cambios) => {
        const index = Store.state.gastos.findIndex(g => String(g.id) === String(id));
        if (index !== -1) {
            Store.state.gastos[index] = { ...Store.state.gastos[index], ...cambios };
            Store.guardarEstado();
            if (typeof DBManager !== 'undefined') {
                DBManager.save('gastos', Store.state.gastos[index]);
            }
            return Store.state.gastos[index];
        }
        return null;
    },

    eliminarGasto: (id) => {
        const gasto = Store.state.gastos.find(g => String(g.id) === String(id));
        const targetId = gasto ? gasto.id : id;
        Store.state.gastos = Store.state.gastos.filter(g => String(g.id) !== String(id));
        Store.guardarEstado();
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('gastos', targetId);
        }
    },

    obtenerPresupuestos: () => {
        const presupuestos = Store.deduplicarPorId(Store.state.presupuestos);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        return presupuestos.filter(p => {
            if (currentUserEmail && p.owner_email && p.owner_email !== currentUserEmail) return false;
            const espacio = p.espacio || p.espacio_nombre;
            return espacio === Store.state.espacioActual;
        });
    },

    obtenerPresupuestoMensual: (mes, anio) => {
        const mesNum = Number(mes);
        const anioNum = Number(anio);
        if (Number.isNaN(mesNum) || Number.isNaN(anioNum)) return null;

        const candidatos = Store.obtenerPresupuestos().filter(p => {
            return Number(p.mes) === mesNum && Number(p.anio) === anioNum;
        });
        if (candidatos.length === 0) return null;

        const ordenados = candidatos.slice().sort((a, b) => {
            const fechaA = new Date(a.lastModified || a.updated_at || 0).getTime();
            const fechaB = new Date(b.lastModified || b.updated_at || 0).getTime();
            return fechaA - fechaB;
        });
        return ordenados[ordenados.length - 1];
    },

    definirPresupuestoMensual: (mes, anio, monto) => {
        const mesNum = Number(mes);
        const anioNum = Number(anio);
        const montoNum = Number(monto);
        if (Number.isNaN(mesNum) || Number.isNaN(anioNum) || Number.isNaN(montoNum)) return null;

        const espacio = Store.state.espacioActual;
        const ownerEmail = Store.state.usuario ? Store.state.usuario.email : null;
        const existente = Store.state.presupuestos.find(p => {
            const espacioPresupuesto = p.espacio || p.espacio_nombre;
            if (ownerEmail && p.owner_email && p.owner_email !== ownerEmail) return false;
            return Number(p.mes) === mesNum && Number(p.anio) === anioNum && espacioPresupuesto === espacio;
        });

        if (existente) {
            existente.monto = montoNum;
            Store.guardarEstado();
            if (typeof DBManager !== 'undefined') {
                DBManager.save('presupuestos', existente);
            }
            return existente;
        }

        const nuevoPresupuesto = {
            id: Store.generarId(),
            mes: mesNum,
            anio: anioNum,
            monto: montoNum,
            espacio: espacio,
            owner_email: ownerEmail
        };
        Store.state.presupuestos.push(nuevoPresupuesto);
        Store.guardarEstado();
        if (typeof DBManager !== 'undefined') {
            DBManager.save('presupuestos', nuevoPresupuesto);
        }
        return nuevoPresupuesto;
    },

    // --- HORARIO ---
    obtenerClases: () => {
        const clases = Store.deduplicarPorId(Store.state.clases);
        const currentUserEmail = Store.state.usuario ? Store.state.usuario.email : null;
        return clases.filter(c => {
            if (currentUserEmail && c.owner_email && c.owner_email !== currentUserEmail) return false;
            const espacio = c.espacio || c.espacio_nombre;
            return espacio === Store.state.espacioActual;
        });
    },

    agregarClase: (clase) => {
        const nuevaClase = {
            id: Store.generarId(),
            espacio: Store.state.espacioActual,
            owner_email: Store.state.usuario ? Store.state.usuario.email : null,
            materia: clase.materia,
            profesor: clase.profesor || '',
            salon: clase.salon || '',
            diaSemana: clase.diaSemana,
            horaInicio: clase.horaInicio,
            horaFin: clase.horaFin,
            color: clase.color || '#429155'
        };
        Store.state.clases.push(nuevaClase);
        Store.guardarEstado();
        if (typeof DBManager !== 'undefined') {
            DBManager.save('clases', nuevaClase);
        }
        return nuevaClase;
    },

    actualizarClase: (id, cambios) => {
        const index = Store.state.clases.findIndex(c => String(c.id) === String(id));
        if (index !== -1) {
            Store.state.clases[index] = { ...Store.state.clases[index], ...cambios };
            Store.guardarEstado();
            if (typeof DBManager !== 'undefined') {
                DBManager.save('clases', Store.state.clases[index]);
            }
            return Store.state.clases[index];
        }
        return null;
    },

    eliminarClase: (id) => {
        const clase = Store.state.clases.find(c => String(c.id) === String(id));
        const targetId = clase ? clase.id : id;
        Store.state.clases = Store.state.clases.filter(c => String(c.id) !== String(id));
        Store.guardarEstado();
        if (typeof DBManager !== 'undefined') {
            DBManager.delete('clases', targetId);
        }
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

            Store.state.gastos = [
                { id: 401, descripcion: "Café", categoria: "Comida", fecha: hoyIso, monto: 45, espacio: "Personal" },
                { id: 402, descripcion: "Uber", categoria: "Transporte", fecha: hoyIso, monto: 120, espacio: "Personal" },
                { id: 403, descripcion: "Libreta", categoria: "Escuela", fecha: ayerIso, monto: 80, espacio: "Personal" }
            ];

            Store.state.presupuestos = [
                { id: 501, mes: hoy.getMonth() + 1, anio: hoy.getFullYear(), monto: 3000, espacio: "Personal" }
            ];

            Store.state.clases = [
                { id: 601, materia: "Matemáticas", profesor: "Dra. Ramos", salon: "201", diaSemana: 0, horaInicio: "08:00", horaFin: "09:30", color: "#3B82F6", espacio: "Escuela" },
                { id: 602, materia: "Programación", profesor: "Ing. Salas", salon: "Lab 3", diaSemana: 2, horaInicio: "10:00", horaFin: "11:30", color: "#429155", espacio: "Escuela" },
                { id: 603, materia: "Historia", profesor: "Mtra. López", salon: "105", diaSemana: 4, horaInicio: "12:00", horaFin: "13:00", color: "#F59E0B", espacio: "Escuela" }
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
