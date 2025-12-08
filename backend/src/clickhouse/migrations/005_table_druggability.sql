-- DO NOT EDIT

CREATE TABLE IF NOT EXISTS druggability
(
    gene_id LowCardinality(String),
    property_name LowCardinality(String),
    score Float32
)
ENGINE = MergeTree()
ORDER BY (gene_id, property_name);
