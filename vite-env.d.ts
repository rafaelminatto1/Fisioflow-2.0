/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_GEMINI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type declarations for deployment safety
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
  
  const __DEV__: boolean;
  const __dirname: string;
  const process: NodeJS.Process;
}

// Module declarations for missing packages
declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): GenerativeModel;
  }
  
  export interface GenerativeModel {
    generateContent(prompt: string): Promise<GenerateContentResult>;
    generateContentStream(prompt: string): AsyncGenerator<GenerateContentResult>;
  }
  
  export interface GenerateContentResult {
    response: {
      text(): string;
      candidates?: GenerateContentCandidate[];
    };
  }
  
  export interface GenerateContentCandidate {
    content: {
      parts: { text: string }[];
    };
  }
}

declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform(): boolean;
    getPlatform(): string;
    isPluginAvailable(name: string): boolean;
  };
}

declare module '@capacitor/app' {
  export interface AppInfo {
    name: string;
    id: string;
    build: string;
    version: string;
  }
  
  export const App: {
    getInfo(): Promise<AppInfo>;
    addListener(eventName: string, callback: (data: unknown) => void): Promise<{ remove(): void }>;
  };
}

declare module '@capacitor/device' {
  export interface DeviceInfo {
    model: string;
    platform: string;
    operatingSystem: string;
    osVersion: string;
    manufacturer: string;
    isVirtual: boolean;
    webViewVersion: string;
  }
  
  export const Device: {
    getInfo(): Promise<DeviceInfo>;
  };
}

declare module '@capacitor/network' {
  export interface NetworkStatus {
    connected: boolean;
    connectionType: string;
  }
  
  export const Network: {
    getStatus(): Promise<NetworkStatus>;
    addListener(eventName: string, callback: (status: NetworkStatus) => void): Promise<{ remove(): void }>;
  };
}

declare module '@capacitor/status-bar' {
  export enum Style {
    Dark = 'DARK',
    Light = 'LIGHT',
    Default = 'DEFAULT'
  }
  
  export const StatusBar: {
    setStyle(options: { style: Style }): Promise<void>;
    hide(): Promise<void>;
    show(): Promise<void>;
  };
}

declare module '@capacitor/splash-screen' {
  export const SplashScreen: {
    show(): Promise<void>;
    hide(): Promise<void>;
  };
}

declare module '@capacitor/keyboard' {
  export const Keyboard: {
    show(): Promise<void>;
    hide(): Promise<void>;
    addListener(eventName: string, callback: (info: unknown) => void): Promise<{ remove(): void }>;
  };
}

declare module '@capacitor/haptics' {
  export enum ImpactStyle {
    Heavy = 'HEAVY',
    Medium = 'MEDIUM',
    Light = 'LIGHT'
  }
  
  export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR'
  }
  
  export const Haptics: {
    impact(options: { style: ImpactStyle }): Promise<void>;
    notification(options: { type: NotificationType }): Promise<void>;
    vibrate(): Promise<void>;
  };
}

declare module '@capacitor/camera' {
  export enum CameraResultType {
    Uri = 'uri',
    Base64 = 'base64'
  }
  
  export enum CameraSource {
    Prompt = 'PROMPT',
    Camera = 'CAMERA',
    Photos = 'PHOTOS'
  }
  
  export interface CameraPhoto {
    base64String?: string;
    dataUrl?: string;
    path?: string;
    webPath?: string;
    format: string;
    saved: boolean;
  }
  
  export const Camera: {
    getPhoto(options: {
      quality?: number;
      allowEditing?: boolean;
      resultType: CameraResultType;
      source?: CameraSource;
    }): Promise<CameraPhoto>;
  };
}

declare module '@capacitor/filesystem' {
  export enum Directory {
    Documents = 'DOCUMENTS',
    Data = 'DATA',
    Cache = 'CACHE',
    External = 'EXTERNAL',
    ExternalStorage = 'EXTERNAL_STORAGE'
  }
  
  export enum Encoding {
    UTF8 = 'utf8',
    ASCII = 'ascii',
    UTF16 = 'utf16'
  }
  
  export const Filesystem: {
    writeFile(options: {
      path: string;
      data: string;
      directory?: Directory;
      encoding?: Encoding;
    }): Promise<{ uri: string }>;
    
    readFile(options: {
      path: string;
      directory?: Directory;
      encoding?: Encoding;
    }): Promise<{ data: string }>;
    
    deleteFile(options: {
      path: string;
      directory?: Directory;
    }): Promise<void>;
  };
}

