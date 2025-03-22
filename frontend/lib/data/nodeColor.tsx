import type { PROPERTY_LABEL_TYPE_MAPPING } from ".";

export const nodeColor = [
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
    label: "Pathways",
    tooltipContent: <>Pathways membership from MSigDB</>,
  },
  {
    label: "Druggability",
    tooltipContent: (
      <>
        Druggability scores from{" "}
        <a href="https://astrazeneca-cgr-publications.github.io/DrugnomeAI/index.html" className="underline">
          DrugnomeAI
        </a>
        /
        <a href="https://public.cgr.astrazeneca.com/mantisml/v2/index.html" className="underline">
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
        <a href="https://gtexportal.org/" className="underline">
          GTEX
        </a>{" "}
        and{" "}
        <a href="https://www.proteinatlas.org/" className="underline">
          HPA (Human Protein Atlas)
        </a>
      </>
    ),
  },
  {
    label: "Databases",
    tooltipContent: <>Membership in Various Databases</>,
  },
  {
    label: "Custom",
    tooltipContent: (
      <>
        Custom information <br />
        <b>Disclaimer:</b> This information should provided by the user through custom upload.
        <br />
        <b>Column Prefix:</b> <i>Custom_Color</i>
      </>
    ),
  },
] as const;

export type NodeColorType = {
  [K in keyof typeof PROPERTY_LABEL_TYPE_MAPPING]: K extends (typeof nodeColor)[number]["label"]
    ? (typeof PROPERTY_LABEL_TYPE_MAPPING)[K]
    : never;
}[keyof typeof PROPERTY_LABEL_TYPE_MAPPING];
