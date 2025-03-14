import { Module } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomController } from './classroom.controller';

@Module({
  providers: [ClassroomService, PrismaService],
  controllers: [ClassroomController],
  exports: [ClassroomService],
})
export class ClassroomModule {}
