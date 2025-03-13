import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassroomService {
  constructor(private prisma: PrismaService) {}

  async createClassroom(name: string) {
    return this.prisma.classroom.create({ data: { name } });
  }

  async getClassroomState(classroomId: string) {
    return this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: { logs: true },
        },
      },
    });
  }
}
