# TDP Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           Client Browser                        │
│                    (User accessing the application)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Nginx)                        │
│                         Port 80/443                             │
│                    Container: api-gateway                       │
├─────────────────────────────────────────────────────────────────┤
│  Routing Rules:                                                 │
│  • /              → Frontend (port 80)                          │
│  • /api/nestjs/*  → NestJS Backend (port 4000)                  │
│  • /api/gsea/*    → GSEA Python API (port 5000)                 │
│  • /health        → Health Check                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Internal Docker Network
                             │ (pdnet-network)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │    NestJS    │    │     GSEA     │
│   (Next.js)  │    │   Backend    │    │  Python API  │
│   Port: 80   │    │  Port: 4000  │    │  Port: 5000  │
│              │    │              │    │              │
│  Container:  │    │  Container:  │    │  Container:  │
│   frontend   │    │    nestjs    │    │     gsea     │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
        ▼                  ▼                  ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Neo4j     │  │  ClickHouse  │  │    Redis     │  │  PostgreSQL  │
│  Graph DB    │  │  Analytics   │  │    Cache     │  │   Sessions   │
│ Port: 7687   │  │ Port: 8123   │  │ Port: 6379   │  │ Port: 5432   │
│              │  │              │  │              │  │              │
│  Container:  │  │  Container:  │  │  Container:  │  │  Container:  │
│    neo4j     │  │  clickhouse  │  │    redis     │  │   postgres   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Request Flow

### Graph Query
```
User → Frontend → NestJS GraphQL → Redis (check cache)
                                 ↓ (miss)
                                 Neo4j → Process → Cache → Return
```

### Gene Properties Query
```
User → Frontend → NestJS GraphQL → ClickHouse → DataLoader → Return
```

### GSEA Analysis
```
User → Frontend → GSEA API → gseapy → Return enrichment results
```

### Data Commons Access
```
User → Frontend → NestJS → PostgreSQL (validate session/combination) → Serve file
```

## Routing Configuration

Production (port 5000):
- `/` → Frontend (Next.js)
- `/api/nestjs/*` → Backend (NestJS)
- `/api/gsea/*` → GSEA Service
- `/health` → Health check

Development (port 8080):
- Same as production, plus direct port access:
  - `:3000` → Frontend
  - `:4000` → Backend
  - `:5000` → GSEA
  - `:7474` → Neo4j Browser

## Data Flow

### Ingestion Pipeline
```
CSV/TSV Files → Python CLI → Parse & Validate
                           ↓
                     ┌─────┴─────┐
                     ▼           ▼
                   Neo4j    ClickHouse
                   (Graph)  (Analytics)
                     │
                     ▼
            Refresh Materialized View
```

### Query Pipeline
```
User Input → GraphQL Resolver → Database Query → Transform → Cache → Response
```

## Component Interactions

| From | To | Purpose |
|------|----|----|
| Frontend | NestJS | GraphQL queries, mutations |
| Frontend | GSEA | REST API for enrichment analysis |
| NestJS | Neo4j | Graph queries (genes, diseases, interactions) |
| NestJS | ClickHouse | Gene properties, association scores |
| NestJS | PostgreSQL | Sessions, combinations, feedback |
| NestJS | Redis | Cache graph results |
| CLI Scripts | Neo4j | Data ingestion (genes, interactions) |
| CLI Scripts | ClickHouse | Data ingestion (properties, scores) |

## Database Schemas

### Neo4j (Graph)
**Nodes**: Gene, GeneAlias, Disease, Property  
**Relationships**: PPI, FUN_PPI, BIO_GRID, INT_ACT, ALIAS_OF, HAS_PROPERTY  
See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for details

### ClickHouse (Analytics)
**Tables**: gene_properties, differential_expression, genetics, datasource_association_score, overall_association_score, mv_datasource_association_score_overall_association_score (materialized view)  
See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for details

### PostgreSQL (Relational)
**Tables**: Session, Combination, Feedback

### Redis (Cache)
**Keys**: Cached graph queries with TTL

## Key Features

### Materialized View
- ClickHouse materialized view joins datasource and overall association scores
- Configured as `REFRESH EVERY 1 WEEK EMPTY` (manual refresh only)
- Refreshed automatically by CLI scripts after data insertion
- Manual refresh: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Data Commons
- JWT-based session authentication
- Validated group/program/project combinations stored in PostgreSQL
- File access controlled by session validation

### Caching Strategy
- Redis caches Neo4j graph queries
- TTL-based expiration
- Cache invalidation on data updates

## File Structure

```
tdp-platform/
├── frontend/           # Next.js application
│   ├── app/           # App router
│   ├── components/    # React components
│   └── lib/           # Utilities, GraphQL client
├── backend/           # NestJS application
│   ├── src/
│   │   ├── gql/       # GraphQL resolvers
│   │   ├── neo4j/     # Neo4j service
│   │   ├── clickhouse/# ClickHouse service
│   │   ├── redis/     # Redis service
│   │   ├── feedback/  # Feedback module
│   │   └── data-commons/ # File serving
│   └── prisma/        # PostgreSQL schema
├── gsea/              # GSEA Python service
├── scripts/           # Data ingestion CLI
│   ├── cli.py         # Main CLI tool
│   └── data/          # Data files
├── nginx/             # API Gateway config
└── docker-compose.yml # Container orchestration
```

## Development vs Production

### Production
- Single port (5000) exposed via API Gateway
- Services isolated on internal network
- Optimized builds

### Development
- All service ports exposed
- Hot reload enabled
- Database ports accessible for debugging
- Started with: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

---

**Related Documentation:**
- [Installation Guide](./INSTALLATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Data Ingestion](./DATA_INGESTION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Documentation](./backend/API.md)
