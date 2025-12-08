# TDP Platform Installation Guide

## Prerequisites

- **Docker**: 20.10+ with Docker Compose v2.0+
- **RAM**: 16GB minimum
- **Storage**: 50GB free space

```bash
docker --version
docker compose version
```

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/Crecientech-Pvt-Ltd/tdp-platform.git
cd tdp-platform
```

### 2. Configure Environment
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with:
# - NEO4J_PASSWORD, CLICKHOUSE_PASSWORD, POSTGRES_PASSWORD, REDIS_PASSWORD
# - JWT_SECRET
```

### 3. Download Video Assets
```bash
# Download from: https://drive.google.com/drive/folders/1aVUMw0OFTuUI_H78pf2OkRefmbT6PNe6
mkdir -p frontend/public/video
# Place downloaded videos here
```

### 4. Prepare Data Commons (if needed)
```bash
# Create data-commons directory structure
mkdir -p backend/src/data-commons/data
# Place your group/program/project data files here
```

### 5. Start Services
```bash
docker compose up -d --build
# PostgreSQL tables are auto-initialized via Dockerfile CMD
```

> **⚠️ IMPORTANT:**  
> When you update any service managed by API Gateway (frontend, nestjs, gsea), you **must restart the api-gateway** container:
> ```bash
> docker compose restart api-gateway
> ```
> Or rebuild all services together:
> ```bash
> docker compose up -d --build
> ```

### 6. Initialize Databases

#### Neo4j (if loading existing data)
```bash
docker exec -it neo4j neo4j-admin database load --from-path=/var/lib/neo4j/import/data/backup pdnet
docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE pdnet; START DATABASE pdnet;"
docker restart neo4j
```

#### ClickHouse (if loading existing data)
```bash
# Place TSV or Native files in: scripts/data/backup/clickhouse/

# For TSV files:
docker exec clickhouse bash -c 'for f in /backup/clickhouse/*.tsv; do table=$(basename $f .tsv); clickhouse-client --query="INSERT INTO $table FORMAT TabSeparatedWithNames" < "$f"; done'

# For Native files:
docker exec clickhouse bash -c 'for f in /backup/clickhouse/*.native; do table=$(basename $f .native); clickhouse-client --query="INSERT INTO $table FORMAT Native" < "$f"; done'

# Refresh materialized view
docker exec clickhouse clickhouse-client --multiquery --query="
SYSTEM START VIEW mv_datasource_association_score_overall_association_score;
SYSTEM REFRESH VIEW mv_datasource_association_score_overall_association_score;
SYSTEM WAIT VIEW mv_datasource_association_score_overall_association_score;
SYSTEM STOP VIEW mv_datasource_association_score_overall_association_score;"
```

## Verification

```bash
# Check services
docker compose ps

# Test endpoints
curl http://localhost:5000              # Frontend (production)
curl http://localhost:5000/api/nestjs/health       # Backend
curl http://localhost:5000/api/gsea/health       # GSEA

# Verify databases
docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD -d pdnet "MATCH (n:Gene) RETURN count(n) LIMIT 1"
docker exec -it clickhouse clickhouse-client --query="SELECT 1"
docker exec -it postgres psql -U postgres -d tdp -c "SELECT 1"
docker exec -it redis redis-cli ping
```

## Development Mode

```bash
# Start with all ports exposed
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Access:
# - Frontend: http://localhost:3000 or http://localhost:8080
# - Backend: http://localhost:4000 or http://localhost:8080/api/nestjs
# - GSEA: http://localhost:5000 or http://localhost:8080/api/gsea
# - Neo4j Browser: http://localhost:7474
```

## Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common problems.

---

**Related Documentation:**
- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Data Ingestion](./DATA_INGESTION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
