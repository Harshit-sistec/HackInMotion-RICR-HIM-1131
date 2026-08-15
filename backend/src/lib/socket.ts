import type { Server as HTTPServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config, requireJwtSecret } from '../config.js';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: config.clientOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      next(new Error('Missing authentication token.'));
      return;
    }
    try {
      const payload = jwt.verify(token, requireJwtSecret()) as { sub: string };
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired session.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToUsers(userIds: string[], event: string, payload: unknown): void {
  for (const id of userIds) emitToUser(id, event, payload);
}
