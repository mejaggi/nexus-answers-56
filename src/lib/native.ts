import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";

const isNative = () => Capacitor.isNativePlatform();

export const tap = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* no-op on web */
  }
};

export const shareText = async (title: string, text: string, url?: string) => {
  if (isNative()) {
    try {
      await Share.share({ title, text, url, dialogTitle: title });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(`${title}\n${text}${url ? `\n${url}` : ""}`);
    return true;
  } catch {
    return false;
  }
};

/** Open a native-feeling file picker. On web/Capacitor we use a hidden input
 *  because Capacitor Filesystem doesn't expose a system file chooser. */
export const pickFile = (accept = ".pdf,.doc,.docx,.txt"): Promise<File | null> =>
  new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });

export const isNativeApp = isNative;
