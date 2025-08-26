/// <reference types="vite/client" />

declare module '*.css?url' {
  const url: string;
  export default url;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  readonly downlink: number;
  readonly rtt: number;
  readonly saveData: boolean;
}
