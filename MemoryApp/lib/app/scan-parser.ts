import type { MedicationForm } from '@/lib/db/types';

export type ScanDraft = {
  name: string;
  dosage: string;
  instructions: string;
  form: MedicationForm;
  warningTags: string[];
};

const barcodeMedicationMap: Record<string, Omit<ScanDraft, 'warningTags'>> = {
  '036000291452': {
    name: 'Amoxicillin',
    dosage: '500 mg',
    instructions: 'Take with water.',
    form: 'pill'
  },
  '301220008016': {
    name: 'Azithromycin',
    dosage: '250 mg',
    instructions: 'Take once daily with water.',
    form: 'pill'
  },
  '300054378120': {
    name: 'Ibuprofen',
    dosage: '200 mg',
    instructions: 'Take with food if stomach upset occurs.',
    form: 'pill'
  }
};

function inferWarningTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (lower.includes('with food')) tags.push('with_food');
  if (lower.includes('avoid alcohol')) tags.push('avoid_alcohol');
  if (lower.includes('grapefruit')) tags.push('avoid_grapefruit');
  if (lower.includes('drows')) tags.push('may_cause_drowsiness');
  if (lower.includes('do not drive') || lower.includes('dont drive')) tags.push('do_not_drive');
  if (lower.includes('with water')) tags.push('take_with_water');
  return Array.from(new Set(tags));
}

export function parseScannedMedication(rawData: string): ScanDraft | null {
  const raw = rawData.trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, ' ');

  if (barcodeMedicationMap[normalized]) {
    const mapped = barcodeMedicationMap[normalized];
    return {
      ...mapped,
      warningTags: inferWarningTags(mapped.instructions)
    };
  }

  const dosageMatch = normalized.match(/(\d+(?:\.\d+)?)\s?(mg|mcg|g|ml|units)/i);
  const dosage = dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2].toLowerCase()}` : '';

  let name = normalized;
  if (dosageMatch) {
    name = normalized.slice(0, dosageMatch.index).replace(/[-:,]$/, '').trim();
  }

  if (!name) {
    const token = normalized.split(' ')[0];
    name = token;
  }

  name = name
    .replace(/\b(tab|tablet|capsule|cap|suspension|solution)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!name) return null;

  return {
    name,
    dosage,
    instructions: normalized,
    form: 'pill',
    warningTags: inferWarningTags(normalized)
  };
}
