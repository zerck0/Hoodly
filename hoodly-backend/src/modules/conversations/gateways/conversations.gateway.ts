/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from '../services/conversations.service';
import { UsersService } from '../../users/services/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private jwksClientInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {
    this.jwksClientInstance = jwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${this.configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
    });
  }

  private getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClientInstance.getSigningKey(kid, (err, key) => {
        if (err || !key) {
          reject(err || new Error('Key not found'));
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }

  private async verifyToken(token: string): Promise<any> {
    const decoded = jwt.decode(token, { complete: true });
    if (
      !decoded ||
      typeof decoded === 'string' ||
      !decoded.header ||
      !decoded.header.kid
    ) {
      throw new Error('Invalid token header');
    }

    const kid = decoded.header.kid;
    const publicKey = await this.getSigningKey(kid);

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        publicKey,
        {
          audience: this.configService.get('AUTH0_AUDIENCE'),
          issuer: `https://${this.configService.get('AUTH0_DOMAIN')}/`,
          algorithms: ['RS256'],
        },
        (err, verified) => {
          if (err) {
            reject(err);
          } else {
            resolve(verified);
          }
        },
      );
    });
  }

  private static activeConnections = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        client.disconnect(true);
        return;
      }

      if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      const verifiedPayload = await this.verifyToken(token);
      const auth0Id = verifiedPayload.sub;
      const user = await this.usersService.getProfileByAuth0Id(auth0Id);

      client.data = {
        userId: user.id,
        email: user.email,
      };

      const userId = user.id;
      if (!ConversationsGateway.activeConnections.has(userId)) {
        ConversationsGateway.activeConnections.set(userId, new Set());
      }
      ConversationsGateway.activeConnections.get(userId)!.add(client.id);

      if (ConversationsGateway.activeConnections.get(userId)!.size === 1) {
        this.server.emit('userPresence', { userId, status: 'online' });
      }
    } catch (e) {
      console.error('[WS] Erreur de connexion socket authentifiée :', e);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && ConversationsGateway.activeConnections.has(userId)) {
      const socketSet = ConversationsGateway.activeConnections.get(userId)!;
      socketSet.delete(client.id);

      if (socketSet.size === 0) {
        ConversationsGateway.activeConnections.delete(userId);
        if (this.server) {
          this.server.emit('userPresence', { userId, status: 'offline' });
        }
      }
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(): string[] {
    return Array.from(ConversationsGateway.activeConnections.keys());
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId || !data.conversationId) return;

    try {
      const conv = await this.conversationsService.findOne(
        data.conversationId,
        userId,
      );
      if (conv) {
        const roomName = `room:conversation:${data.conversationId}`;
        await client.join(roomName);
      }
    } catch (e) {
      console.error(
        `[WS] User ${userId} non autorisé à rejoindre la conversation ${data.conversationId}:`,
        e,
      );
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId || !data.conversationId) return;

    const roomName = `room:conversation:${data.conversationId}`;
    await client.leave(roomName);
  }

  emitNewMessage(conversationId: string, message: any) {
    const roomName = `room:conversation:${conversationId}`;
    if (this.server) {
      this.server.to(roomName).emit('newMessage', message);
    }
  }

  emitMessageUpdated(conversationId: string, message: any) {
    const roomName = `room:conversation:${conversationId}`;
    if (this.server) {
      this.server.to(roomName).emit('messageUpdated', message);
    }
  }

  emitMessageDeleted(conversationId: string, messageId: string) {
    const roomName = `room:conversation:${conversationId}`;
    if (this.server) {
      this.server.to(roomName).emit('messageDeleted', { messageId });
    }
  }
}
