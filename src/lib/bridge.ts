"use client";

type BridgeMethod =
  | "shareArticle"
  | "shareArticleV2"
  | "genericShareV1"
  | "closeScreen"
  | "closeScreenV2"
  | "goBack"
  | "openFullWeb"
  | "openArticle"
  | "openArticleV2"
  | "openViaDeepLinkJsonData"
  | "openLink"
  | "getAppUserData"
  | "getAppUserDataV2"
  | "trackMixpanelEvent"
  | "trackInteractivePage"
  | "getTrackingParams"
  | "getLocalData"
  | "setLocalData"
  | "setLocalDataV2"
  | "showToast"
  | "writeToClipboard"
  | "enablePullToRefresh"
  | "allowScreenshot";

interface BridgePayloads {
  shareArticle: { title: string; description?: string; url: string };
  shareArticleV2: { title: string; description?: string; url: string; image?: string };
  genericShareV1: { text: string; url?: string };
  closeScreen: Record<string, never>;
  closeScreenV2: { animated?: boolean };
  goBack: Record<string, never>;
  openFullWeb: { url: string };
  openArticle: { id: string };
  openArticleV2: { id: string; source?: string };
  openViaDeepLinkJsonData: { data: unknown };
  openLink: { url: string; target?: "_blank" | "_self" };
  getAppUserData: Record<string, never>;
  getAppUserDataV2: { fields?: string[] };
  trackMixpanelEvent: { event: string; properties?: Record<string, unknown> };
  trackInteractivePage: { page: string; data?: Record<string, unknown> };
  getTrackingParams: Record<string, never>;
  getLocalData: { key: string };
  setLocalData: { key: string; value: string };
  setLocalDataV2: { key: string; value: string; ttl?: number };
  showToast: { message: string; duration?: number };
  writeToClipboard: { text: string };
  enablePullToRefresh: { enabled: boolean };
  allowScreenshot: { allowed: boolean };
}

interface WindowWithWebview {
  webview?: {
    methods?: Record<string, (data: string) => void>;
    callbacks?: Record<string, (data: string) => void>;
  };
}

function isWebview(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as WindowWithWebview;
  return !!w.webview?.methods;
}

function callNative<T extends BridgeMethod>(
  method: T,
  payload: BridgePayloads[T]
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bridge only available in browser"));
      return;
    }

    const w = window as WindowWithWebview;
    if (!w.webview?.methods?.[method]) {
      reject(new Error(`Bridge method "${method}" not available`));
      return;
    }

    const callbackId = `${method}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const handleCallback = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.callbackId === callbackId) {
          window.removeEventListener("message", handleCallback);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.result);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleCallback);

    // Set up timeout
    setTimeout(() => {
      window.removeEventListener("message", handleCallback);
      reject(new Error(`Bridge method "${method}" timed out`));
    }, 5000);

    w.webview.methods[method](
      JSON.stringify({ ...payload, callbackId })
    );
  });
}

function methodExists<T extends BridgeMethod>(methods: T[]) {
  return {
    or(callback: (available: T[]) => void) {
      if (typeof window === "undefined") return;
      const w = window as WindowWithWebview;
      const available = methods.filter((m) => !!w.webview?.methods?.[m]);
      if (available.length > 0) {
        callback(available);
      }
      return {
        else(elseCallback: () => void) {
          if (available.length === 0) {
            elseCallback();
          }
        },
      };
    },
    and(callback: (available: T[]) => void) {
      if (typeof window === "undefined") return;
      const w = window as WindowWithWebview;
      const allAvailable = methods.every((m) => !!w.webview?.methods?.[m]);
      if (allAvailable) {
        callback(methods);
      }
      return {
        else(elseCallback: () => void) {
          if (!allAvailable) {
            elseCallback();
          }
        },
      };
    },
  };
}

export const bridge = {
  isWebview,
  call: callNative,
  methodExists,
  shareArticle: (payload: BridgePayloads["shareArticle"]) =>
    callNative("shareArticle", payload),
  shareArticleV2: (payload: BridgePayloads["shareArticleV2"]) =>
    callNative("shareArticleV2", payload),
  genericShareV1: (payload: BridgePayloads["genericShareV1"]) =>
    callNative("genericShareV1", payload),
};
