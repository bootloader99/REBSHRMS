import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import type { Coordinates } from '../../../types/domain';

async function requestLocationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.check(permission)) return;
  const result = await PermissionsAndroid.request(permission, {
    title: 'Allow location access',
    message: 'REBS HRMS uses your location to verify that you are near the office when recording attendance.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error(result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ? 'Location permission is blocked. Enable it in device settings to record attendance.'
      : 'Location permission was denied.');
  }
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  await requestLocationPermission();
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      error => {
        if (error.code === 1) reject(new Error('Location permission was denied.'));
        else if (error.code === 2) reject(new Error('Your current location is unavailable. Check location services.'));
        else if (error.code === 3) reject(new Error('Location request timed out. Please try again.'));
        else reject(new Error(error.message || 'Unable to get your location.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  });
}
