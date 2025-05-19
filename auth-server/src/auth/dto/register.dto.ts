import { IsDefined, IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsDefined()
  @IsString()
  @MinLength(2)
  name: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(4)
  password: string;
}
