const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', () => console.log('Redis: offline'));
redisClient.connect().catch(() => {});

async function getCache(key) {
  try {
    return await redisClient.get(key);
  } catch (e) {
    return null;
  }
}

async function setCache(key, value, ttl = 30) {
  try {
    await redisClient.set(key, value, { EX: ttl });
  } catch (e) {}
}

async function clearCache() {
  try {
    await redisClient.del('api_data');
  } catch (e) {}
}

module.exports = { redisClient, getCache, setCache, clearCache };
