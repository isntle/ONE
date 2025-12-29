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

                // Alternar icono

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

    obtenerApiUrl: () => {
        const API_HOST = window.location.hostname || 'localhost';
        const API_PROTOCOL = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
        return `${API_PROTOCOL}//${API_HOST === '' ? 'localhost' : API_HOST}:8000/api`;
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
                const API_URL = Auth.obtenerApiUrl();
                let backendStatus = null;
                let backendUser = null;

                if (navigator.onLine) {
                    try {
                        const response = await fetch(`${API_URL}/login/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ username: email, email: email, password: password })
                        });

                        backendStatus = response.status;
                        if (response.ok) {
                            backendUser = await response.json();
                        }
                    } catch (err) {
                        console.error("Error conectando con servidor:", err);
                    }
                }

                if (backendUser) {
                    const userForLocal = { ...backendUser, password };
                    await DBManager.save('users', userForLocal, true);
                    Store.guardarUsuario(userForLocal);

                    try {
                        const syncResult = await DBManager.syncWithBackend();
                        if (!syncResult || syncResult.ok) {
                            await DBManager.loadAllFromBackend();
                        } else {
                            UI.toast("Hay cambios pendientes sin sincronizar. Usando datos locales.", "warning");
                        }
                    } catch (error) {
                        console.error("Error sincronizando en login:", error);
                        UI.toast("No se pudo sincronizar todo, entrando con datos locales.", "warning");
                    }

                    window.location.href = 'semana.html';
                    return;
                }

                // Respaldo local si no hay login remoto

                const usuarios = await DBManager.getByIndex('users', 'email', email);

                if (usuarios && usuarios.length > 0) {
                    const usuario = usuarios[0];
                    if (usuario.password === password) {
                        console.log("Login Local");
                        usuario.fechaLogin = new Date().toISOString();
                        await DBManager.save('users', usuario, true);
                        Store.guardarUsuario(usuario);

                        if (navigator.onLine && backendStatus === 401) {
                            const registroResponse = await fetch(`${API_URL}/register/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    username: email,
                                    nombre: usuario.nombre || email,
                                    email: email,
                                    password: password
                                })
                            });

                            if (registroResponse.ok) {
                                const nuevoBackend = await registroResponse.json();
                                const userLocal = { ...nuevoBackend, password };
                                await DBManager.save('users', userLocal, true);
                                Store.guardarUsuario(userLocal);

                                const loginResponse = await fetch(`${API_URL}/login/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ username: email, email: email, password: password })
                                });

                                if (loginResponse.ok) {
                                    try {
                                        const syncResult = await DBManager.syncWithBackend();
                                        if (!syncResult || syncResult.ok) {
                                            await DBManager.loadAllFromBackend();
                                        } else {
                                            UI.toast("Hay cambios pendientes sin sincronizar. Usando datos locales.", "warning");
                                        }
                                    } catch (error) {
                                        console.error("Error sincronizando en login:", error);
                                        UI.toast("No se pudo sincronizar todo, entrando con datos locales.", "warning");
                                    }
                                }
                            }
                        }

                        window.location.href = 'semana.html';
                        return;
                    }
                }

                UI.alert({ titulo: "Error", mensaje: "Credenciales inválidas" });
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
                const existentes = await DBManager.getByIndex('users', 'email', email);
                if (existentes && existentes.length > 0) {
                    UI.alert({ titulo: "Atención", mensaje: "Este correo ya está registrado" });
                    return;
                }

                const nuevoUsuario = {
                    id: Date.now().toString(),
                    username: email,
                    nombre: nombre,
                    email: email,
                    password: password,
                    fechaRegistro: new Date().toISOString(),
                    espaciosHabilitados: ['Personal', 'Escuela', 'Trabajo'],
                    minutosFocus: 0
                };

                Store.state.tareas = [];
                Store.state.proyectos = [];
                Store.state.habitos = [];
                Store.state.usuario = null;
                Store.guardarEstado();
                localStorage.clear();

                const API_URL = Auth.obtenerApiUrl();

                if (navigator.onLine) {
                    const response = await fetch(`${API_URL}/register/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: email,
                            nombre: nombre,
                            email: email,
                            password: password
                        })
                    });

                    if (response.ok) {
                        const userBackend = await response.json();
                        const userLocal = { ...userBackend, password };
                        await DBManager.save('users', userLocal, true);

                        UI.toast("Cuenta creada correctamente. Por favor inicia sesión.", "success");
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                        return;
                    }

                    if (response.status === 400) {
                        UI.alert({ titulo: "Atención", mensaje: "Este correo ya está registrado" });
                        return;
                    }
                }

                await DBManager.save('users', nuevoUsuario, true);
                UI.toast("Cuenta creada localmente. Inicia sesión para sincronizar.", "info");
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
