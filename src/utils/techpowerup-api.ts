/**
 * TechPowerUp API utility for fetching GPU specifications
 */

export interface TechPowerUpGPUInfo {
  vram: number | null; // VRAM in MB
  name: string;
}

/**
 * Fetch VRAM amount from TechPowerUp for a given GPU search name
 * @param searchName The GPU name to search for
 * @returns VRAM in MB, or null if not found
 */
export async function fetchTechPowerUpVRAM(searchName: string): Promise<number | null> {
  const PROXY = 'https://corsproxy.io/?url=';
  try {
    const query = encodeURIComponent(searchName);
    const res = await fetch(`${PROXY}https://www.techpowerup.com/gpu-specs/?ajaxsrch=${query}`);
    const text = await res.text();
    
    // Parse memory column of the first row
    const cellMatchGB = text.match(/<td>\s*(\d+)\s*GB/i);
    if (cellMatchGB) return parseInt(cellMatchGB[1], 10) * 1024;
    
    const cellMatchMB = text.match(/<td>\s*(\d+)\s*MB/i);
    if (cellMatchMB) return parseInt(cellMatchMB[1], 10);
    
    return null;
  } catch (e) {
    console.error('Failed to fetch TechPowerUp VRAM:', e);
    return null;
  }
}

/**
 * Clean GPU name for better TechPowerUp search results
 * @param gpuName Raw GPU name from database
 * @returns Cleaned name suitable for TechPowerUp search
 */
export function cleanGPUNameForSearch(gpuName: string): string {
  return gpuName
    .replace(/^nvidia\s+/i, '') // Remove 'nvidia' prefix
    .replace(/\s+(opengl engine|mobile|desktop)$/i, '') // Remove platform suffixes
    .replace(/\s+with max q design/i, '') // Remove Max-Q suffix
    .replace(/\s+laptop gpu/i, '') // Remove laptop GPU suffix
    .replace(/\s+oem/i, '') // Remove OEM suffix
    .replace(/^(asus|evga|gainward|gigabyte|msi|palit|zotac)\s+/i, '') // Remove vendor prefixes
    .trim();
}

/**
 * Add delay to avoid rate limiting
 * @param ms Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
