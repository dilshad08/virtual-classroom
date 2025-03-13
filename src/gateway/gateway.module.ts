import { Module } from '@nestjs/common';
import { ClassroomGateway } from './classroom.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  providers: [ClassroomGateway, PrismaService],
})
export class GatewayModule {}
