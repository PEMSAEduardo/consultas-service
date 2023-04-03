import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { CommonModule } from 'src/common/common.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  imports: [CommonModule, AccountsModule, GroupsModule],
  controllers: [EventsController],
  providers: [EventsService]
})
export class EventsModule {}
