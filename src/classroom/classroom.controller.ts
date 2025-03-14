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
import { CustomeRequest } from 'src/interfaces/CustomeRequest';
import { CreateClassroomDto } from './dto/CreateClassRoom.dto';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @UseGuards(JwtAuthGuard, new RolesGuard('TEACHER'))
  @Post('create')
  async createClassroom(
    @Body() classDto: CreateClassroomDto,
    @Req() req: CustomeRequest,
  ) {
    const teacherId = req.user.userId;
    return this.classroomService.createClassroom(classDto, teacherId);
  }

  @Get(':classroomId/history')
  @UseGuards(JwtAuthGuard, new RolesGuard('ADMIN'))
  async getClassroomHistory(@Param('classroomId') classroomId: string) {
    return this.classroomService.getClassroomHistory(classroomId);
  }
}
