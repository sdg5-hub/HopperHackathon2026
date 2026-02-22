import { initDb, seedDemoData } from './index';
import { listMedications } from './queries';

export async function runDbExample(): Promise<void> {
  await initDb();
  await seedDemoData();

  const meds = await listMedications();
  console.log('[MedTrack] medications:', meds);
}
