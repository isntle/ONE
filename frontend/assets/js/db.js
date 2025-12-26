/*
 * db.js - IndexedDB Manager para Offline-First
 * Maneja almacenamiento local y sincronización con Backend
 */

const DB_NAME = 'ONE_DB';
const DB_VERSION = 2;
let db = null;

// Inicializar IndexedDB
const DBManager = {
    init: async () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                console.log('🔧 Creando esquema de IndexedDB...');

                // Object Stores (tablas)
                if (!db.objectStoreNames.contains('tareas')) {
                    const tareasStore = db.createObjectStore('tareas', { keyPath: 'id' });
                    tareasStore.createIndex('fecha', 'fecha', { unique: false });
                    tareasStore.createIndex('espacio', 'espacio', { unique: false });
                    tareasStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                    usersStore.createIndex('email', 'email', { unique: true });
                }

                if (!db.objectStoreNames.contains('proyectos')) {
                    const proyectosStore = db.createObjectStore('proyectos', { keyPath: 'id' });
                    proyectosStore.createIndex('espacio', 'espacio', { unique: false });
                    proyectosStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                if (!db.objectStoreNames.contains('habitos')) {
                    const habitosStore = db.createObjectStore('habitos', { keyPath: 'id' });
                    habitosStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                if (!db.objectStoreNames.contains('habitLogs')) {
                    const logsStore = db.createObjectStore('habitLogs', { keyPath: 'id' });
                    logsStore.createIndex('habit_id', 'habit_id', { unique: false });
                    logsStore.createIndex('date', 'date', { unique: false });
                }

                // Outbox para cambios offline
                if (!db.objectStoreNames.contains('outbox')) {
                    const outboxStore = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
                    outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
                    outboxStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    },

    // CRUD Operations
    save: async (storeName, data, fromBackend = false) => {
        if (!db) await DBManager.init();

        // Si viene del backend, ya está sincronizado ('synced'). Si es local, 'pending'.
        data.syncStatus = fromBackend ? 'synced' : 'pending';
        if (!fromBackend) data.lastModified = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                // Solo agregar a outbox si es un cambio LOCAL
                if (!fromBackend) {
                    DBManager.addToOutbox({
                        type: storeName,
                        action: 'upsert',
                        data: data
                    });
                }
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    },

    getCookie: (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

    getAll: async (storeName) => {
        if (!db) await DBManager.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    getByIndex: async (storeName, indexName, value) => {
        if (!db) await DBManager.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    delete: async (storeName, id) => {
        if (!db) await DBManager.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                // Registrar borrado en outbox
                DBManager.addToOutbox({
                    type: storeName,
                    action: 'delete',
                    data: { id }
                });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Outbox Pattern
    addToOutbox: async (operation) => {
        if (!db) await DBManager.init();

        operation.timestamp = Date.now();
        operation.synced = false;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['outbox'], 'readwrite');
            const store = transaction.objectStore('outbox');
            const request = store.add(operation);

            request.onsuccess = () => {
                // Intentar sincronizar si estamos online
                if (navigator.onLine) {
                    DBManager.syncWithBackend();
                }
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Sincronización con Backend
    syncWithBackend: async () => {
        if (!navigator.onLine) {
            console.log('⚠️ Sin conexión. Sincronización pospuesta.');
            return;
        }

        console.log('🔄 Iniciando sincronización con backend...');

        const outbox = await DBManager.getAll('outbox');
        const pending = outbox.filter(op => !op.synced);

        for (const operation of pending) {
            try {
                await DBManager.executeSync(operation);

                // Marcar como sincronizado
                const transaction = db.transaction(['outbox'], 'readwrite');
                const store = transaction.objectStore('outbox');
                operation.synced = true;
                store.put(operation);

            } catch (error) {
                console.error('❌ Error sincronizando:', operation, error);
            }
        }

        console.log('✅ Sincronización completada');
    },

    executeSync: async (operation) => {
        const baseUrl = 'http://127.0.0.1:8000/api';
        const endpoints = {
            'tareas': '/tasks/',
            'proyectos': '/projects/',
            'habitos': '/habits/',
            'habitLogs': '/habit-logs/',
            'users': '/users/'
        };

        const url = baseUrl + endpoints[operation.type];
        const method = operation.action === 'delete' ? 'DELETE' : 'POST';

        const response = await fetch(url + (operation.action === 'delete' ? operation.data.id + '/' : ''), {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': DBManager.getCookie('csrftoken') || ''
            },
            credentials: 'include', // Cookie de sesión
            body: operation.action !== 'delete' ? JSON.stringify(operation.data) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    },

    // Limpiar outbox sincronizado (mantenimiento)
    cleanOutbox: async () => {
        const outbox = await DBManager.getAll('outbox');
        const synced = outbox.filter(op => op.synced);

        for (const op of synced) {
            await DBManager.delete('outbox', op.id);
        }
    },

    // Cargar todo del backend (Restore Backup)
    loadAllFromBackend: async () => {
        if (!navigator.onLine) return;

        console.log("⬇️ Descargando datos del servidor...");
        // Orden importante: Proyectos antes de Tareas (por FK si existiera)
        const types = ['projects', 'tasks', 'habits'];
        const localTypes = { 'tasks': 'tareas', 'projects': 'proyectos', 'habits': 'habitos' };

        for (const type of types) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/${type}/`, {
                    credentials: 'include' // Auth cookie
                });

                if (response.ok) {
                    const data = await response.json();
                    const localStore = localTypes[type];

                    // Guardar en IndexedDB y Store en memoria
                    // Nota: Esto sobrescribe lo local con lo del servidor
                    // Idealmente sería un merge, pero para restore está bien

                    // Helper simple para Store
                    if (type === 'tasks') Store.state.tareas = [];
                    if (type === 'projects') Store.state.proyectos = [];
                    if (type === 'habits') Store.state.habitos = []; // La lógica de habits es más compleja por logs, simplificado aquí

                    for (const item of data) {
                        // Transformar keys si es necesario (el Serializer ya las manda "frontend friendly"?)
                        // Nuestro Serializer envia Keys del Backend (id, title, status) O Keys mapeadas?
                        // El Serializer de Tasks OUTPUTS: id, titulo, fecha... (gracias a los fields explícitos)
                        // Verify this assumption!

                        // await DBManager.save(localStore, item);
                        // FIX: Usar flag fromBackend=true para no rebotar a outbox
                        await DBManager.save(localStore, item, true);
                    }
                }
            } catch (err) {
                console.error(`Error cargando ${type}:`, err);
            }
        }

        // Recargar en memoria desde IDB (o directo arriba)
        Store.state.tareas = await DBManager.getAll('tareas');
        Store.state.proyectos = await DBManager.getAll('proyectos');
        Store.state.habitos = await DBManager.getAll('habitos');
        Store.guardarEstado();
        console.log("✅ Datos restaurados del servidor");
    },
    // Limpiar toda la base de datos (Logout)
    clearAll: async () => {
        if (!db) await DBManager.init();

        const stores = ['tareas', 'proyectos', 'habitos', 'habitLogs', 'outbox', 'users'];
        const transaction = db.transaction(stores, 'readwrite');

        stores.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
                transaction.objectStore(storeName).clear();
            }
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log("🧹 Base de datos limpia (Logout)");
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }
};

// Auto-sincronización cuando vuelva online
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada. Sincronizando...');
    DBManager.syncWithBackend();
});

window.addEventListener('offline', () => {
    console.log('📡 Modo offline. Los cambios se guardarán localmente.');
});

// Exportar para uso global
window.DBManager = DBManager;
