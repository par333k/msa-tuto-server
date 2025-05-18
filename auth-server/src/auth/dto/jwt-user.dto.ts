import { Role } from 'src/roles/enums/role.enum'

export class JwtUserDto {
  userId: string;
  email: string;
  roles: Role[];
}
