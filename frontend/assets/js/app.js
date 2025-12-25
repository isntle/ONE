/*
 * app.js
 * Orquestador principal de la aplicación ONE
 */

document.addEventListener('DOMContentLoaded', iniciarAplicacion);

function iniciarAplicacion() {
    console.log('ONE arriba');

    // 1. Verificar Sesión
    verificarSesion();

    // 2. Cargar datos de usuario en la interfaz
    cargarDatosUsuario();

    // 3. Renderizar Iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    if (typeof Icons !== 'undefined') {
        Icons.init();
    }

    // 4. Configurar Navegación Global (Sidebar)
    configurarSidebar();

    // 5. Configurar Selector de Espacios en Header
    configurarEspaciosHeader();
}

function verificarSesion() {
    if (typeof Store === 'undefined') return;

    const usuario = Store.obtenerUsuario();
    const paginaActual = window.location.pathname;

    const paginasPublicas = ['login.html', 'registro.html'];
    const esPublica = paginasPublicas.some(p => paginaActual.includes(p));

    if (!usuario && !esPublica) {
        // Redirigir si no hay sesión y es privada
        window.location.href = 'login.html';
    } else if (usuario && paginaActual.includes('login.html')) {
        window.location.href = 'semana.html';
    }
}

function cargarDatosUsuario() {
    if (typeof Store === 'undefined') return;

    const usuario = Store.obtenerUsuario();
    if (!usuario) return;

    // Inicial del header
    const iniciales = document.querySelectorAll('.inicial-usuario');
    iniciales.forEach(el => {
        el.textContent = usuario.nombre.charAt(0).toUpperCase();
    });

    // Nombre completo del header
    const nombres = document.querySelectorAll('.nombre-usuario');
    nombres.forEach(el => {
        el.textContent = usuario.nombre;
    });

    // Configurar Logout
    const perfiles = document.querySelectorAll('.perfil-usuario-wrapper');
    perfiles.forEach(p => {
        // Remover listeners previos para evitar duplicados si se llama varias veces
        const clone = p.cloneNode(true);
        p.parentNode.replaceChild(clone, p);

        clone.addEventListener('click', async () => {
            const confirmado = await UI.confirm({
                titulo: 'Cerrar Sesión',
                mensaje: `¿Estás seguro que quieres cerrar la sesión de ${usuario.nombre}?`,
                textoConfirmar: 'Sí, Salir',
                textoCancelar: 'Cancelar'
            });

            if (confirmado) {
                Store.cerrarSesion();
            }
        });
    });
}

function configurarSidebar() {
    const opcionesEspacio = document.querySelectorAll('.menu-lateral a');
    if (opcionesEspacio.length === 0) return;

    // Manejar Clics y Filtrado
    const usuario = Store.obtenerUsuario();
    const espaciosHabilitados = (usuario && usuario.espaciosHabilitados) ? usuario.espaciosHabilitados : ['Personal', 'Escuela', 'Trabajo'];

    opcionesEspacio.forEach(opcion => {
        const texto = opcion.textContent.trim();
        // Detectar si es un enlace de Espacio (Personal, Escuela, Trabajo)
        if (['Personal', 'Escuela', 'Trabajo'].includes(texto)) {

            // Ocultar si no está habilitado
            if (!espaciosHabilitados.includes(texto)) {
                opcion.parentElement.style.display = 'none'; // Asumiendo que está dentro de un li
                return;
            }

            opcion.addEventListener('click', (e) => {
                e.preventDefault();
                Store.setEspacioActual(texto);
            });
        }
    });

    // Escuchar cambios para actualizar UI
    document.addEventListener('cambio-espacio', (e) => {
        actualizarSidebarActivo();
    });

    // Inicializar estado visual
    actualizarSidebarActivo();
}

function actualizarSidebarActivo() {
    const actual = Store.obtenerEspacioActual();
    const opciones = document.querySelectorAll('.menu-lateral a');

    opciones.forEach(opcion => {
        const texto = opcion.textContent.trim();
        if (['Personal', 'Escuela', 'Trabajo'].includes(texto)) {
            if (texto === actual) {
                opcion.classList.add('activo-menu');
            } else {
                opcion.classList.remove('activo-menu');
            }
        }
    });
}

function configurarEspaciosHeader() {
    const botonesEspacio = document.querySelectorAll('.boton-espacio');
    if (botonesEspacio.length === 0) return;

    const usuario = Store.obtenerUsuario();
    const espaciosHabilitados = (usuario && usuario.espaciosHabilitados) ? usuario.espaciosHabilitados : ['Personal', 'Escuela', 'Trabajo'];

    botonesEspacio.forEach(btn => {
        const espacio = btn.getAttribute('data-espacio');

        // Ocultar si no está habilitado
        if (!espaciosHabilitados.includes(espacio)) {
            btn.style.display = 'none';
            return;
        }

        btn.addEventListener('click', () => {
            const espacio = btn.getAttribute('data-espacio');

            // Actualizar UI
            botonesEspacio.forEach(b => b.classList.remove('activo-espacio'));
            btn.classList.add('activo-espacio');

            // Actualizar Store (esto disparará el evento 'cambio-espacio')
            Store.setEspacioActual(espacio);
        });
    });

    // Sincronizar con estado inicial
    const actual = Store.obtenerEspacioActual();
    botonesEspacio.forEach(btn => {
        if (btn.getAttribute('data-espacio') === actual) {
            btn.classList.add('activo-espacio');
        }
    });

    // Escuchar cambios de espacio para sincronizar
    document.addEventListener('cambio-espacio', (e) => {
        botonesEspacio.forEach(btn => {
            if (btn.getAttribute('data-espacio') === e.detail) {
                btn.classList.add('activo-espacio');
            } else {
                btn.classList.remove('activo-espacio');
            }
        });
    });
}
