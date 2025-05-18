import { IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';

export class AddRoleDto {
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
