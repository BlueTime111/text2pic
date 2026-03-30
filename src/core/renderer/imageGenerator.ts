import { toPng, toBlob, getFontEmbedCSS } from 'html-to-image';
import localforage from 'localforage';

// Global cache for expensive font embedding calculation
let cachedFontCSS: string | null = null;

const fontCacheStore = localforage.createInstance({
  name: "text2pic-font-cache",
  storeName: "fonts"
});

async function getPersistentFontCSS(element: HTMLElement): Promise<string> {
  if (cachedFontCSS) return cachedFontCSS;
  
  try {
    const stored = await fontCacheStore.getItem<string>('fontEmbedCSS');
    if (stored) {
      cachedFontCSS = stored;
      return stored;
    }
  } catch (err) {
    console.error("Failed to read font cache from IndexedDB", err);
  }

  // Calculate and inline the massive CSS font representations (~5-10 seconds)
  const css = await getFontEmbedCSS(element);
  cachedFontCSS = css;

  try {
    await fontCacheStore.setItem('fontEmbedCSS', css);
  } catch (err) {
    console.error("Failed to save font cache to IndexedDB", err);
  }

  return css;
}

export async function captureToPng(element: HTMLElement, pixelRatio = 2): Promise<string> {
  if (!element) throw new Error(`Target element not found.`);
  
  const finalFontCSS = await getPersistentFontCSS(element);

  return await toPng(element, {
    pixelRatio: pixelRatio,
    quality: 1,
    skipFonts: false,
    fontEmbedCSS: finalFontCSS,
  });
}

export async function captureToBlob(element: HTMLElement, pixelRatio = 2): Promise<Blob | null> {
  if (!element) return null;
  
  const finalFontCSS = await getPersistentFontCSS(element);

  return await toBlob(element, {
    pixelRatio: pixelRatio,
    fontEmbedCSS: finalFontCSS,
  });
}
