import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface DetectGPUEntry {
  name: string;
  model: string;
  searchTerms: string;
  tier: number;
  benchmarks: Array<[number, number, number, string?]>;
}

interface GPUInfo {
  vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'qualcomm' | 'arm' | 'imagination' | 'samsung' | 'unknown';
  platform: 'desktop' | 'mobile' | 'integrated';
  memory: {
    vram?: number;
    unified?: number;
    type?: string;
  };
  performance: {
    tier: number;
    fps: number;
  };
  architecture?: string;
  year?: number;
}

function detectVendor(gpuName: string): GPUInfo['vendor'] {
  const name = gpuName.toLowerCase();
  if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx') || name.includes('quadro') || name.includes('tesla')) return 'nvidia';
  if (name.includes('amd') || name.includes('radeon') || name.includes('rx') || name.includes('ati') || name.includes('firepro')) return 'amd';
  if (name.includes('intel') || name.includes('arc') || name.includes('iris') || name.includes('uhd') || name.includes('hd graphics')) return 'intel';
  if (name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3') || name.includes('m4') || name.includes('a1') || name.includes('a15') || name.includes('a16') || name.includes('a17')) return 'apple';
  if (name.includes('adreno')) return 'qualcomm';
  if (name.includes('mali')) return 'arm';
  if (name.includes('powervr')) return 'imagination';
  if (name.includes('samsung') || name.includes('xclipse')) return 'samsung';
  return 'unknown';
}

function detectPlatform(gpuName: string, fileName: string): GPUInfo['platform'] {
  const name = gpuName.toLowerCase();
  
  // Mobile indicators from filename
  if (fileName.startsWith('m-')) return 'mobile';
  
  // Mobile indicators from name
  if (name.includes('mobile') || name.includes('adreno') || name.includes('mali') || name.includes('powervr') || 
      name.includes('apple a1') || name.includes('samsung') || name.includes('xclipse')) return 'mobile';
  
  // Integrated indicators
  if (name.includes('iris') || name.includes('uhd') || name.includes('hd graphics') || name.includes('integrated') ||
      name.includes('vega') && name.includes('graphics')) return 'integrated';
  
  return 'desktop';
}

function estimateMemory(vendor: string, platform: string, tier: number, gpuName: string): { vram?: number; unified?: number; type?: string } {
  const name = gpuName.toLowerCase();
  
  // Try to extract memory from name patterns
  const memoryMatch = name.match(/(\d+)\s*(gb|mb)/i);
  if (memoryMatch) {
    const amount = parseInt(memoryMatch[1]);
    const unit = memoryMatch[2].toLowerCase();
    const memoryMB = unit === 'gb' ? amount * 1024 : amount;
    
    if (platform === 'mobile' || platform === 'integrated') {
      return { unified: memoryMB, type: platform === 'mobile' ? 'LPDDR5' : 'DDR4' };
    } else {
      return { vram: memoryMB, type: 'GDDR6' };
    }
  }
  
  // Fallback estimation based on vendor, platform, and tier
  if (platform === 'mobile') {
    if (vendor === 'apple') {
      switch (tier) {
        case 3: return { unified: 16384, type: 'Unified' };
        case 2: return { unified: 8192, type: 'Unified' };
        case 1: return { unified: 6144, type: 'Unified' };
        default: return { unified: 4096, type: 'Unified' };
      }
    } else if (vendor === 'qualcomm') {
      switch (tier) {
        case 3: return { unified: 12288, type: 'LPDDR5' };
        case 2: return { unified: 8192, type: 'LPDDR5' };
        case 1: return { unified: 6144, type: 'LPDDR4X' };
        default: return { unified: 4096, type: 'LPDDR4X' };
      }
    } else {
      switch (tier) {
        case 3: return { unified: 8192, type: 'LPDDR5' };
        case 2: return { unified: 6144, type: 'LPDDR5' };
        case 1: return { unified: 4096, type: 'LPDDR4X' };
        default: return { unified: 2048, type: 'LPDDR4' };
      }
    }
  } else if (platform === 'integrated') {
    switch (tier) {
      case 2: return { unified: 4096, type: 'DDR4/DDR5' };
      case 1: return { unified: 2048, type: 'DDR4/DDR5' };
      default: return { unified: 1024, type: 'DDR4' };
    }
  } else {
    // Desktop discrete GPUs
    if (vendor === 'nvidia') {
      if (name.includes('rtx 40')) {
        switch (tier) {
          case 3: return { vram: name.includes('4090') ? 24576 : name.includes('4080') ? 16384 : 12288, type: 'GDDR6X' };
          case 2: return { vram: 8192, type: 'GDDR6' };
          default: return { vram: 6144, type: 'GDDR6' };
        }
      } else if (name.includes('rtx 30')) {
        switch (tier) {
          case 3: return { vram: name.includes('3090') ? 24576 : name.includes('3080') ? 10240 : 8192, type: 'GDDR6X' };
          case 2: return { vram: name.includes('3060') ? 12288 : 8192, type: 'GDDR6' };
          default: return { vram: 6144, type: 'GDDR6' };
        }
      } else {
        switch (tier) {
          case 3: return { vram: 11264, type: 'GDDR5X' };
          case 2: return { vram: 8192, type: 'GDDR5' };
          case 1: return { vram: 6144, type: 'GDDR5' };
          default: return { vram: 4096, type: 'GDDR5' };
        }
      }
    } else if (vendor === 'amd') {
      if (name.includes('rx 7')) {
        switch (tier) {
          case 3: return { vram: name.includes('7900 xtx') ? 24576 : name.includes('7900 xt') ? 20480 : 16384, type: 'GDDR6' };
          case 2: return { vram: 12288, type: 'GDDR6' };
          default: return { vram: 8192, type: 'GDDR6' };
        }
      } else if (name.includes('rx 6')) {
        switch (tier) {
          case 3: return { vram: 16384, type: 'GDDR6' };
          case 2: return { vram: name.includes('6600') ? 8192 : 12288, type: 'GDDR6' };
          default: return { vram: 8192, type: 'GDDR6' };
        }
      } else {
        switch (tier) {
          case 3: return { vram: 8192, type: 'GDDR5' };
          case 2: return { vram: 6144, type: 'GDDR5' };
          case 1: return { vram: 4096, type: 'GDDR5' };
          default: return { vram: 2048, type: 'GDDR5' };
        }
      }
    } else if (vendor === 'intel') {
      switch (tier) {
        case 2: return { vram: name.includes('a770') ? 16384 : 8192, type: 'GDDR6' };
        case 1: return { vram: 6144, type: 'GDDR6' };
        default: return { vram: 4096, type: 'GDDR6' };
      }
    } else {
      // Unknown vendor desktop GPU
      switch (tier) {
        case 3: return { vram: 12288, type: 'GDDR6' };
        case 2: return { vram: 8192, type: 'GDDR6' };
        case 1: return { vram: 6144, type: 'GDDR5' };
        default: return { vram: 4096, type: 'GDDR5' };
      }
    }
  }
}

function detectArchitecture(vendor: string, gpuName: string): string | undefined {
  const name = gpuName.toLowerCase();
  
  if (vendor === 'nvidia') {
    if (name.includes('rtx 40')) return 'Ada Lovelace';
    if (name.includes('rtx 30')) return 'Ampere';
    if (name.includes('rtx 20') || name.includes('gtx 16')) return 'Turing';
    if (name.includes('gtx 10')) return 'Pascal';
    if (name.includes('gtx 9')) return 'Maxwell';
    return 'NVIDIA GPU';
  } else if (vendor === 'amd') {
    if (name.includes('rx 7')) return 'RDNA 3';
    if (name.includes('rx 6')) return 'RDNA 2';
    if (name.includes('rx 5')) return 'RDNA';
    if (name.includes('vega')) return 'Vega';
    return 'AMD GPU';
  } else if (vendor === 'intel') {
    if (name.includes('arc')) return 'Xe HPG';
    if (name.includes('iris')) return 'Xe LP';
    if (name.includes('uhd')) return 'Gen 9-12';
    return 'Intel GPU';
  } else if (vendor === 'apple') {
    if (name.includes('m4')) return 'Apple Silicon M4';
    if (name.includes('m3')) return 'Apple Silicon M3';
    if (name.includes('m2')) return 'Apple Silicon M2';
    if (name.includes('m1')) return 'Apple Silicon M1';
    if (name.includes('a17')) return 'Apple A17';
    if (name.includes('a16')) return 'Apple A16';
    if (name.includes('a15')) return 'Apple A15';
    return 'Apple GPU';
  } else if (vendor === 'qualcomm') {
    if (name.includes('adreno 7')) return 'Adreno 700';
    if (name.includes('adreno 6')) return 'Adreno 600';
    if (name.includes('adreno 5')) return 'Adreno 500';
    return 'Adreno GPU';
  } else if (vendor === 'arm') {
    if (name.includes('mali-g7')) return 'Valhall';
    if (name.includes('mali-g5') || name.includes('mali-g3')) return 'Bifrost';
    return 'Mali GPU';
  }
  
  return undefined;
}

function estimateYear(vendor: string, gpuName: string): number | undefined {
  const name = gpuName.toLowerCase();
  
  if (vendor === 'nvidia') {
    if (name.includes('rtx 40')) return 2022;
    if (name.includes('rtx 30')) return 2020;
    if (name.includes('rtx 20')) return 2018;
    if (name.includes('gtx 16')) return 2019;
    if (name.includes('gtx 10')) return 2016;
  } else if (vendor === 'amd') {
    if (name.includes('rx 7')) return 2022;
    if (name.includes('rx 6')) return 2020;
    if (name.includes('rx 5')) return 2019;
  } else if (vendor === 'apple') {
    if (name.includes('m4')) return 2024;
    if (name.includes('m3')) return 2023;
    if (name.includes('m2')) return 2022;
    if (name.includes('m1')) return 2020;
    if (name.includes('a17')) return 2023;
    if (name.includes('a16')) return 2022;
    if (name.includes('a15')) return 2021;
  }
  
  return undefined;
}

function calculateAverageFPS(benchmarks: Array<[number, number, number, string?]>): number {
  if (benchmarks.length === 0) return 30; // Default fallback
  
  const totalFPS = benchmarks.reduce((sum, benchmark) => sum + benchmark[2], 0);
  return Math.round(totalFPS / benchmarks.length);
}

function normalizeGPUName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\(\)\[\]]/g, '')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .trim();
}

