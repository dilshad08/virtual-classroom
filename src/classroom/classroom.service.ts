import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';
import { Role, User } from '@prisma/client';
import { CreateClassroomDto } from './dto/CreateClassRoom.dto';

@Injectable()
export class ClassroomService {
  private io: Server;

  constructor(private prisma: PrismaService) {}

  setSocketServer(io: Server) {
    this.io = io;
  }

  private handleError(classroomId: string, error: Error) {
    this.io.to(classroomId).emit('error', { message: error.message });
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

  async joinClassroom(classroomId: string, userId: string) {
    const user: User | null = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      this.handleError(classroomId, new NotFoundException('User not found'));
      throw new NotFoundException('User not found');
    }
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { users: true },
    });
    if (!classroom) {
      this.handleError(
        classroomId,
        new NotFoundException('Classroom not found'),
      );
      throw new NotFoundException('Classroom not found');
    }

    const existingUser = await this.prisma.classroomUser.findFirst({
      where: { classroomId, userId },
    });

    if (existingUser) {
      this.handleError(
        classroomId,
        new NotFoundException('User already in classroom'),
      );
      throw new ForbiddenException('User already in classroom');
    }

    if (user.role === 'STUDENT' && !classroom.isLive) {
      throw new ForbiddenException('Class has not started');
    }

    await this.prisma.classroomUser.create({
      data: { classroomId, userId, role: user.role as Role },
    });

    const session = await this.prisma.session.findFirst({
      where: { classroomId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (session) {
      await this.prisma.participantLog.create({
        data: {
          sessionId: session.id,
          userId,
          role: user.role as Role,
          joinedAt: new Date(),
        },
      });
    }

    this.io.to(classroomId).emit('user_joined', { userId, role: user.role });

    return { message: `${user.role} joined the classroom` };
  }

  async leaveClassroom(classroomId: string, userId: string) {
    const classroomUser = await this.prisma.classroomUser.findFirst({
      where: { classroomId, userId },
    });

    if (!classroomUser) {
      this.handleError(
        classroomId,
        new NotFoundException('User not in classroom'),
      );
      throw new NotFoundException('User not in classroom');
    }

    await this.prisma.classroomUser.delete({ where: { id: classroomUser.id } });

    const session = await this.prisma.session.findFirst({
      where: { classroomId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (session) {
      await this.prisma.participantLog.updateMany({
        where: { sessionId: session.id, userId, leftAt: null },
        data: { leftAt: new Date() },
      });
    }

    this.io.to(classroomId).emit('user_left', { userId });

    return { message: 'User left the classroom' };
  }

  async startClass(classroomId: string, teacherId: string) {
    const teacher = await this.prisma.classroomUser.findFirst({
      where: { classroomId, userId: teacherId, role: 'TEACHER' },
    });

    if (!teacher) {
      this.handleError(
        classroomId,
        new NotFoundException('Only a teacher can start the class'),
      );

      throw new ForbiddenException('Only a teacher can start the class');
    }

    const session = await this.prisma.session.create({
      data: { classroomId, startedAt: new Date() },
    });

    await this.prisma.classroom.update({
      where: { id: classroomId },
      data: { isLive: true },
    });

    this.io.to(classroomId).emit('class_started', { classroomId });

    return { message: 'Class started', sessionId: session.id };
  }

  async endClass(classroomId: string) {
    const session = await this.prisma.session.findFirst({
      where: { classroomId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      this.handleError(
        classroomId,
        new NotFoundException('No active session found'),
      );
      throw new NotFoundException('No active session found');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
    });

    await this.prisma.classroom.update({
      where: { id: classroomId },
      data: { isLive: false },
    });

    this.io.to(classroomId).emit('class_ended', { classroomId });

    return { message: 'Class ended', sessionId: session.id };
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
