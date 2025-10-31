# API Gateway Architecture Diagram

## System Architecture

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

### Frontend Request

```
User → https://domain.com/
     ↓
API Gateway (Nginx)
     ↓ proxy_pass
Frontend Container (port 80)
     ↓
HTML/CSS/JS Response
```

### NestJS API Request

```
User → https://domain.com/api/nestjs/graphql
     ↓
API Gateway (Nginx)
     ↓ rewrite: /api/nestjs/graphql → /graphql
     ↓ proxy_pass
NestJS Container (port 4000)
     ↓ /graphql
GraphQL Resolver
     ↓
Neo4j / ClickHouse / Redis / PostgreSQL
     ↓
JSON Response
```

### GSEA API Request

```
User → https://domain.com/api/gsea/
     ↓
API Gateway (Nginx)
     ↓ rewrite: /api/gsea/ → /
     ↓ proxy_pass
GSEA Container (port 5000)
     ↓ /analyze
Python API Handler
     ↓
JSON Response
```

## URL Mapping

### Production URLs

| Service    | External URL                      | Internal URL       | Container:Port |
| ---------- | --------------------------------- | ------------------ | -------------- |
| Frontend   | `https://domain.com/`             | `http://frontend/` | frontend:80    |
| NestJS API | `https://domain.com/api/nestjs/*` | `http://nestjs/*`  | nestjs:4000    |
| GSEA API   | `https://domain.com/api/gsea/*`   | `http://gsea/*`    | gsea:5000      |
| Health     | `https://domain.com/health`       | -                  | -              |

### Development URLs (with dev compose)

| Service    | Via Gateway                    | Direct Access           |
| ---------- | ------------------------------ | ----------------------- |
| Frontend   | `http://localhost:8080/`            | `http://localhost:3000` |
| NestJS API | `http://localhost:8080/api/nestjs/` | `http://localhost:4000` |
| GSEA API   | `http://localhost:8080/api/gsea/`   | `http://localhost:5000` |

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Firewall (Host Level)                                 │
│  • Only port 80/443 open to public                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Layer 2: API Gateway (Nginx)                                   │
│  • SSL/TLS Termination                                          │
│  • Rate Limiting                                                │
│  • Request Size Limits                                          │
│  • Header Filtering                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Layer 3: Docker Network Isolation                              │
│  • Services not directly accessible from host (production)      │
│  • Service-to-service communication only                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Layer 4: Application Level Security                            │
│  • Authentication/Authorization (in NestJS/Frontend)            │
│  • Input Validation                                             │
│  • Database Authentication                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Modes

### Production Mode

```bash
docker compose up -d --build
```

- Only API Gateway (port 80) exposed
- All services isolated on internal network
- Optimized for security and production use

### Development Mode

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

- API Gateway (port 80) exposed
- Individual service ports also exposed (3000, 4000, 5000)
- Database ports exposed for debugging (7687, 8123, 6379, 5432)
- Allows direct access to services bypassing gateway
- Hot reload enabled for faster development

## Benefits of This Architecture

1. **Single Entry Point**

   - One domain/IP for all services
   - Simplified SSL certificate management
   - Consistent CORS handling

2. **Security**

   - Internal services not directly exposed
   - Centralized access control point
   - Easier to implement rate limiting

3. **Scalability**

   - Easy to add multiple instances of services
   - Load balancing can be added at gateway level
   - Services can be updated independently

4. **Flexibility**

   - Easy to add new services
   - Can switch backend implementations
   - Frontend doesn't need to know about multiple domains

5. **Development Experience**
   - Production-like environment locally
   - Option for direct access in development
   - Consistent URLs across environments
