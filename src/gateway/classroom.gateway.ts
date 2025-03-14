import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ClassroomService } from '../classroom/classroom.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import {
  CustomSocket,
  WsJwtAuthGuard,
} from '../auth/guards/WsJwtAuthGuard.guard';

@WebSocketGateway({ cors: { origin: '*' } }) // Allow CORS for frontend connections
export class ClassroomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly classroomService: ClassroomService) {}

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
    this.classroomService.setSocketServer(server);
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // User joins a classroom
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join_classroom')
  async handleJoinClassroom(
    @MessageBody() data: { classroomId: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const response = await this.classroomService.joinClassroom(
      data.classroomId,
      client,
    );
    client.join(data.classroomId);
    this.server.to(data.classroomId).emit('user_joined', response);
    return response;
  }

  // User leaves a classroom
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leave_classroom')
  async handleLeaveClassroom(
    @MessageBody() data: { classroomId: string; userId: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    client.leave(data.classroomId);
    const response = await this.classroomService.leaveClassroom(
      data.classroomId,
      client,
    );

    this.server.to(data.classroomId).emit('user_left', response);
    return response;
  }

  // Teacher starts the class
  @UseGuards(WsJwtAuthGuard, new RolesGuard('TEACHER'))
  @SubscribeMessage('start_class')
  async handleStartClass(
    @MessageBody() data: { classroomId: string; teacherId: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    return await this.classroomService.startClass(
      data.classroomId,
      client.user.userId,
    );
  }

  // Teacher ends the class
  @UseGuards(WsJwtAuthGuard, new RolesGuard('TEACHER'))
  @SubscribeMessage('end_class')
  async handleEndClass(
    @MessageBody() data: { classroomId: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    return await this.classroomService.endClass(
      data.classroomId,
      client.user.userId,
    );
  }
}
