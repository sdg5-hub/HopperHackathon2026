import { seedDemoData } from './db';
import { listMedications } from './queries';

export async function runDbExample(): Promise<void> {
  await seedDemoData();

  const meds = await listMedications();
  console.log('[MedTrack] medications:', meds);
}
