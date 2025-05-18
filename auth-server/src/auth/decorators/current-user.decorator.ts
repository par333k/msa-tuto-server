import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUserDto } from '../dto/jwt-user.dto';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
