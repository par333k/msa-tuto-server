import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { AuthToken } from 'src/auth/decorators/auth-token.decorator'
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'
import { JwtUserDto } from 'src/auth/dto/jwt-user.dto'
import { LoginDto } from 'src/auth/dto/login.dto';
import { RefreshTokenDto } from 'src/auth/dto/refresh-token.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`회원가입 요청 - 이메일: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`로그인 요청 - 이메일: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @CurrentUser() user: JwtUserDto ){

    this.logger.log(`토큰 갱신 요청 - 사용자 ID: ${user.userId}`);
    return this.authService.refreshToken(user.userId, refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtUserDto,
    @AuthToken() token: string
  ) {
    this.logger.log(`로그아웃 요청 - 사용자 ID: ${user.userId}`);
    return this.authService.logout(user.userId, token);
  }
}
