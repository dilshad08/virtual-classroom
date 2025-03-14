// src/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CustomSocket } from './WsJwtAuthGuard.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRole: Role) {}

  canActivate(context: ExecutionContext): boolean {
    const client: CustomSocket = context.switchToWs().getClient();
    const request = context.switchToHttp().getRequest();
    if (
      request.user.role !== this.allowedRole ||
      (client.user.role ?? client.user.role !== this.allowedRole)
    ) {
      client.emit('error', { message: 'You do not have permission' });
      client.disconnect();
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }
}
