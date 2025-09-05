import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ClickhouseMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ClickhouseMigrationService.name);

  constructor(private readonly clickhouseService: ClickhouseService) {}

  async onApplicationBootstrap() {
    await this.runMigrations();
  }

  private async runMigrations() {
    const migrationDir = join(process.cwd(), 'src', 'clickhouse', 'migrations');
    this.logger.log(`Looking for migrations in: ${migrationDir}`);
    let files: string[];
    try {
      files = (await fs.readdir(migrationDir))
        .filter((f) => f.endsWith('.sql'))
        .sort();
    } catch (e) {
      this.logger.warn(`Migration directory not found: ${migrationDir}`);
      return;
    }

    await this.clickhouseService['client'].exec({
      query: `
        CREATE TABLE IF NOT EXISTS migrations (
          version String,
          applied_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY version
      `,
    });

    const appliedVersions = await this.getAppliedMigrations();

    for (const file of files) {
      const version = file.split('_')[0];
      if (!appliedVersions.includes(version)) {
        const sql = await fs.readFile(join(migrationDir, file), 'utf8');
        this.logger.log(`Running migration ${file}...`);
        this.logger.debug(`Migration SQL for ${file}:\n${sql}`);
        try {
          await this.clickhouseService['client'].exec({
            query: sql,
          });
          await this.markMigrationAsApplied(version);
          this.logger.log(`Migration ${file} applied.`);
        } catch (err) {
          this.logger.error(`Migration ${file} failed: ${err?.message || err}`);
        }
      }
    }
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.clickhouseService['client'].query({
      query: `SELECT version FROM migrations`,
      format: 'JSON',
    });
    const rows = await result.json<{ data: Array<Record<string, any>> }>();
    return rows.data.map((row) => row['version']);
  }

  private async markMigrationAsApplied(version: string) {
    await this.clickhouseService['client'].exec({
      query: `INSERT INTO migrations (version) VALUES ('${version}')`,
    });
  }
}
