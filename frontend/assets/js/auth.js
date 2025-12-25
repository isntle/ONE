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
        }

        if (isRegistro) {
            const form = document.querySelector('form');
            if (form) Auth.configurarRegistro(form);
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
                // Buscar usuario por email en IndexedDB
                const usuarios = await DBManager.getByIndex('users', 'email', email);

                if (usuarios && usuarios.length > 0) {
                    const usuario = usuarios[0];
                    if (usuario.password === password) { // En producción usar hash!
                        // Login exitoso
                        usuario.fechaLogin = new Date().toISOString();
                        await DBManager.save('users', usuario); // Actualizar fecha login
                        Store.guardarUsuario(usuario);
                        window.location.href = 'semana.html';
                    } else {
                        UI.toast("Contraseña incorrecta", "error");
                    }
                } else {
                    UI.alert({ titulo: "Error", mensaje: "No existe una cuenta con este correo" });
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
                    nombre: nombre,
                    email: email,
                    password: password, // En producción HASHEAR esto
                    fechaRegistro: new Date().toISOString(),
                    espaciosHabilitados: ['Personal', 'Escuela', 'Trabajo'], // Default todos
                    minutosFocus: 0
                };

                await DBManager.save('users', nuevoUsuario);
                Store.guardarUsuario(nuevoUsuario);

                // Ir a la app principal
                window.location.href = 'semana.html';

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
