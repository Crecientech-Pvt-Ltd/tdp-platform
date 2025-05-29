import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseClient, createClient } from '@clickhouse/client';

interface GeneRow {
  gene_id: string;
}

@Injectable()
export class ClickhouseService {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor() {
    this.client = createClient({
      host: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    });
  }

  async getTopGenesByDisease(
    diseaseId: string,
    limit: number,
  ): Promise<string[]> {
    const query = `
      SELECT gene_id
      FROM overall_association_score
      WHERE disease_id = {diseaseId:String}
      ORDER BY score DESC
      LIMIT {limit:UInt32}
    `;
    try {
      const resultSet = await this.client.query({
        query,
        query_params: { diseaseId, limit },
        format: 'JSONEachRow',
      });

      const geneIds: string[] = [];

      for await (const rows of resultSet.stream<GeneRow>()) {
        for (const row of rows) {
          geneIds.push(row.json().gene_id);
        }
      }

      return geneIds;
    } catch (error) {
      this.logger.error('query failed', error);
      throw error;
    }
  }
}
