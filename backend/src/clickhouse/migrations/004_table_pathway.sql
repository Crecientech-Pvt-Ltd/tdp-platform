-- DO NOT EDIT

CREATE TABLE IF NOT EXISTS pathway
(
    gene_id LowCardinality(String),
    property_name LowCardinality(String),
    score UInt8
)
ENGINE = MergeTree()
ORDER BY (gene_id, property_name);
