import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { DbService } from './db/db.service';

@Module({
  imports: [],
  providers: [CommonService, DbService],
  exports: [DbService]
})
export class CommonModule {}
