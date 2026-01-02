export type BillbotNativeMessage = {
  type: string;
  payload?: unknown;
};

declare global {
  interface Window {
    BillbotNative?: {
      postMessage?: (payload: unknown) => void;
    };
    webkit?: any;
  }
}

export function postNativeMessage(message: BillbotNativeMessage): void {
  try {
    // Preferred: our injected bootstrap on iOS (`BillbotWebView.swift`)
    if (window.BillbotNative?.postMessage) {
      window.BillbotNative.postMessage(message);
      return;
    }

    // Fallback: direct WKWebView bridge if present
    const handler = window.webkit?.messageHandlers?.native;
    if (handler?.postMessage) {
      handler.postMessage(message);
    }
  } catch {
    // Never crash the web app because native bridge is missing/broken.
  }
}

export {};



