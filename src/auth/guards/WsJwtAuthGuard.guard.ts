import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt'; // Make sure you have JwtService installed
import { Socket } from 'socket.io';
import { User } from 'src/interfaces/CustomeRequest';
import { ConfigService } from '@nestjs/config';

export interface CustomSocket extends Socket {
  user: User;
}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const client: CustomSocket = context.switchToWs().getClient();
    const token = client.handshake.headers['authorization'];

    if (!token) {
      client.emit('error', { message: 'Authorization token is missing' });
      client.disconnect();
      return false;
    }

    const jwtToken = token.split(' ')[1];
    try {
      const user = this.jwtService.verify(jwtToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.user = user;
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
      return false;
    }
  }
}
