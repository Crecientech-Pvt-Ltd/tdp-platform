<!--
This is a markdown file used for documenting things. If you viewing this on a code editor please render this page before reading.
If you are using VS Code, press Ctrl + Shift + V on windows. Cmd + Shift + V for Mac.
For other IDEs, refer to their mannual for enabling markdown rendering feature.
-->

# TDP Project

## Table of Contents

- [Description](#description)
- [Architecture](./ARCHITECTURE.md)
- [Installation](#installation)
- [Importing/Exporting Neo4j Data Dump](#importingexporting-neo4j-data-dump)
- [ClickHouse Data Export/Import](#clickhouse-data-exportimport)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

## Description

This project is for gene analysis purpose. Frontend contains a web interface for graph traversal  
and analysing the gene data. Backend contains the graph traversal algorithm and the gene data.

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Crecientech-Pvt-Ltd/tdp-platform.git && cd tdp-platform
   ```

2. Fill environment variables in `.env`, `frontend/.env` `backend/.env` using the `.env.example` files in their respective directory.

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   > ⚠️ **IMPORTANT: Hostname Configuration**
   > - **For Development Environment:** Set database hostnames to `localhost` in your `.env` files
   > - **For Production Environment:** Set database hostnames to their respective container names (e.g., `postgres`, `neo4j`, `clickhouse`)
   > 
   > Example:
   > ```bash
   > # Development
   > DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   > 
   > # Production
   > DATABASE_URL="postgresql://user:password@postgres:5432/dbname"
   > ```

3. **[FOR DEVELOPMENT ONLY]** Install all dependencies in frontend and backend repository. Also, install the dependencies in the root directory to setup git hooks and lint-staging along with commitlinting.

   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

##### Video Upload

4. Download the video files from the following link and place them inside the [`frontend/public/video`](./frontend/public/video/) folder.

   > [!NOTE]
   > This is not the most conventional & intuitive place to keep the videos, but this was hard-coded in the frontend code, so directed to keep the videos in this folder. This will soon be changed and once done will be updated in the manual. Also, this workflow will be gradually improved to avoid these steps, but currently the video size exceeds 100MB limit of commit size, so this is the workaround.

   [Video Files](https://drive.google.com/drive/folders/1aVUMw0OFTuUI_H78pf2OkRefmbT6PNe6)

5. Docker compose up the database and seed the data.

   > ⚠️ **IMPORTANT: Port Conflicts**
   > 
   > Before starting database services, ensure that their default ports are not already in use on your host machine. If a port is already occupied by another service (e.g., PostgreSQL running on port 5432), you must either:
   > 1. Stop the existing service on your host, OR
   > 2. Change the port mapping in `docker-compose.yml` before starting the containers
   > 
   > **For PostgreSQL (default port 5432):**
   > - If port 5432 is already in use and you start the PostgreSQL container without addressing this, the database will not initialize properly
   > - In this case, you must:
   >   1. Stop and remove the PostgreSQL container: `docker compose down postgres`
   >   2. Remove the volume: `docker volume rm tdp-platform_postgres-data`
   >   3. Change the port in `docker-compose.yml`: 
   >      ```yaml
   >      postgres:
   >        ports:
   >          - "5433:5432"  # Use a different host port
   >      ```
   >   4. Update your `DATABASE_URL` in `.env` files to use the new port
   >   5. Restart the container: `docker compose up -d postgres`
   > 
   > This applies to other database services as well (Neo4j, ClickHouse, Redis, etc.).

   > ⚠️ **IMPORTANT: Volume Initialization**
   > 
   > If a Docker volume already exists for a database service (PostgreSQL, Neo4j, ClickHouse, etc.) from a previous installation, the database may not initialize properly when you start the container.
   > 
   > **Solutions:**
   > 1. **Remove existing volumes before initializing:**
   >    ```bash
   >    docker compose down -v  # Removes all volumes
   >    docker compose up -d    # Fresh start with initialization
   >    ```
   > 
   > 2. **Change the volume name in docker-compose.yml:**
   >    ```yaml
   >    services:
   >      postgres:
   >        volumes:
   >          - postgres-data-v2:/var/lib/postgresql/data  # New volume name
   >    
   >    volumes:
   >      postgres-data-v2:  # Define the new volume
   >    ```
   > 
   > This applies to all database services that use persistent volumes (PostgreSQL, Neo4j, ClickHouse, Redis, etc.).

   > 💡 **NOTE**
   > In case, the server doesn't have the dump data. Transfer the files using the following command:
   >
   > ```bash
   > # Transfer files to the server
   > scp -r <source-path> <username>@<server-ip>:<destination-path>/data/backup
   > ```
   >
   > > 💡 **NOTE**  
   > > Replace `<destination-path>` with the path specified in the [docker-compose.yml](../docker-compose.yml) file.
   > >
   > > ```yaml
   > > services:
   > >   neo4j:
   > >     ...
   > >     volumes:
   > >       - <destination-path>:/var/lib/neo4j/import
   > > ```
   > >
   > > **For this project, by default in [docker-compose.yml](../docker-compose.yml) file, the path to keep the database dump is inside [backup](./scripts/data/backup/) folder.**

   #### Database Load Command

   ```bash
   docker compose up -d neo4j
   docker exec -it neo4j neo4j-admin database load --from-path=/var/lib/neo4j/import/data/backup pdnet
   # Change the username (default username is neo4j) and password
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE pdnet; START pdnet;"
   ```

6. For some systems, if you are not the admin user, there may be some restriction in the folder permissions. In such cases, you can change the folder permissions to allow yourself access to the scripts folder.

   ```bash
   # Change the folder permissions (you can have more granular control over this by changing the numbers)
   sudo chmod -R 755 scripts
   ```

7. Once, data is seeded successfully and database is ready. Now restart the neo4j service and start all the services including the API Gateway.

   ```bash
   docker compose down neo4j
   docker compose up -d --build
   ```

   This will start all services behind the API Gateway. Access the application at `http://localhost:5000/` in production mode and `http://localhost:8080/` in development mode.

   > 💡 **NOTE**
   > If you are a developer, you can use [docker-compose.dev.yml](./docker-compose.dev.yml) file to run the services in development mode with additional port mappings for direct access. This allows you to make changes in the code and see them reflected without restarting services, and also access services directly without going through the API Gateway.

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

   In development mode, you can access services both through the API Gateway and directly:
   - **Via API Gateway (Development)**: 
     - Frontend: `http://localhost:8080/`
     - NestJS API: `http://localhost:8080/api/nestjs/`
     - GSEA API: `http://localhost:8080/api/gsea/`
   - **Direct Access** (bypassing gateway):
     - Frontend: `http://localhost:3000`
     - NestJS API: `http://localhost:4000`
     - GSEA API: `http://localhost:5000`

8. Load ClickHouse data into the database (if you have `.tsv` backup files):

   - Ensure your `.tsv` files are placed in the [`scripts/data/backup/clickhouse`](./scripts/data/backup/clickhouse/) directory.
   - Ensure all services (including ClickHouse) are already running, as tables are created automatically by the application.
   - Load all tables from the backup:

     1. If tables are in TSV format:

        ```bash
        docker exec -it clickhouse bash -c '
          set -e
          for f in /backup/clickhouse/*.tsv /backup/clickhouse/*.tsv.gz; do
            table_name=$(sed -E "s/\.tsv(\.gz)?$//" <<< "$(basename $f)")
            if [[ $table_name == "*" ]]; then
              continue
            fi
            clickhouse-client --query="TRUNCATE TABLE $table_name"
            if [[ $f == *.gz ]]; then
              gunzip -c "$f" | clickhouse-client --query="INSERT INTO $table_name FORMAT TabSeparatedWithNames"
            else
              clickhouse-client --query="INSERT INTO $table_name FORMAT TabSeparatedWithNames" < "$f"
            fi
            echo "Loaded $table_name from $f"
          done
        '
        ```

     2. If tables are in Native format:
        ```bash
        docker exec -it clickhouse bash -c '
          set -e
          for f in /backup/clickhouse/*.native /backup/clickhouse/*.native.gz; do
            table_name=$(sed -E "s/\.native(\.gz)?$//" <<< "$(basename $f)")
            if [[ $table_name == "*" ]]; then
              continue
            fi
            clickhouse-client --query="TRUNCATE TABLE $table_name"
            if [[ $f == *.gz ]]; then
              gunzip -c "$f" | clickhouse-client --query="INSERT INTO $table_name FORMAT Native"
            else
              clickhouse-client --query="INSERT INTO $table_name FORMAT Native" < "$f"
            fi
            echo "Loaded $table_name from $f"
          done
        '
        ```

   > 💡 **NOTE**
   > If Materialized Views table is not created, you can create it manually using the following command:
   > ```bash
   > docker exec -it clickhouse clickhouse-client --query "DROP TABLE IF EXISTS mv_datasource_association_score_overall_association_score;"
   >
   > docker exec -it clickhouse clickhouse-client --query "CREATE MATERIALIZED VIEW IF NOT EXISTS mv_datasource_association_score_overall_association_score
   > ENGINE = MergeTree()
   > ORDER BY (disease_id, gene_id)
   > POPULATE
   > AS
   > SELECT
   >   das.gene_id,
   >   das.gene_name,
   >   das.disease_id,
   >   das.datasource_id,
   >   das.score AS datasource_score,
   >   oas.score AS overall_score
   > FROM datasource_association_score das
   > JOIN overall_association_score oas
   >   ON das.gene_id = oas.gene_id AND das.disease_id = oas.disease_id;"
   > ```

   > 💡 **NOTE**  
   > The application will auto-create tables on startup. Ensure the `.tsv` files match the expected schema.
   > For more details on importing/exporting ClickHouse data, see the [ClickHouse Data Export/Import](#clickhouse-data-exportimport) section below.

   > 💡 **NOTE**
   > If you are a developer, you can run use [docker-compose.dev.yml](../docker-compose.dev.yml) file to run the services in development mode. This will allow you to make changes in the code and see the changes reflected in the browser without restarting the services.
   > ```bash
   > docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   > ```

For more information of backend and frontend, refer to the respective README files in the [backend](./backend/README.md) and [frontend](./frontend/README.md) directories.

## Importing/Exporting Neo4j Data Dump

1. Export the database dump from the database.

   ```bash
   # Dump the database
   docker exec -it neo4j neo4j-admin database dump --overwrite-destination --to-path=/var/lib/neo4j/import/data/backup pdnet
   ```

Now, the database dump is available in the [backup](./scripts/data/backup) folder. If there's already a dump file present, it will overwrite it. It's better to rename the existing dump file before exporting the data in case something goes wrong, you do not lose the data. This dump file is now ready to be imported into another database.

2. The database dump can be imported into another database using the following command.

   ```bash
   # First, make the database offline
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "STOP DATABASE pdnet;"
   # Now, you can import the database dump
   docker exec -it neo4j neo4j-admin database load --overwrite-destination --from-path=/var/lib/neo4j/import/data/backup pdnet
   # Now, restart the container
   docker compose down neo4j && docker compose up -d neo4j
   # Now, you can start the database
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE pdnet IF NOT EXISTS; START DATABASE pdnet;"
   ```

   > 💡 **NOTE**  
   > The above command will overwrite the existing database. If you want to keep the existing database, you can create a new database and import the data into that database and then switch to the new database.

3. For ingesting data into the database, refer to the [Scripts Usage Documentation](./scripts/README.md).

---

## ClickHouse Data Export/Import

### Exporting ClickHouse Data

To export all ClickHouse tables as `.tsv` files (one file per table):

1. **Run this command inside your ClickHouse container:**  
   (Run on the server)

   ```bash
   docker exec -it clickhouse bash -c '
     mkdir -p /backup/clickhouse
     for t in $(clickhouse-client --query="SHOW TABLES" --format=TabSeparatedWithNames); do
       clickhouse-client --query="SELECT * FROM $t FORMAT TabSeparatedWithNames" > /backup/clickhouse/${t}.tsv
       echo "Exported $t to /backup/clickhouse/${t}.tsv"
     done
   '
   ```

   - This will create one `.tsv` file per table in the `/scripts/data/backup/clickhouse` directory (mounted as `/backup/clickhouse` in the container).

2. **Transfer the `.tsv` files to your local machine:**  
   (Run on your local machine)
   ```bash
   scp -P <port> -r <username>@<server-ip>:/path/to/server/scripts/data/backup/clickhouse/*.tsv /path/to/local/backup/
   ```
   - Replace `<port>`, `<username>`, and `<server-ip>` with your server details.

---

To export tables in `.native` format instead of `.tsv`, use this command instead:

```bash
docker exec -it clickhouse bash -c '
  mkdir -p /backup/clickhouse
  for t in $(clickhouse-client --query="SHOW TABLES" --format=TabSeparatedWithNames); do
    clickhouse-client --query="SELECT * FROM $t FORMAT Native" > /backup/clickhouse/${t}.native
    echo "Exported $t to /backup/clickhouse/${t}.native"
  done
'
```

### Importing ClickHouse Data

If you have received `.tsv` or `.native` files for ClickHouse tables (one file per table), follow these steps to load all data into your ClickHouse instance:

1. **Transfer the `.tsv` or `.native` files to the server**  
   (Run on your local machine)
   Use `scp` or another secure copy method to transfer all `.tsv` or `.native` files to the server.  
   For example:

   ```bash
   scp -P <port> -r /path/to/local/backup/*.tsv <username>@<server-ip>:/path/to/server/scripts/data/backup/clickhouse/
   ```

   - Replace `<port>`, `<username>`, and `<server-ip>` with your server details.
   - Adjust the destination path as needed to match your server's directory structure.

2. **Ensure the backup directory is mounted in Docker**  
   (Check on the server)
   Your `docker-compose.yml` should include this volume for the ClickHouse service:

   ```yaml
   services:
     clickhouse:
       ...
       volumes:
         - clickhouse-data:/var/lib/clickhouse
         - ./scripts/data/backup:/backup
   ```

3. **Start all services (tables will be auto-created by the app):**  
   (Run on the server)

   ```bash
   docker compose up -d
   ```

4. **Load all tables from the backup**  
   (Run on the server)
   Run this command to import all `.tsv` files from the backup directory:
   ```bash
   docker exec -it clickhouse bash -c '
     for f in /backup/clickhouse/*.tsv; do
       t=$(basename "$f" .tsv)
       clickhouse-client --query="INSERT INTO $t FORMAT TabSeparatedWithNames" < "$f"
     done
   '
   ```

   If your files are in `.native` format instead of `.tsv`, use this command instead:
   ```bash
   docker exec -it clickhouse bash -c '
     for f in /backup/clickhouse/*.native; do
       t=$(basename "$f" .native)
       clickhouse-client --query="INSERT INTO $t FORMAT Native" < "$f"
       echo "Loaded $t from $f"
     done
   '
   ```

**General Guidelines:**

- Ensure the `.tsv` files are transferred to the correct directory on the server before running the import command.
- The application will automatically create all required tables on startup.
- The `.tsv` files must match the schema expected by the application.
- If you need to adjust the backup path, update the volume mount and the import command accordingly.

---

## Initializing PostgreSQL Database (for Session Management)

### 1. Initialization

Run the following commands from the `backend` directory to set up your PostgreSQL database schema and generate the Prisma client:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 2. Applying Schema Changes

If you make any modifications to the Prisma schema file
[`/backend/prisma/schema.prisma`](/backend/prisma/schema.prisma),
use the same commands below to apply the updates to your database and regenerate the client:

```bash
npx prisma db push
npx prisma generate
```

---

## Troubleshooting & FAQs

1. File permissions error in frontend container running leading to unable to view pages on website. This may occur when working on company servers.

   **Fix:**

   ```bash
   docker exec -it frontend chmod -R 755 /usr/share/nginx/html
   ```

2. If you can't access the [`scripts`](./scripts) folder while running the docker container, you can change the folder permissions to allow yourself access to the scripts folder.

   **Fix:**

   ```bash
   # Change the folder permissions (you can have more granular control over this by changing the numbers)
   sudo chmod -R 755 scripts
   ```

3. If Video is not working, please Refer to [this point](#video-upload).

4. **Database Volume Already Exists - Initialization Failure**

   **Problem:** If a Docker volume already exists for a database service (PostgreSQL, Neo4j, ClickHouse, Redis, etc.) from a previous installation, the database will not initialize properly when you start the container.

   **Fix:**

   Either remove the existing volume before starting:
   ```bash
   docker compose down -v  # Removes all volumes
   docker compose up -d    # Fresh start with initialization
   ```

   Or change the volume name in `docker-compose.yml`:
   ```yaml
   services:
     postgres:
       volumes:
         - postgres-data-v2:/var/lib/postgresql/data  # Use new volume name
   
   volumes:
     postgres-data-v2:  # Define the new volume
   ```

   This applies to all database services (PostgreSQL, Neo4j, ClickHouse, Redis, etc.) that use persistent volumes.

5. **Hostname Configuration for Different Environments**

   **Important:** Hostnames need to be changed based on your environment:
   
   - **Development Environment:** Use `localhost` as the hostname in your `.env` files
   - **Production Environment:** Use the container name as the hostname in your `.env` files
   
   **Example:**
   ```bash
   # Development (.env file)
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   NEO4J_URI="bolt://localhost:7687"
   
   # Production (.env file)
   DATABASE_URL="postgresql://user:password@postgres:5432/dbname"
   NEO4J_URI="bolt://neo4j:7687"
   ```

6. **PostgreSQL Port Already in Use**

   **Problem:** If PostgreSQL (or any database service) is already running on the default port on your host machine, starting the container without addressing this will cause the database to not initialize properly.

   **Fix:**

   First, change the port mapping in `docker-compose.yml`:
   ```yaml
   services:
     postgres:
       ports:
         - "5433:5432"  # Use different host port
   ```

   Update your `DATABASE_URL` in `.env` files:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5433/dbname"
   ```

   If you already started PostgreSQL without fixing the port conflict, you must:
   ```bash
   # Stop and remove the container
   docker compose down postgres
   
   # Remove the volume
   docker volume rm tdp-platform_postgres-data
   
   # Change the port in docker-compose.yml (as shown above)
   
   # Start again
   docker compose up -d postgres
   ```

   This applies to other database services as well (Neo4j default ports: 7474, 7687; ClickHouse default ports: 8123, 9000; Redis default port: 6379).