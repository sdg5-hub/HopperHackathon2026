import { initDb, seedDemoData } from '@/lib/db';
import { listMedications } from '@/lib/db/queries';

export async function runDbExample(): Promise<void> {
  await initDb();
  await seedDemoData();

  const meds = await listMedications();
  console.log('[RxShield] medications:', meds);
}
