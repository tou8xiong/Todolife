// IndexedDB helper — stores tasks so the service worker can read them
// (Service workers cannot access localStorage)

const DB_NAME = "todolife-tasks";
const STORE_NAME = "tasks";

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            (e.target as IDBOpenDBRequest).result.createObjectStore(STORE_NAME, {
                keyPath: "userEmail",
            });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveTasksToDB(userEmail: string, tasks: object[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ userEmail, tasks });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
