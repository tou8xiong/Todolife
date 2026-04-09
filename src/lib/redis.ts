import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis | null };

function createClient(): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error("[Redis] REDIS_URL environment variable is not set");
  }
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    enableOfflineQueue: false,
    connectTimeout: 8000,
    commandTimeout: 8000,
    retryStrategy: (times) => {
      if (times > 2) return null; // give up after 2 retries
      return Math.min(times * 300, 1000);
    },
  });
  client.on("error", (err) => {
    console.error("[Redis] connection error:", err.message);
  });
  return client;
}

function getRedis(): Redis {
  const status = globalForRedis.redis?.status;

  // Reconnect if the cached client is dead or closed
  if (!globalForRedis.redis || status === "end" || status === "close") {
    if (globalForRedis.redis) {
      globalForRedis.redis.disconnect();
      globalForRedis.redis = null;
    }
    globalForRedis.redis = createClient();
  }

  return globalForRedis.redis;
}

// Export a proxy so every .get() / .set() always goes through getRedis()
const redis = new Proxy({} as Redis, {
  get(_target, prop: string) {
    const client = getRedis();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default redis;
