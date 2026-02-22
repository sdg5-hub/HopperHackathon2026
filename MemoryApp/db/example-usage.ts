import { initDb, seedDemoData } from './db';
import { listMedications } from './queries';

export async function runDbExample(): Promise<void> {
  await initDb();
  await seedDemoData();

  const meds = await listMedications();
  console.log('[RxShield] medications:', meds);
}
