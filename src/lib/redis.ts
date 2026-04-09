import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

if (!globalForRedis.redis) {
  if (!process.env.REDIS_URL) {
    throw new Error("[Redis] REDIS_URL environment variable is not set");
  }
  globalForRedis.redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,   // only connect when first command is issued (safe at build time)
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
