# TDP Platform Troubleshooting Guide

## Quick Diagnostics

```bash
# Check all containers
docker compose ps

# View logs
docker compose logs --tail=50 [service-name]

# Check resource usage
docker stats --no-stream
```

## Container Issues

### Container Won't Start

```bash
# View error logs
docker compose logs [service-name]

# Check port conflicts
netstat -ano | findstr :7687   # Neo4j
netstat -ano | findstr :8123   # ClickHouse
netstat -ano | findstr :5432   # PostgreSQL

# Restart specific service
docker compose restart [service-name]
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker compose logs --tail=200 [service-name]

# Verify environment variables
docker exec -it [service-name] env

# Restart all services
docker compose down
docker compose up -d
```

## Database Connection Issues

### Neo4j Connection Failed

```bash
# Check Neo4j status
docker compose logs neo4j --tail=100

# Wait for startup (can take 30-60 seconds)
docker compose logs -f neo4j

# Test connection
docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 1"

# Verify database exists
docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "SHOW DATABASES"
```

### ClickHouse Connection Failed

```bash
# Check status
docker compose logs clickhouse --tail=100

# Test connection
docker exec -it clickhouse clickhouse-client --query="SELECT 1"

# Restart service
docker compose restart clickhouse
```

### PostgreSQL Connection Failed

```bash
# Check status
docker compose logs postgres --tail=100

# Verify database exists
docker exec -it postgres psql -U postgres -l

# Test connection
docker exec -it postgres psql -U postgres -d tdp -c "SELECT 1"
```

### Redis Connection Failed

```bash
REDIS_PASSWORD=your_redis_password # <-- set your Redis password here
# Test connection
docker exec -it redis redis-cli -a $REDIS_PASSWORD ping

# Restart Redis
docker compose restart redis

# Drop read replicas
docker exec -it redis redis-cli -a $REDIS_PASSWORD REPLICAOF NO ONE
```

## Materialized View Not Refreshing

**Symptom:** New data inserted but materialized view shows old data

**Solution - Force Manual Refresh:**

```bash
docker exec -it clickhouse clickhouse-client --multiquery --query="
SYSTEM START VIEW mv_datasource_association_score_overall_association_score;
SYSTEM REFRESH VIEW mv_datasource_association_score_overall_association_score;
SYSTEM WAIT VIEW mv_datasource_association_score_overall_association_score;
SYSTEM STOP VIEW mv_datasource_association_score_overall_association_score;"
```

**Verify Refresh:**
```bash
docker exec -it clickhouse clickhouse-client --query="
SELECT name, last_refresh_time, last_refresh_result 
FROM system.view_refreshes 
WHERE view = 'mv_datasource_association_score_overall_association_score' 
ORDER BY last_refresh_time DESC LIMIT 1"
```

## Data Ingestion Issues

### CLI Script Fails

```bash
# Check Python dependencies
pip list | grep -E "clickhouse|neo4j|pandas"

# Install dependencies
cd scripts
pip install -r requirements.txt

# Test database connections
python -c "from clickhouse_connect import get_client; client = get_client(host='localhost', port=8123); print(client.command('SELECT 1'))"
python -c "from neo4j import GraphDatabase; driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password')); print('OK')"
```

## Network Issues

### Cannot Access Frontend

```bash
# Check frontend status
docker compose ps frontend

# Check logs
docker compose logs frontend --tail=50

# Rebuild
docker compose down frontend
docker compose build --no-cache frontend
docker compose up -d frontend

# IMPORTANT: Restart API Gateway after updating frontend/nestjs/gsea
docker compose restart api-gateway
```

> **⚠️ NOTE:**  
> When you update any service (frontend, nestjs, gsea), always restart the api-gateway container as it routes traffic to these services.

### Services Cannot Communicate

```bash
# Check Docker network
docker network inspect pdnet-network

# Verify all containers are on network
docker ps --format "table {{.Names}}\t{{.Networks}}"

# Recreate network
docker compose down
docker compose up -d
```

## Performance Issues

### Slow Queries

```bash
# Check ClickHouse slow queries
docker exec -it clickhouse clickhouse-client --query="
SELECT query, query_duration_ms, read_rows
FROM system.query_log
WHERE query_duration_ms > 1000
ORDER BY query_duration_ms DESC LIMIT 10"

# Clear Redis cache
docker exec -it redis redis-cli FLUSHALL
```

### High Memory Usage

```bash
# Check container memory
docker stats --no-stream

# Restart services to clear memory
docker compose restart
```

## File Permissions Issues

### Frontend Container Permission Error

**Symptom:** Unable to view pages on website (common on company servers)

```bash
docker exec -it frontend chmod -R 755 /usr/share/nginx/html
```

### Scripts Folder Access Denied

**Symptom:** Cannot access scripts folder from Docker container

```bash
sudo chmod -R 755 scripts
```

## Video Playback Issues

**Symptom:** Videos not loading on frontend

**Solution:** Ensure videos are downloaded and placed correctly:

```bash
# Download from: https://drive.google.com/drive/folders/1aVUMw0OFTuUI_H78pf2OkRefmbT6PNe6
mkdir -p frontend/public/video
# Place all downloaded videos in this directory
```

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `ECONNREFUSED` | Service not running | Check service status, restart |
| `ServiceUnavailable` | Neo4j not ready | Wait 30-60 seconds for startup |
| `Port already in use` | Port conflict | Stop conflicting process or change port |
| `Permission denied` | File permissions issue | Run `chmod` commands above |
| `Table does not exist` | Missing data/migrations | Run data ingestion scripts |

## Get Help

If above troubleshooting doesn't match with your case, collect some logs traces and screenshot of the errors and send it to the maintenance team for analysis and quick-fix. 

```bash
# Collect diagnostic info
docker compose ps -a
docker compose logs --tail=200 > logs.txt
docker stats --no-stream
```

**Related Documentation:**
- [Installation Guide](./INSTALLATION.md)
- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Data Ingestion](./DATA_INGESTION.md)
