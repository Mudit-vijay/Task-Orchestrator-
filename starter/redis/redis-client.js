// redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
    url: 'redis://redis:6379' // 👈 'redis' is the Docker service name
});

redisClient.on('error', (err) => console.error('Redis error:', err));

redisClient.connect();

module.exports = redisClient;