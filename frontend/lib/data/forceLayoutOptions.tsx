export const forceLayoutOptions = [
  {
    key: 'linkDistance',
    label: 'Link Distance',
    tooltip: 'Distance between connected nodes',
    min: 1,
    max: 5000,
    step: 100,
  },
  {
    key: 'chargeStrength',
    label: 'Charge Strength',
    tooltip: 'Controls how much nodes repel each other. Negative values push nodes apart.',
    min: -200,
    max: -10,
    step: 1,
  },
] as const;
