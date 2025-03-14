import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CustomeRequest } from '../interfaces/CustomeRequest';
import { CreateClassroomDto } from './dto/CreateClassRoom.dto';
import { Role } from '@prisma/client';
import { Roles } from '../decorators/role.decorator';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @Roles(Role.TEACHER)
  async createClassroom(
    @Body() classDto: CreateClassroomDto,
    @Req() req: CustomeRequest,
  ) {
    const teacherId = req.user.userId;
    return this.classroomService.createClassroom(classDto, teacherId);
  }

  @Get(':classroomId/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getClassroomHistory(@Param('classroomId') classroomId: string) {
    return this.classroomService.getClassroomHistory(classroomId);
  }
}
