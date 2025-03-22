import type { PROPERTY_LABEL_TYPE_MAPPING } from ".";

export const nodeSize = [
  {
    label: "LogFC",
    tooltipContent: <>Differential Expression in Log2 fold change.</>,
  },
  {
    label: "GDA",
    tooltipContent: <>Gene Disease Association Score</>,
  },
  {
    label: "Genetics",
    tooltipContent: <>Odd ratio or Beta-values from population studies.</>,
  },
  {
    label: "Druggability",
    tooltipContent: (
      <>
        Druggability scores from{" "}
        <a
          href="https://astrazeneca-cgr-publications.github.io/DrugnomeAI/index.html"
          className="underline"
        >
          DrugnomeAI
        </a>
        /
        <a
          href="https://public.cgr.astrazeneca.com/mantisml/v2/index.html"
          className="underline"
        >
          Mantis-ML
        </a>
      </>
    ),
  },
  {
    label: "TE",
    tooltipContent: (
      <>
        Tissue-specific expression from{" "}
        <a
          href="https://gtexportal.org/"
          className="underline"
        >
          GTEX
        </a>{" "}
        and{" "}
        <a
          href="https://www.proteinatlas.org/"
          className="underline"
        >
          HPA (Human Protein Atlas)
        </a>
      </>
    ),
  },
] as const;

export type NodeSizeType = {
  [K in keyof typeof PROPERTY_LABEL_TYPE_MAPPING]: K extends (typeof nodeSize)[number]["label"]
    ? (typeof PROPERTY_LABEL_TYPE_MAPPING)[K]
    : never;
}[keyof typeof PROPERTY_LABEL_TYPE_MAPPING];
