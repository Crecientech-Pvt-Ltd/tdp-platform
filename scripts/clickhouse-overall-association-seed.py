import pandas as pd
import requests
import sys

CLICKHOUSE_URL = 'http://localhost:8123'
TABLE_NAME = 'overall_association_score'

if len(sys.argv) != 2:
    print("Usage: python ingest_to_clickhouse.py <csv_file>")
    sys.exit(1)

csv_file = sys.argv[1]

create_query = f'''
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    gene_id String,
    disease_id String,
    score Float64
) ENGINE = MergeTree()
ORDER BY (disease_id, score)
'''
resp = requests.post(f'{CLICKHOUSE_URL}/?query={create_query}')
if resp.status_code != 200:
    print("Error creating table:", resp.text)
    sys.exit(1)

df = pd.read_csv(csv_file, header=None, names=['gene_id', 'raw_disease_id', 'score'])
df['disease_id'] = df['raw_disease_id'].apply(lambda x: '_'.join(x.split('_')[:2]))
df = df[['gene_id', 'disease_id', 'score']]
df['score'] = df['score'].astype(float)

csv_data = df.to_csv(index=False, header=False)
insert_query = f'INSERT INTO {TABLE_NAME} FORMAT CSV'
resp = requests.post(f'{CLICKHOUSE_URL}/?query={insert_query}', data=csv_data.encode('utf-8'))

if resp.status_code == 200:
    print(f'Inserted {len(df)} rows from {csv_file}.')
else:
    print("Error inserting data:", resp.text)
