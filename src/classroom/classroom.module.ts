import { Module } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ClassroomService, PrismaService],
})
export class ClassroomModule {}
