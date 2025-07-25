import gpuDatabase from '../data/gpu-database.json';

export interface GPUInfo {
  vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'qualcomm' | 'arm' | 'imagination';
  platform: 'desktop' | 'mobile' | 'integrated';
  memory: {
    vram?: number; // MB for discrete GPUs
    unified?: number; // MB for unified memory (Apple Silicon, mobile)
    type?: string;
  };
  performance: {
    tier: number; // 0-3
    fps: number;
  };
  architecture?: string;
  year?: number;
}

/**
 * Normalize GPU name for lookup by removing common variations and standardizing format
 */
function normalizeGPUName(gpuName: string): string {
  return gpuName
    .toLowerCase()
    .trim()
    // Remove common prefixes/suffixes
    .replace(/^(nvidia|amd|intel|apple|qualcomm|arm)\s+/i, '')
    .replace(/\s+(graphics|gpu|processor)$/i, '')
    // Normalize spacing
    .replace(/\s+/g, ' ')
    // Remove parentheses and brackets
    .replace(/[\(\)\[\]]/g, '')
    // Handle common variations
    .replace(/geforce\s+/i, 'geforce ')
    .replace(/radeon\s+/i, 'radeon ')
    .replace(/\bgtx\b/i, 'gtx')
    .replace(/\brtx\b/i, 'rtx')
    .replace(/\brx\b/i, 'rx')
    .trim();
}

/**
 * Generate possible GPU name variations for lookup
 */
function generateGPUVariations(gpuName: string): string[] {
  const normalized = normalizeGPUName(gpuName);
  const variations: string[] = [normalized];
  
  // Add original name (lowercased)
  variations.push(gpuName.toLowerCase().trim());
  
  // Add vendor-prefixed versions
  const vendors = ['nvidia', 'amd', 'intel', 'apple'];
  vendors.forEach(vendor => {
    if (!normalized.includes(vendor)) {
      variations.push(`${vendor} ${normalized}`);
    }
  });
  
  // Add common GPU name patterns
  if (normalized.includes('geforce')) {
    variations.push(normalized.replace('geforce ', ''));
    variations.push(`nvidia ${normalized}`);
  }
  
  if (normalized.includes('radeon')) {
    variations.push(normalized.replace('radeon ', ''));
    variations.push(`amd ${normalized}`);
  }
  
  if (normalized.includes('arc')) {
    variations.push(`intel ${normalized}`);
  }
  
  // Handle Apple Silicon variations
  if (normalized.includes('apple') || normalized.includes('m1') || normalized.includes('m2') || normalized.includes('m3') || normalized.includes('m4')) {
    variations.push(normalized.replace(/apple\s+/i, ''));
    variations.push(`apple ${normalized.replace(/apple\s+/i, '')}`);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Look up GPU information from the local database
 */
export function lookupGPU(gpuName: string): GPUInfo | null {
  if (!gpuName) return null;
  
  const variations = generateGPUVariations(gpuName);
  
  // Try exact matches first
  for (const variation of variations) {
    if (gpuDatabase[variation as keyof typeof gpuDatabase]) {
      return gpuDatabase[variation as keyof typeof gpuDatabase] as GPUInfo;
    }
  }
  
  // Try partial matches for complex GPU names
  const dbKeys = Object.keys(gpuDatabase);
  for (const variation of variations) {
    const partialMatch = dbKeys.find(key => 
      key.includes(variation) || variation.includes(key)
    );
    if (partialMatch) {
      return gpuDatabase[partialMatch as keyof typeof gpuDatabase] as GPUInfo;
    }
  }
  
  return null;
}

/**
 * Get memory information for a GPU
 */
export function getGPUMemory(gpuName: string): number | null {
  const gpuInfo = lookupGPU(gpuName);
  if (!gpuInfo) return null;
  
  // Return VRAM for discrete GPUs, unified memory for integrated/mobile
  return gpuInfo.memory.vram || gpuInfo.memory.unified || null;
}

/**
 * Get GPU vendor from name
 */
export function getGPUVendor(gpuName: string): string {
  const gpuInfo = lookupGPU(gpuName);
  if (gpuInfo) {
    return gpuInfo.vendor;
  }
  
  // Fallback to name-based detection
  const name = gpuName.toLowerCase();
  if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx')) return 'nvidia';
  if (name.includes('amd') || name.includes('radeon') || name.includes('rx')) return 'amd';
  if (name.includes('intel') || name.includes('arc') || name.includes('iris') || name.includes('uhd')) return 'intel';
  if (name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3') || name.includes('m4')) return 'apple';
  if (name.includes('adreno')) return 'qualcomm';
  if (name.includes('mali')) return 'arm';
  if (name.includes('powervr')) return 'imagination';
  
  return 'unknown';
}

/**
 * Get GPU platform type
 */
export function getGPUPlatform(gpuName: string): string {
  const gpuInfo = lookupGPU(gpuName);
  if (gpuInfo) {
    return gpuInfo.platform;
  }
  
  // Fallback detection
  const name = gpuName.toLowerCase();
  if (name.includes('apple') || name.includes('adreno') || name.includes('mali') || name.includes('powervr')) {
    return 'mobile';
  }
  if (name.includes('iris') || name.includes('uhd') || name.includes('integrated')) {
    return 'integrated';
  }
  
  return 'desktop';
}

/**
 * Estimate memory for unknown GPUs based on tier and platform
 */
export function estimateGPUMemory(tier: number, platform: string): number {
  if (platform === 'mobile') {
    // Mobile GPU memory estimates based on tier
    switch (tier) {
      case 3: return 8192; // High-end mobile (Apple M3/M4, Adreno 740)
      case 2: return 6144; // Mid-range mobile (Apple M1/M2, Adreno 660)
      case 1: return 4096; // Entry-level mobile
      default: return 2048; // Very low-end
    }
  } else if (platform === 'integrated') {
    // Integrated GPU memory estimates
    switch (tier) {
      case 2: return 4096; // Intel Iris Xe
      case 1: return 2048; // Intel UHD
      default: return 1024; // Very basic integrated
    }
  } else {
    // Desktop GPU memory estimates
    switch (tier) {
      case 3: return 12288; // High-end desktop (12GB+)
      case 2: return 8192;  // Mid-range desktop (8GB)
      case 1: return 6144;  // Entry-level desktop (6GB)
      default: return 4096; // Very low-end desktop
    }
  }
}
