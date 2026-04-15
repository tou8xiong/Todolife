export function saveTempData(key: string, data: any) {
  try {
    localStorage.setItem(`temp_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save temp data:", e);
  }
}

export function loadTempData<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(`temp_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load temp data:", e);
    return null;
  }
}

export function clearTempData(key: string) {
  try {
    localStorage.removeItem(`temp_${key}`);
  } catch (e) {
    console.error("Failed to clear temp data:", e);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