function generateGPUDatabase(): Record<string, GPUInfo> {
  const database: Record<string, GPUInfo> = {};
  const benchmarkDir = join(__dirname, '../node_modules/detect-gpu/dist/benchmarks');
  const benchmarkFiles = readdirSync(benchmarkDir).filter(file => file.endsWith('.json'));
  
  console.log(`Processing ${benchmarkFiles.length} benchmark files...`);
  
  for (const file of benchmarkFiles) {
    console.log(`Processing ${file}...`);
    
    try {
      const filePath = join(benchmarkDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data) && data.length > 1) {
        const entries = data.slice(1); // Skip version
        
        for (const entry of entries) {
          if (Array.isArray(entry) && entry.length >= 5) {
            const [name, model, searchTerms, tier, benchmarks] = entry;
            
            if (!name || typeof name !== 'string' || name.includes('???') || name.length < 3) {
              continue; // Skip invalid entries
            }
            
            const normalizedName = normalizeGPUName(name);
            
            // Skip if already exists (prefer first occurrence)
            if (database[normalizedName]) {
              continue;
            }
            
            const vendor = detectVendor(normalizedName);
            const platform = detectPlatform(normalizedName, file);
            const memory = estimateMemory(vendor, platform, tier || 1, normalizedName);
            const architecture = detectArchitecture(vendor, normalizedName);
            const year = estimateYear(vendor, normalizedName);
            const fps = calculateAverageFPS(benchmarks || []);
            
            database[normalizedName] = {
              vendor,
              platform,
              memory,
              performance: {
                tier: tier || 1,
                fps
              },
              architecture,
              year
            };
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to process ${file}:`, error);
    }
  }
  
  console.log(`Generated database with ${Object.keys(database).length} GPUs`);
  return database;
}

// Generate the database
const database = generateGPUDatabase();

// Write to file
const outputPath = join(__dirname, '../src/data/gpu-database.json');
writeFileSync(outputPath, JSON.stringify(database, null, 2));

console.log(`✅ GPU database written to ${outputPath}`);
console.log(`📊 Total GPUs: ${Object.keys(database).length}`);

// Print vendor breakdown
const vendorCounts: Record<string, number> = {};
for (const gpu of Object.values(database)) {
  vendorCounts[gpu.vendor] = (vendorCounts[gpu.vendor] || 0) + 1;
}

console.log('\n🏢 Vendor breakdown:');
for (const [vendor, count] of Object.entries(vendorCounts)) {
  console.log(`  ${vendor}: ${count} GPUs`);
}
