import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { parseScannedMedication } from '@/lib/app/scan-parser';
import { useTheme } from '@/theme';

export default function ScanMedicationScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [rawScan, setRawScan] = useState('');
  const [locked, setLocked] = useState(false);

  const parsed = useMemo(() => parseScannedMedication(rawScan), [rawScan]);

  const onScanned = (result: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);
    setRawScan(result.data);
  };

  const applyToForm = () => {
    if (!parsed) {
      Alert.alert('No match', 'Could not parse medication details. You can still enter manually.');
      return;
    }

    const payload = encodeURIComponent(JSON.stringify(parsed));
    router.replace({ pathname: '/meds/new', params: { scanPayload: payload } });
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.mutedText }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <AppCard>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text }}>Camera permission needed</Text>
          <Text style={{ color: theme.colors.mutedText }}>Allow camera access to scan bottle barcodes/QR and prefill medication details.</Text>
          <AppButton label="Grant Permission" onPress={() => requestPermission()} />
          <AppButton label="Back to Add Medication" tone="secondary" onPress={() => router.replace('/meds/new')} />
        </AppCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.text }}>Scan Medication Barcode</Text>
      <Text style={{ color: theme.colors.mutedText }}>Best results: scan barcode or QR on bottle/package, then confirm fields before saving.</Text>

      <View style={{ height: 320, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
        <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }} onBarcodeScanned={onScanned} />
      </View>

      <AppCard>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>Scanned data</Text>
        <Text style={{ color: theme.colors.mutedText }}>{rawScan || 'No scan yet.'}</Text>
        {parsed ? (
          <>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{parsed.name}{parsed.dosage ? ` • ${parsed.dosage}` : ''}</Text>
            <Text style={{ color: theme.colors.mutedText }}>{parsed.instructions}</Text>
          </>
        ) : null}
      </AppCard>

      <AppButton label="Apply to Add Medication" onPress={applyToForm} />
      <AppButton label="Scan Again" tone="secondary" onPress={() => { setLocked(false); setRawScan(''); }} />
      <AppButton label="Back" tone="secondary" onPress={() => router.replace('/meds/new')} />
    </ScrollView>
  );
}
