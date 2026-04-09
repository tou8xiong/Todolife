import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

if (!globalForRedis.redis) {
  globalForRedis.redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    commandTimeout: 5000,
  });

  globalForRedis.redis.on("error", (err) => {
    console.error("[Redis] connection error:", err.message);
  });
}

const redis = globalForRedis.redis;

export default redis;
