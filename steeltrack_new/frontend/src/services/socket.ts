import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('/', {
  path: '/socket.io',
});

type DataChangedPayload = Record<string, unknown> | undefined;

export const onDataChanged = (callback: (data: DataChangedPayload) => void) => {
  socket.on('dataChanged', callback);
  return () => {
    socket.off('dataChanged', callback);
  };
};
