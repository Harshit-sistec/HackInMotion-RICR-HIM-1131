import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket?.disconnect();
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
