import { Body, Controller, Delete, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/roles/enums/role.enum';
import { AddRoleDto } from 'src/users/dto/add-role.dto';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR)
  async findAll() {
    this.logger.log('모든 사용자 조회 요청');
    return this.usersService.findAll();
  }

  //update, 관리자가 만드는 유저 API 등은 구현하지 않음
  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async addRole(@Param('id') id: string, @Body() addRoleDto: AddRoleDto) {
    this.logger.log(
      `사용자 역할 추가 요청 - ID: ${id}, 역할: ${addRoleDto.role}`,
    );
    return this.usersService.addRole(id, addRoleDto.role);
  }

  @Delete(':id/roles/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeRole(@Param('id') id: string, @Param('role') role: Role) {
    this.logger.log(`사용자 역할 제거 요청 - ID: ${id}, 역할: ${role}`);
    return this.usersService.removeRole(id, role);
  }
}
