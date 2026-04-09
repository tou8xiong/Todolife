import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

if (!globalForRedis.redis) {
  globalForRedis.redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableOfflineQueue: false,
  });

  globalForRedis.redis.on("error", (err) => {
    console.error("[Redis] connection error:", err.message);
  });
}

const redis = globalForRedis.redis;

export default redis;
