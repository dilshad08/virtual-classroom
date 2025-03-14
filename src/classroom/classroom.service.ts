import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';
import { Role, Session, User } from '@prisma/client';
import { CreateClassroomDto } from './dto/CreateClassRoom.dto';
import { CustomSocket } from 'src/auth/guards/WsJwtAuthGuard.guard';

@Injectable()
export class ClassroomService {
  private readonly logger = new Logger(ClassroomService.name);
  private io: Server;

  constructor(private prisma: PrismaService) {}

  setSocketServer(io: Server) {
    this.io = io;
  }

  private handleError(classroomId: string, error: Error) {
    this.io.emit('error', { message: error.message });
    throw error;
  }

  async createClassroom(dto: CreateClassroomDto, teacherId: string) {
    return await this.prisma.classroom.create({
      data: {
        name: dto.name,
        isLive: false,
        users: {
          create: {
            userId: teacherId,
            role: Role.TEACHER,
          },
        },
      },
    });
  }

  async joinClassroom(classroomId: string, client: CustomSocket) {
    const isClassRoom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        users: {
          where: {
            userId: client.user.userId,
          },
        },
        sessions: {
          where: {
            endedAt: null,
          },
          include: {
            logs: {
              where: {
                userId: client.user.userId,
              },
            },
          },
        },
      },
    });
    if (!isClassRoom) {
      this.handleError(
        classroomId,
        new NotFoundException('Classroom not found'),
      );
      return;
    }

    if (!isClassRoom.isLive) {
      this.handleError(
        classroomId,
        new BadRequestException('Class is not started'),
      );
      return;
    }

    // const userExists = isClassRoom.users.some(
    //   (user) => user.userId === client.user.userId,
    // );
    // if (userExists) {
    //   this.handleError(
    //     classroomId,
    //     new ForbiddenException('Already in the class'),
    //   );
    //   return;
    // }
    const session = isClassRoom.sessions.find(
      (session) => session.endedAt == null,
    );
    if (!session) {
      this.handleError(
        classroomId,
        new BadRequestException('Session not available'),
      );
    }
    const isUserJoined = session?.logs.find(
      (log) => log.userId == client.user.userId,
    );
    if (isUserJoined && isUserJoined.leftAt == null) {
      this.handleError(
        classroomId,
        new BadRequestException('User already joined class'),
      );
    }
    await this.prisma.$transaction(async (prisma) => {
      await prisma.classroomUser.create({
        data: {
          classroomId,
          userId: client.user.userId,
          role: client.user.role as Role,
        },
      });
      if (session) {
        await prisma.participantLog.create({
          data: {
            sessionId: session.id,
            userId: client.user.userId,
            role: client.user.role as Role,
            joinedAt: new Date(),
          },
        });
      }
    });
    return { message: `${client.user.name} joined the classroom` };
  }

  async leaveClassroom(classroomId: string, client: CustomSocket) {
    const isClassRoom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        users: {
          where: {
            userId: client.user.userId,
          },
        },
        sessions: {
          where: {
            endedAt: null,
          },
          include: {
            logs: {
              where: {
                userId: client.user.userId,
              },
            },
          },
        },
      },
    });
    if (!isClassRoom) {
      this.handleError(
        classroomId,
        new NotFoundException('Classroom not found'),
      );
      return;
    }

    if (!isClassRoom.isLive) {
      this.handleError(
        classroomId,
        new BadRequestException('Class is not started'),
      );
      return;
    }
    const session = isClassRoom.sessions.find(
      (session) => session.endedAt == null,
    );
    if (!session) {
      this.handleError(
        classroomId,
        new BadRequestException('Session not available'),
      );
    }
    const isUserJoined = session?.logs.find(
      (log) => log.userId == client.user.userId && log.leftAt == null,
    );
    if (!isUserJoined || isUserJoined.leftAt) {
      this.handleError(
        classroomId,
        new BadRequestException('User is not available in the class'),
      );
    }

    await this.prisma.participantLog.update({
      where: {
        id: isUserJoined?.id,
      },
      data: { leftAt: new Date() },
    });

    return { message: `${client.user.name} left the class` };
  }

  async startClass(classroomId: string, teacherId: string) {
    const isClassRoom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        users: {
          where: {
            userId: teacherId,
          },
        },
      },
    });

    if (!isClassRoom) {
      this.handleError(
        classroomId,
        new NotFoundException('Classroom not found'),
      );
      return;
    }

    if (isClassRoom.isLive) {
      this.handleError(
        classroomId,
        new BadRequestException('Classroom is already live'),
      );
      return;
    }

    const teacherExists = isClassRoom.users.some(
      (user) => user.userId === teacherId,
    );
    if (!teacherExists) {
      this.handleError(
        classroomId,
        new ForbiddenException('Only the assigned teacher can start the class'),
      );
      return;
    }

    let session: any;
    await this.prisma.$transaction(async (prisma) => {
      await prisma.classroom.update({
        where: { id: classroomId },
        data: { isLive: true },
      });

      session = await prisma.session.create({
        data: { classroomId, startedAt: new Date() },
      });
      await prisma.participantLog.create({
        data: {
          sessionId: session.id,
          userId: teacherId,
          role: Role.TEACHER,
          joinedAt: new Date(),
        },
      });
    });

    // Emit WebSocket event to notify students
    this.io.emit('class_started', { classroomId, sessionId: session.id });

    return { message: 'Class started successfully', sessionId: session.id };
  }

  async endClass(classroomId: string, teacherId: string) {
    const session = await this.prisma.session.findFirst({
      where: { classroomId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      this.handleError(
        classroomId,
        new NotFoundException(
          'No active session found for the provided sessionId or classroomId',
        ),
      );
      throw new NotFoundException('No active session found');
    }
    await this.prisma.$transaction(async (prisma) => {
      await prisma.session.update({
        where: { id: session.id },
        data: { endedAt: new Date() },
      });
      await prisma.classroom.update({
        where: { id: classroomId },
        data: { isLive: false },
      });
      await prisma.participantLog.updateMany({
        where: {
          sessionId: session.id,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });
    });
    this.io.emit('class_ended', { classroomId, sessionId: session.id });
    return { message: 'Class ended successfully', sessionId: session.id };
  }

  async getClassroomHistory(classroomId: string) {
    return this.prisma.session.findMany({
      where: { classroomId },
      include: {
        logs: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
