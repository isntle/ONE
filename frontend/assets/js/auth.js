/*
 * auth.js
 * Lógica de autenticación (Login / Registro)
 */

const Auth = {
    init: () => {
        // Detectar página por URL o contenido único
        const isLogin = window.location.pathname.includes('login.html');
        const isRegistro = window.location.pathname.includes('registro.html');

        if (isLogin) {
            const form = document.querySelector('form');
            if (form) Auth.configurarLogin(form);
            Auth.setupPasswordToggle();
        }

        if (isRegistro) {
            const form = document.querySelector('form');
            if (form) Auth.configurarRegistro(form);
            Auth.setupPasswordToggle();
        }
    },

    setupPasswordToggle: () => {
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                // Toggle icon
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.setAttribute('data-lucide', 'eye-off');
                    } else {
                        icon.setAttribute('data-lucide', 'eye');
                    }
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }
    },

    configurarLogin: (form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                UI.toast("Por favor completa todos los campos", "error");
                return;
            }

            try {
                // 1. Buscar usuario por email en IndexedDB (Local)
                const usuarios = await DBManager.getByIndex('users', 'email', email);

                if (usuarios && usuarios.length > 0) {
                    const usuario = usuarios[0];
                    if (usuario.password === password) {
                        // Login Local Exitoso
                        console.log("Login Local");
                        usuario.fechaLogin = new Date().toISOString();
                        await DBManager.save('users', usuario);
                        Store.guardarUsuario(usuario);
                        window.location.href = 'semana.html';
                        return;
                    } else {
                        console.warn("Contraseña local incorrecta. Intentando con servidor...");
                        // NO HACEMOS RETURN, dejamos que pase al bloque de abajo (Backend)
                        // UI.toast("Contraseña incorrecta (Local)", "error"); 
                    }
                }

                // 2. Si no esta en local, intentar en Backend (Nube)
                console.log("☁️ Buscando usuario en la nube...");
                try {
                    const response = await fetch('http://127.0.0.1:8000/api/login/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ username: email, email: email, password: password })
                    });

                    if (response.ok) {
                        const userBackend = await response.json();
                        console.log("✅ Login Remoto Exitoso", userBackend);


                        // Limpiar estado previo
                        Store.state.tareas = [];
                        Store.state.proyectos = [];
                        Store.state.habitos = [];
                        localStorage.clear();

                        await DBManager.save('users', userBackend);
                        Store.guardarUsuario(userBackend);

                        // RESTAURAR DATOS
                        await DBManager.loadAllFromBackend();

                        window.location.href = 'semana.html';
                    } else {
                        UI.alert({ titulo: "Error", mensaje: "Credenciales inválidas" });
                    }
                } catch (err) {
                    console.error("Error conectando con servidor:", err);
                    UI.alert({ titulo: "Error", mensaje: "No existe cuenta local y no se pudo conectar al servidor." });
                }

            } catch (error) {
                console.error("Error en login:", error);
                UI.toast("Error al iniciar sesión. Intenta de nuevo.", "error");
            }
        });
    },

    configurarRegistro: (form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Validaciones
            if (!nombre || !email || !password) {
                UI.toast("Completa todos los campos", "error");
                return;
            }
            if (!Auth.validarEmail(email)) {
                UI.toast("Ingresa un correo válido", "error");
                return;
            }
            if (password.length < 8) {
                UI.toast("La contraseña debe tener al menos 8 caracteres", "error");
                return;
            }

            try {
                // Verificar si ya existe
                const existentes = await DBManager.getByIndex('users', 'email', email);
                if (existentes && existentes.length > 0) {
                    UI.alert({ titulo: "Atención", mensaje: "Este correo ya está registrado" });
                    return;
                }

                // Crear usuario
                const nuevoUsuario = {
                    id: Date.now().toString(), // ID único string
                    username: email, // REQUIRED for Django User model
                    nombre: nombre,
                    email: email,
                    password: password, // En producción HASHEAR esto
                    fechaRegistro: new Date().toISOString(),
                    espaciosHabilitados: ['Personal', 'Escuela', 'Trabajo'], // Default todos
                    minutosFocus: 0
                };

                Store.state.tareas = [];
                Store.state.proyectos = [];
                Store.state.habitos = [];
                Store.state.usuario = null;
                Store.guardarEstado();
                localStorage.clear(); // Limpiar todo el storage para asegurar

                // Guardar usuario para envio
                await DBManager.save('users', nuevoUsuario);

                // Forzar sincronización
                console.log("⏳ Sincronizando registro con backend...");
                await DBManager.syncWithBackend();

                UI.toast("Cuenta creada correctamente. Por favor inicia sesión.", "success");

                // Redirigir al LOGIN (no al dashboard) para forzar sesión limpia
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                console.error("Error en registro:", error);
                UI.toast("Ocurrió un error al crear la cuenta", "error");
            }
        });
    },

    validarEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

document.addEventListener('DOMContentLoaded', Auth.init);
