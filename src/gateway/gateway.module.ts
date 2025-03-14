import { Module } from '@nestjs/common';
import { ClassroomGateway } from './classroom.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { ClassroomModule } from 'src/classroom/classroom.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [ClassroomModule],
  providers: [ClassroomGateway, PrismaService, JwtService],
})
export class GatewayModule {}
