import { Request } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface User {
  userId: string;
  email: string;
  role: Role;
  name: string;
}
export interface CustomeRequest extends Request {
  user: User;
}
