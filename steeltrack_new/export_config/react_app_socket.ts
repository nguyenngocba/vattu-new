import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('/', {
  path: '/socket.io',
});

export const onDataChanged = (callback: (data: any) => void) => {
  socket.on('dataChanged', callback);
  return () => socket.off('dataChanged', callback);
};
