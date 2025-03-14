import { Request } from '@nestjs/common';

export interface User {
  userId: string;
  email: string;
  role: string;
}
export interface CustomeRequest extends Request {
  user: User;
}
