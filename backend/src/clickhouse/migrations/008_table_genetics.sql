-- DO NOT EDIT

CREATE TABLE IF NOT EXISTS genetics
(
    gene_id LowCardinality(String),
    disease_id LowCardinality(String),
    property_name LowCardinality(String),
    score Float32
)
ENGINE = MergeTree()
ORDER BY (disease_id, gene_id, property_name);
