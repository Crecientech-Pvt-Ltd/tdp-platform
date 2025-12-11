import cron from 'node-cron';
import { cleanupOldData } from './pg_cleanup_trigger';

// Run 4 times a Day
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Starting cleanup job...');
  await cleanupOldData();
});
