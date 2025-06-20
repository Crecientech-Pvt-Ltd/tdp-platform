import { Module } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';
import { ClickhouseController } from './clickhouse.controller';
import { ClickhouseMigrationService } from './clickhouse-migration.service';

@Module({
  providers: [ClickhouseMigrationService, ClickhouseService],
  exports: [ClickhouseService],
  controllers: [ClickhouseController],
})
export class ClickhouseModule {}