declare module '@capacitor/push-notifications' {
  export interface Token {
    value: string;
  }
  
  export interface PushNotificationSchema {
    title?: string;
    body?: string;
    id: string;
    badge?: number;
    notification?: unknown;
    data: unknown;
    click_action?: string;
    link?: string;
    group?: string;
    groupSummary?: boolean;
  }
  
  export interface ActionPerformed {
    actionId: string;
    inputValue?: string;
    notification: PushNotificationSchema;
  }
  
  export const PushNotifications: {
    requestPermissions(): Promise<{ receive: string }>;
    register(): Promise<void>;
    addListener(eventName: string, callback: (data: unknown) => void): Promise<{ remove(): void }>;
  };
}

declare module '@capacitor/local-notifications' {
  export interface LocalNotificationSchema {
    title: string;
    body: string;
    id: number;
    schedule?: {
      at: Date;
      repeats?: boolean;
      allowWhileIdle?: boolean;
    };
    sound?: string;
    attachments?: unknown[];
    actionTypeId?: string;
    extra?: unknown;
  }
  
  export const LocalNotifications: {
    schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void>;
    cancel(options: { notifications: { id: number }[] }): Promise<void>;
    addListener(eventName: string, callback: (data: unknown) => void): Promise<{ remove(): void }>;
  };
}

declare module '@supabase/postgrest-js' {
  export interface PostgrestFilterBuilder<T> {
    eq(column: string, value: unknown): PostgrestFilterBuilder<T>;
    neq(column: string, value: unknown): PostgrestFilterBuilder<T>;
    gt(column: string, value: unknown): PostgrestFilterBuilder<T>;
    gte(column: string, value: unknown): PostgrestFilterBuilder<T>;
    lt(column: string, value: unknown): PostgrestFilterBuilder<T>;
    lte(column: string, value: unknown): PostgrestFilterBuilder<T>;
    like(column: string, pattern: string): PostgrestFilterBuilder<T>;
    ilike(column: string, pattern: string): PostgrestFilterBuilder<T>;
    is(column: string, value: unknown): PostgrestFilterBuilder<T>;
    in(column: string, values: unknown[]): PostgrestFilterBuilder<T>;
    contains(column: string, value: unknown): PostgrestFilterBuilder<T>;
    containedBy(column: string, value: unknown): PostgrestFilterBuilder<T>;
    rangeGt(column: string, range: string): PostgrestFilterBuilder<T>;
    rangeGte(column: string, range: string): PostgrestFilterBuilder<T>;
    rangeLt(column: string, range: string): PostgrestFilterBuilder<T>;
    rangeLte(column: string, range: string): PostgrestFilterBuilder<T>;
    rangeAdjacent(column: string, range: string): PostgrestFilterBuilder<T>;
    overlaps(column: string, value: unknown): PostgrestFilterBuilder<T>;
    textSearch(column: string, query: string): PostgrestFilterBuilder<T>;
    match(query: Record<string, unknown>): PostgrestFilterBuilder<T>;
    not(column: string, operator: string, value: unknown): PostgrestFilterBuilder<T>;
    or(filters: string): PostgrestFilterBuilder<T>;
    filter(column: string, operator: string, value: unknown): PostgrestFilterBuilder<T>;
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): PostgrestFilterBuilder<T>;
    limit(count: number): PostgrestFilterBuilder<T>;
    range(from: number, to: number): PostgrestFilterBuilder<T>;
    single(): PostgrestFilterBuilder<T>;
    maybeSingle(): PostgrestFilterBuilder<T>;
    csv(): PostgrestFilterBuilder<T>;
    geojson(): PostgrestFilterBuilder<T>;
    explain(options?: { analyze?: boolean; verbose?: boolean; settings?: boolean; buffers?: boolean; wal?: boolean }): PostgrestFilterBuilder<T>;
    then<TResult1 = T[], TResult2 = never>(
      onfulfilled?: ((value: { data: T[] | null; error: unknown | null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2>;
  }
  
  export interface PostgrestQueryBuilder<T> {
    select(columns?: string): PostgrestFilterBuilder<T>;
    insert(values: Partial<T> | Partial<T>[]): PostgrestFilterBuilder<T>;
    update(values: Partial<T>): PostgrestFilterBuilder<T>;
    delete(): PostgrestFilterBuilder<T>;
    upsert(values: Partial<T> | Partial<T>[]): PostgrestFilterBuilder<T>;
  }
}