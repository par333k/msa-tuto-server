import { IsEmail, IsString, MinLength, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/roles/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}
