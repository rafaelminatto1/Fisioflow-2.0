import { Capacitor } from '@capacitor/core';
import { App, AppInfo } from '@capacitor/app';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, NetworkStatus } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';

export interface MobileCapabilities {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  hasCamera: boolean;
  hasNotifications: boolean;
  hasHaptics: boolean;
  hasNetwork: boolean;
}

export interface DeviceInformation extends DeviceInfo {
  appInfo?: AppInfo;
  networkStatus?: NetworkStatus;
}

class MobileService {
  private static instance: MobileService;
  private capabilities: MobileCapabilities | null = null;
  private deviceInfo: DeviceInformation | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  private async initialize() {
    if (Capacitor.isNativePlatform()) {
      await this.initializeNativeFeatures();
    }
    await this.detectCapabilities();
    await this.getDeviceInformation();
  }

  private async initializeNativeFeatures() {
    try {
      // Initialize status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1e40af' });

      // Hide splash screen after initialization
      await SplashScreen.hide();

      // Set up keyboard listeners
      Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('Keyboard will show with height:', info.keyboardHeight);
      });

      Keyboard.addListener('keyboardDidShow', (info) => {
        console.log('Keyboard did show with height:', info.keyboardHeight);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
      });

      Keyboard.addListener('keyboardDidHide', () => {
        console.log('Keyboard did hide');
      });

      // Set up app state listeners
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active:', isActive);
      });

      App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event.url);
      });

      // Set up network listeners
      Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
      });

    } catch (error) {
      console.error('Error initializing native features:', error);
    }
  }

  private async detectCapabilities(): Promise<void> {
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    
    this.capabilities = {
      isNative: Capacitor.isNativePlatform(),
      platform,
      hasCamera: Capacitor.isPluginAvailable('Camera'),
      hasNotifications: Capacitor.isPluginAvailable('PushNotifications'),
      hasHaptics: Capacitor.isPluginAvailable('Haptics'),
      hasNetwork: Capacitor.isPluginAvailable('Network'),
    };
  }

  private async getDeviceInformation(): Promise<void> {
    try {
      const deviceInfo = await Device.getInfo();
      const appInfo = Capacitor.isNativePlatform() ? await App.getInfo() : undefined;
      const networkStatus = this.capabilities?.hasNetwork ? await Network.getStatus() : undefined;

      this.deviceInfo = {
        ...deviceInfo,
        appInfo,
        networkStatus,
      };
    } catch (error) {
      console.error('Error getting device information:', error);
    }
  }

  // Public API methods

  public getCapabilities(): MobileCapabilities | null {
    return this.capabilities;
  }

  public getDeviceInfo(): DeviceInformation | null {
    return this.deviceInfo;
  }

  public isNative(): boolean {
    return this.capabilities?.isNative ?? false;
  }

  public getPlatform(): 'ios' | 'android' | 'web' {
    return this.capabilities?.platform ?? 'web';
  }

  // Status Bar methods
  public async setStatusBarStyle(style: 'light' | 'dark'): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.setStyle({ 
        style: style === 'light' ? Style.Light : Style.Dark 
      });
    } catch (error) {
      console.error('Error setting status bar style:', error);
    }
  }

  public async setStatusBarColor(color: string): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Error setting status bar color:', error);
    }
  }

  // Haptics methods
  public async hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!this.capabilities?.hasHaptics) return;

    try {
      const impactStyle = style === 'light' ? ImpactStyle.Light : 
                         style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  public async hapticNotification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.capabilities?.hasHaptics) return;

    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Error triggering haptic notification:', error);
    }
  }

  // Camera methods
  public async takePhoto(): Promise<string | null> {
    if (!this.capabilities?.hasCamera) {
      throw new Error('Camera not available on this device');
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  public async selectFromGallery(): Promise<string | null> {
    if (!this.capabilities?.hasCamera) {
      throw new Error('Camera not available on this device');
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      return null;
    }
  }

  // File system methods
  public async saveFile(fileName: string, data: string, directory: Directory = Directory.Documents): Promise<boolean> {
    if (!this.isNative()) {
      // Fallback for web - use download
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }

    try {
      await Filesystem.writeFile({
        path: fileName,
        data,
        directory,
        encoding: Encoding.UTF8,
      });
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  public async readFile(fileName: string, directory: Directory = Directory.Documents): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory,
        encoding: Encoding.UTF8,
      });
      return result.data as string;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  public async deleteFile(fileName: string, directory: Directory = Directory.Documents): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory,
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Network methods
  public async getNetworkStatus(): Promise<NetworkStatus | null> {
    if (!this.capabilities?.hasNetwork) return null;

    try {
      return await Network.getStatus();
    } catch (error) {
      console.error('Error getting network status:', error);
      return null;
    }
  }

  public isOnline(): boolean {
    return this.deviceInfo?.networkStatus?.connected ?? navigator.onLine;
  }

  // Push notifications methods
  public async requestNotificationPermissions(): Promise<boolean> {
    if (!this.capabilities?.hasNotifications) return false;

    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  public async registerForPushNotifications(): Promise<string | null> {
    if (!this.capabilities?.hasNotifications) return null;

    try {
      await PushNotifications.register();
      
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token: Token) => {
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error registering for push notifications:', error);
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  public setupPushNotificationListeners(
    onNotificationReceived?: (notification: PushNotificationSchema) => void,
    onNotificationActionPerformed?: (action: ActionPerformed) => void
  ): void {
    if (!this.capabilities?.hasNotifications) return;

    if (onNotificationReceived) {
      PushNotifications.addListener('pushNotificationReceived', onNotificationReceived);
    }

    if (onNotificationActionPerformed) {
      PushNotifications.addListener('pushNotificationActionPerformed', onNotificationActionPerformed);
    }
  }

  // Local notifications methods
  public async scheduleLocalNotification(notification: Omit<LocalNotificationSchema, 'id'>): Promise<boolean> {
    if (!this.isNative()) {
      // Fallback for web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
        });
        return true;
      }
      return false;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          ...notification,
          id: Date.now(), // Generate unique ID
        }]
      });
      return true;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }

  // Keyboard methods
  public async showKeyboard(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await Keyboard.show();
    } catch (error) {
      console.error('Error showing keyboard:', error);
    }
  }

  public async hideKeyboard(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('Error hiding keyboard:', error);
    }
  }

  // App methods
  public async getAppInfo(): Promise<AppInfo | null> {
    if (!this.isNative()) return null;

    try {
      return await App.getInfo();
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }

  public async exitApp(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await App.exitApp();
    } catch (error) {
      console.error('Error exiting app:', error);
    }
  }

  // Utility methods
  public async share(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }

    // Fallback for devices without native sharing
    if (data.url) {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text || '')}&url=${encodeURIComponent(data.url)}`;
      window.open(shareUrl, '_blank');
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const mobileService = MobileService.getInstance();
export default mobileService;