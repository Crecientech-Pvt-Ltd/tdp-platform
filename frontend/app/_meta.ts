import type { MetaRecord } from 'nextra';

export default {
  '*': {
    display: 'hidden',
    theme: {
      navbar: false,
      footer: false,
      timestamp: false,
      copyPage: false,
    },
  },
  docs: {
    display: 'children',
    theme: {
      navbar: true,
      footer: true,
      timestamp: true,
      copyPage: true,
    },
  },
} satisfies MetaRecord;
