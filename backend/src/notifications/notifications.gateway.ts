import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private activeClients = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.activeClients.get(client.id);
    if (userId) {
      this.activeClients.delete(client.id);
      this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; role: string; departmentId?: string }
  ) {
    if (!data || !data.userId) return;

    this.activeClients.set(client.id, data.userId);

    client.join(`user_${data.userId}`);
    this.logger.log(`Client ${client.id} registered as user_${data.userId}`);

    client.join(`role_${data.role}`);
    this.logger.log(`Client ${client.id} joined role_${data.role}`);

    if (data.departmentId) {
      client.join(`dept_${data.departmentId}`);
      this.logger.log(`Client ${client.id} joined dept_${data.departmentId}`);
    }

    client.emit('registered', { status: 'ok' });
  }

  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user_${userId}`).emit(event, payload);
    this.logger.log(`Sent event "${event}" to user_${userId}`);
  }

  sendToRole(role: string, event: string, payload: any) {
    this.server.to(`role_${role}`).emit(event, payload);
    this.logger.log(`Sent event "${event}" to role_${role}`);
  }

  sendToDept(deptId: string, event: string, payload: any) {
    this.server.to(`dept_${deptId}`).emit(event, payload);
    this.logger.log(`Sent event "${event}" to dept_${deptId}`);
  }
}