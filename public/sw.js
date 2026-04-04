// Service Worker — task deadline background notifications
const DB_NAME = "todolife-tasks";
const STORE_NAME = "tasks";

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME, { keyPath: "userEmail" });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllUserTasks() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

function checkAndNotify(tasks) {
    const now = Date.now();
    tasks.forEach((task) => {
        if (!task.date || task.completed) return;

        const deadlineStr = `${task.date}T${task.time || "23:59"}`;
        const deadline = new Date(deadlineStr).getTime();
        const msLeft = deadline - now;
        if (msLeft <= 0) return;

        const hoursLeft = msLeft / (1000 * 60 * 60);
        const daysLeft = hoursLeft / 24;

        let thresholdHours;
        if (daysLeft <= 1) {
            thresholdHours = 1;
        } else if (daysLeft > 3) {
            thresholdHours = 24;
        } else {
            return;
        }

        if (hoursLeft <= thresholdHours) {
            self.registration.showNotification("Task Deadline Approaching", {
                body: `"${task.title}" is due in less than ${thresholdHours === 1 ? "1 hour" : "24 hours"}!`,
                icon: "/Webicon.png",
                tag: `task-${task.id}`,   // prevents duplicate notifications for same task
                renotify: false,
            });
        }
    });
}

// Periodic Background Sync — fires even when browser tab is closed (Chrome/Edge)
self.addEventListener("periodicsync", async (event) => {
    if (event.tag === "check-task-deadlines") {
        event.waitUntil(
            getAllUserTasks().then((records) => {
                records.forEach(({ tasks }) => checkAndNotify(tasks));
            })
        );
    }
});

// When user clicks the notification, open the tasks page
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes("/mytasks") && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow("/mytasks");
        })
    );
});
