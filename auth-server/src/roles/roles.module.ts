import { Module } from '@nestjs/common';
import { RolesService } from 'src/roles/roles.service';

@Module({
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
