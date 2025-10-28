-- DO NOT EDIT

-- Enter Table data manually in the new format
CREATE TABLE IF NOT EXISTS target_prioritization_factors
(
    gene_id LowCardinality(String),
    property_name LowCardinality(String),
    score Float32
)
ENGINE = MergeTree()
ORDER BY (gene_id, property_name);
