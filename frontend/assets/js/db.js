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
    save: async (storeName, data) => {
        if (!db) await DBManager.init();

        // Marcar como pendiente de sincronización
        data.syncStatus = 'pending';
        data.lastModified = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                // Agregar a outbox para sincronizar con servidor
                DBManager.addToOutbox({
                    type: storeName,
                    action: 'upsert',
                    data: data
                });
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
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
            'habitLogs': '/habit-logs/'
        };

        const url = baseUrl + endpoints[operation.type];
        const method = operation.action === 'delete' ? 'DELETE' : 'POST';

        const response = await fetch(url + (operation.action === 'delete' ? operation.data.id + '/' : ''), {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
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
