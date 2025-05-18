import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardService } from 'src/modules/reward/reward.service';
import { RewardController } from 'src/modules/reward/reward.controller';
import { Reward, RewardSchema } from 'src/modules/reward/schemas/reward.schema';
import { EventModule } from 'src/modules/event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
    ]),
    EventModule,
  ],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
