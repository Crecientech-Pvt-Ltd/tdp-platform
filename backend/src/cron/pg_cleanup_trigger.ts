import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function cleanupOldData() {
  try {
    // 1 Delete combinations older than 12 hours
    await prisma.combination.deleteMany({
      where: {
        verifiedAt: {
          lt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours
        },
      },
    });
    // 2 Delete sessions that now have zero combinations
    await prisma.session.deleteMany({
      where: {
        combinations: {
          none: {}, // means no combinations linked
        },
      },
    });
  } catch (err) {
    console.error('[CLEANUP] Error:', err);
  }
}
