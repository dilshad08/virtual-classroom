import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { CustomSocket } from './WsJwtAuthGuard.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles) return true; // If no roles are set, allow access

    if (context.getType() === 'http') {
      return this.handleHttpRequest(context, allowedRoles);
    } else if (context.getType() === 'ws') {
      return this.handleWebSocketRequest(context, allowedRoles);
    }
    return false;
  }

  private handleHttpRequest(
    context: ExecutionContext,
    allowedRoles: Role[],
  ): boolean {
    const request = context.switchToHttp().getRequest();
    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }

  private handleWebSocketRequest(
    context: ExecutionContext,
    allowedRoles: Role[],
  ): boolean {
    const client: CustomSocket = context.switchToWs().getClient();
    if (!allowedRoles.includes(client.user.role)) {
      client.emit('error', { message: 'You do not have permission' });
      client.disconnect();
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }
}
