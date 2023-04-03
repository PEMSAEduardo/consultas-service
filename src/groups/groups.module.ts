import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { CommonModule } from 'src/common/common.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [CommonModule, AccountsModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService]
})
export class GroupsModule {}
