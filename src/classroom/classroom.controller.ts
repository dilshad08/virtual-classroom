import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CustomeRequest } from 'src/interfaces/CustomeRequest';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post(':classroomId/start')
  @UseGuards(JwtAuthGuard, new RolesGuard('TEACHER'))
  async startClass(
    @Param('classroomId') classroomId: string,
    @Req() req: CustomeRequest,
  ) {
    return this.classroomService.startClass(classroomId, req.user.userId);
  }

  @Post(':classroomId/end')
  @UseGuards(JwtAuthGuard, new RolesGuard('TEACHER'))
  async endClass(@Param('classroomId') classroomId: string) {
    return this.classroomService.endClass(classroomId);
  }

  @Post(':classroomId/join')
  @UseGuards(JwtAuthGuard)
  async joinClassroom(
    @Param('classroomId') classroomId: string,
    @Req() req: CustomeRequest,
  ) {
    return this.classroomService.joinClassroom(classroomId, req.user.userId);
  }

  @Post(':classroomId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveClassroom(
    @Param('classroomId') classroomId: string,
    @Req() req: CustomeRequest,
  ) {
    return this.classroomService.leaveClassroom(classroomId, req.user.userId);
  }

  @Get(':classroomId/history')
  @UseGuards(JwtAuthGuard, new RolesGuard('TEACHER'))
  async getClassroomHistory(@Param('classroomId') classroomId: string) {
    return this.classroomService.getClassroomHistory(classroomId);
  }
}
