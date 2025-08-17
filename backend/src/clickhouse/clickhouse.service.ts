import {
  OrderByEnum,
  Pagination,
  ScoredKeyValue,
  TargetDiseaseAssociationRow,
  TargetDiseaseAssociationTable,
  TopGene,
} from '@/gql/models';
import { ClickHouseClient, createClient } from '@clickhouse/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClickhouseService {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>(
        'CLICKHOUSE_URL',
        'http://localhost:8123',
      ),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
    });
  }

  async getTopGenesByDisease(
    diseaseId: string,
    limit: number,
  ): Promise<TopGene[]> {
    const query = `
      SELECT gene_name
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

      const genes: TopGene[] = [];

      for await (const rows of resultSet.stream<TopGene>()) {
        for (const row of rows) {
          genes.push(row.json());
        }
      }

      return genes;
    } catch (error) {
      this.logger.error('query failed', error);
      throw error;
    }
  }

  async getTargetDiseaseAssociationTable(
    geneIds: string[],
    diseaseId: string,
    orderBy: OrderByEnum,
    { page, limit }: Pagination,
  ): Promise<TargetDiseaseAssociationTable> {
    const offset = (page - 1) * limit;

    // Determine if we should order by overall score or by a specific datasource
    const orderByScore = orderBy === OrderByEnum.SCORE;

    let query: string;

    if (orderByScore) {
      // Order by overall_score
      query = `
        SELECT
          gene_id,
          gene_name,
          disease_id,
          groupArray(concat(datasource_id, ',', toString(datasource_score))) AS datasourceScores,
          overall_score,
          count() OVER () AS total_count
        FROM mv_datasource_association_score_overall_association_score
        WHERE disease_id = {diseaseId:String}
          AND gene_id IN ({geneIds:Array(String)})
        GROUP BY
          disease_id, gene_id, overall_score, gene_name
        ORDER BY
          overall_score DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `;
    } else {
      // Order by specific datasource score
      query = `
        SELECT
          gene_id,
          gene_name,
          disease_id,
          maxIf(datasource_score, datasource_id = {orderBy:String}) AS datasource_order_score,
          groupArray(concat(datasource_id, ',', toString(datasource_score))) AS datasourceScores,
          overall_score,
          count() OVER () AS total_count
        FROM mv_datasource_association_score_overall_association_score
        WHERE disease_id = {diseaseId:String}
          AND gene_id IN ({geneIds:Array(String)})
        GROUP BY
          disease_id, gene_id, overall_score, gene_name
        ORDER BY
          datasource_order_score DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `;
    }

    try {
      const resultSet = await this.client.query({
        query,
        query_params: {
          diseaseId,
          geneIds,
          orderBy: orderByScore ? '' : orderBy,
          limit,
          offset,
        },
        format: 'JSONEachRow',
      });

      const results: TargetDiseaseAssociationRow[] = [];
      let totalCount = 0;

      for await (const rows of resultSet.stream<{
        gene_id: string;
        gene_name: string;
        disease_id: string;
        datasourceScores: string[];
        overall_score: number;
        total_count: number;
      }>()) {
        for (const row of rows) {
          const data = row.json();

          // Get total count from the first row
          if (totalCount === 0) {
            totalCount = data.total_count;
          }

          // Transform datasourceScores from string array to object array
          const datasourceScores = data.datasourceScores.map(
            (scoreStr: string) => {
              const [key, score] = scoreStr.split(',');
              return {
                key,
                score: Number.parseFloat(score),
              };
            },
          );

          results.push({
            target: {
              id: data.gene_id,
              name: data.gene_name,
            },
            datasourceScores,
            overall_score: data.overall_score,
          });
        }
      }

      return {
        rows: results,
        totalCount,
      };
    } catch (error) {
      this.logger.error('targetDiseaseAssociationTable query failed', error);
      throw error;
    }
  }

  async getBatchPrioritizationTable(
    geneIds: string[],
  ): Promise<Map<string, ScoredKeyValue[]>> {
    const query = `
      SELECT
        gene_id,
        \`Membrane protein\`,
        \`Secreted protein\`,
        \`Known safety events\`,
        \`Predicted pockets\`,
        \`Ligand binder\`,
        \`Small molecule binder\`,
        \`Genetic constraint\`,
        \`Paralogues\`,
        \`Mouse ortholog identity\`,
        \`Cancer driver gene\`,
        \`Gene essentiality\`,
        \`Mouse models\`,
        \`Chemical probes\`,
        \`Target in clinic\`,
        \`Tissue specificity\`,
        \`Tissue distribution\`
      FROM target_prioritization_factors
      WHERE gene_id IN ({geneIds:Array(String)})
    `;

    try {
      const resultSet = await this.client.query({
        query,
        query_params: { geneIds },
        format: 'JSONEachRow',
      });

      const resultMap = new Map<string, ScoredKeyValue[]>();

      for await (const rows of resultSet.stream<Record<string, any>>()) {
        for (const row of rows) {
          const data = row.json();
          const geneId = data.gene_id;

          // Remove gene_id from the data and convert to ScoredKeyValue array
          delete data.gene_id;

          const scoredKeyValues = Object.entries(data).map(([key, score]) => ({
            key,
            score: score as number,
          }));

          resultMap.set(geneId, scoredKeyValues);
        }
      }
      return resultMap;
    } catch (error) {
      this.logger.error('batch prioritizationTable query failed', error);
      throw error;
    }
  }
}
