import { Request } from '@nestjs/common';

interface User {
  userId: string;
  email: string;
  role: string;
}
export interface CustomeRequest extends Request {
  user: User;
}
