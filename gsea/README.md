# GSEA Service

The GSEA (Gene Set Enrichment Analysis) service is a Python-based API for performing gene set enrichment analysis.

## API Gateway Access

The GSEA service is now accessed through the API Gateway at the `/api/gsea` namespace:

- **Production**: `https://domain.com/api/gsea/`
- **Local**: `http://localhost:8080/api/gsea/`
- **Development (direct)**: `http://localhost:5000/`

## Starting the Container

> Attention ℹ️: This command needs to be executed in the root directory of the project where the `docker-compose.yml` file is located.

```bash
# Start all services (including GSEA and API Gateway)
docker compose up -d --build

# Or start only GSEA service (API Gateway must be running)
docker compose up -d --build gsea
```

## Accessing the API

### Via API Gateway (Production -> 5000 | Development -> 8080)

```bash
# Example request through API Gateway
curl http://localhost/:5000/api/gsea/
```

### Direct Access (Development Only)

For development, you can access the service directly:

```bash
# Start with development configuration to expose port 5000
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Access directly
curl http://localhost:5000/
```