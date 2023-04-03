import { CacheModule, Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AccountsModule } from './accounts/accounts.module';
import { GroupsModule } from './groups/groups.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 1000,
      isGlobal: true
    }),
    CommonModule, AccountsModule, GroupsModule, EventsModule
  ],
})
export class AppModule {}
