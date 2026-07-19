/**
 * Safe wrappers around expo-image-picker. The native module is only present
 * after a rebuild that includes the package — missing it must not crash the app.
 */

import { Platform } from 'react-native';

export class ImagePickerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImagePickerUnavailableError';
  }
}

type ImagePickerModule = typeof import('expo-image-picker');

function loadImagePicker(): ImagePickerModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker') as ImagePickerModule;
  } catch {
    return null;
  }
}

export function isImagePickerAvailable(): boolean {
  const mod = loadImagePicker();
  if (!mod) return false;
  try {
    // Touching a method that uses the native module surfaces "Cannot find native module".
    void mod.getCameraPermissionsAsync;
    return true;
  } catch {
    return false;
  }
}

async function withImagePicker<T>(fn: (mod: ImagePickerModule) => Promise<T>): Promise<T> {
  const mod = loadImagePicker();
  if (!mod) {
    throw new ImagePickerUnavailableError(
      'La cámara/galería no está disponible. Recompila la app (development build) tras instalar expo-image-picker.',
    );
  }
  try {
    return await fn(mod);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ExponentImagePicker') || msg.includes('native module')) {
      throw new ImagePickerUnavailableError(
        'Falta el módulo nativo de cámara/galería. Ejecuta un nuevo development build (eas build --profile development o npx expo run:android).',
      );
    }
    throw err;
  }
}

export async function pickImageFromLibrary(): Promise<string | null> {
  return withImagePicker(async (ImagePicker) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      throw new ImagePickerUnavailableError(
        'Necesitamos acceso a tus fotos para escanear boletas.',
      );
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  });
}

export async function takePhotoWithCamera(): Promise<string | null> {
  return withImagePicker(async (ImagePicker) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new ImagePickerUnavailableError(
        'Necesitamos la cámara para fotografiar boletas.',
      );
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  });
}
