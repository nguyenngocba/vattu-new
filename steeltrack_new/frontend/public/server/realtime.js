const { Server } = require('socket.io');
const { createClient } = require('redis');

function createRealtime(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://vattu.trivietsteel.local', 'http://vattu.trivietsteel.com'],
      methods: ['GET', 'POST']
    }
  });

  const redisOptions = { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' };
  const pubClient = createClient(redisOptions);
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(require('@socket.io/redis-adapter').createAdapter(pubClient, subClient));
    })
    .catch(() => console.log('Socket.IO Redis adapter: offline'));

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  });

  function notifyAll(event, data) {
    io.emit(event, data);
  }

  return { io, notifyAll };
}

module.exports = { createRealtime };
