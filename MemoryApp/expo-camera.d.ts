declare module 'expo-camera' {
  import type { ComponentType } from 'react';

  export type BarcodeScanningResult = {
    data: string;
    type: string;
  };

  export type CameraViewProps = {
    style?: any;
    facing?: 'front' | 'back';
    barcodeScannerSettings?: {
      barcodeTypes?: string[];
    };
    onBarcodeScanned?: ((result: BarcodeScanningResult) => void) | undefined;
  };

  export const CameraView: ComponentType<CameraViewProps>;

  export function useCameraPermissions(): [
    { granted: boolean } | null,
    () => Promise<{ granted: boolean }>
  ];
}
