import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import gpuDatabase from '../src/data/gpu-database.json';
import { lookupGPU, getGPUMemory } from '../src/utils/gpu-lookup';

interface DetectGPUEntry {
  name: string;
  model: string;
  searchTerms: string;
  tier: number;
  benchmarks: Array<[number, number, number, string?]>;
}

interface GPUAnalysis {
  totalGPUs: number;
  coveredGPUs: number;
  missingGPUs: string[];
  vendorCoverage: Record<string, { total: number; covered: number; missing: string[] }>;
  platformCoverage: Record<string, { total: number; covered: number; missing: string[] }>;
}

describe('GPU Database Coverage Analysis', () => {
  let allDetectGPUs: DetectGPUEntry[] = [];
  let analysis: GPUAnalysis;

  beforeAll(() => {
    // Load all detect-gpu benchmark files
    const benchmarkDir = join(__dirname, '../node_modules/detect-gpu/dist/benchmarks');
    const benchmarkFiles = readdirSync(benchmarkDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${benchmarkFiles.length} benchmark files:`, benchmarkFiles);

    for (const file of benchmarkFiles) {
      try {
        const filePath = join(benchmarkDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Parse detect-gpu format: [version, ...entries]
        if (Array.isArray(data) && data.length > 1) {
          const entries = data.slice(1); // Skip version
          
          for (const entry of entries) {
            if (Array.isArray(entry) && entry.length >= 5) {
              const [name, model, searchTerms, tier, benchmarks] = entry;
              allDetectGPUs.push({
                name: name || '',
                model: model || '',
                searchTerms: searchTerms || '',
                tier: tier || 0,
                benchmarks: benchmarks || []
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
      }
    }

    console.log(`Loaded ${allDetectGPUs.length} GPUs from detect-gpu library`);

    // Analyze coverage
    analysis = analyzeGPUCoverage(allDetectGPUs);
  });

  function analyzeGPUCoverage(detectGPUs: DetectGPUEntry[]): GPUAnalysis {
    const analysis: GPUAnalysis = {
      totalGPUs: detectGPUs.length,
      coveredGPUs: 0,
      missingGPUs: [],
      vendorCoverage: {},
      platformCoverage: {}
    };

    for (const gpu of detectGPUs) {
      const gpuName = gpu.name.toLowerCase().trim();
      if (!gpuName || gpuName === 'unknown' || gpuName.includes('???')) {
        continue; // Skip invalid entries
      }

      const isInDatabase = lookupGPU(gpuName) !== null;
      const vendor = detectVendor(gpuName);
      const platform = detectPlatform(gpuName);

      // Update vendor coverage
      if (!analysis.vendorCoverage[vendor]) {
        analysis.vendorCoverage[vendor] = { total: 0, covered: 0, missing: [] };
      }
      analysis.vendorCoverage[vendor].total++;

      // Update platform coverage
      if (!analysis.platformCoverage[platform]) {
        analysis.platformCoverage[platform] = { total: 0, covered: 0, missing: [] };
      }
      analysis.platformCoverage[platform].total++;

      if (isInDatabase) {
        analysis.coveredGPUs++;
        analysis.vendorCoverage[vendor].covered++;
        analysis.platformCoverage[platform].covered++;
      } else {
        analysis.missingGPUs.push(gpuName);
        analysis.vendorCoverage[vendor].missing.push(gpuName);
        analysis.platformCoverage[platform].missing.push(gpuName);
      }
    }

    return analysis;
  }

  function detectVendor(gpuName: string): string {
    const name = gpuName.toLowerCase();
    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx') || name.includes('quadro')) return 'nvidia';
    if (name.includes('amd') || name.includes('radeon') || name.includes('rx') || name.includes('ati')) return 'amd';
    if (name.includes('intel') || name.includes('arc') || name.includes('iris') || name.includes('uhd') || name.includes('hd graphics')) return 'intel';
    if (name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3') || name.includes('m4') || name.includes('a1') || name.includes('a15') || name.includes('a16') || name.includes('a17')) return 'apple';
    if (name.includes('adreno')) return 'qualcomm';
    if (name.includes('mali')) return 'arm';
    if (name.includes('powervr')) return 'imagination';
    if (name.includes('samsung')) return 'samsung';
    return 'unknown';
  }

  function detectPlatform(gpuName: string): string {
    const name = gpuName.toLowerCase();
    if (name.includes('mobile') || name.includes('adreno') || name.includes('mali') || name.includes('powervr') || name.includes('apple a1') || name.includes('samsung')) return 'mobile';
    if (name.includes('iris') || name.includes('uhd') || name.includes('hd graphics') || name.includes('integrated')) return 'integrated';
    return 'desktop';
  }

  it('should have loaded GPU data from detect-gpu library', () => {
    expect(allDetectGPUs.length).toBeGreaterThan(0);
    console.log(`✓ Loaded ${allDetectGPUs.length} GPUs from detect-gpu library`);
  });

  it('should have a reasonable coverage percentage', () => {
    const coveragePercentage = (analysis.coveredGPUs / analysis.totalGPUs) * 100;
    console.log(`\n📊 Overall Coverage: ${analysis.coveredGPUs}/${analysis.totalGPUs} (${coveragePercentage.toFixed(1)}%)`);
    
    // We expect at least 20% coverage for a good start
    expect(coveragePercentage).toBeGreaterThan(20);
  });

  it('should provide detailed vendor coverage analysis', () => {
    console.log('\n🏢 Vendor Coverage Analysis:');
    
    for (const [vendor, stats] of Object.entries(analysis.vendorCoverage)) {
      const percentage = stats.total > 0 ? (stats.covered / stats.total) * 100 : 0;
      console.log(`  ${vendor}: ${stats.covered}/${stats.total} (${percentage.toFixed(1)}%)`);
      
      if (stats.missing.length > 0 && stats.missing.length <= 10) {
        console.log(`    Missing: ${stats.missing.slice(0, 5).join(', ')}${stats.missing.length > 5 ? '...' : ''}`);
      }
    }

    // Major vendors should have some coverage
    expect(analysis.vendorCoverage.nvidia?.covered || 0).toBeGreaterThan(0);
    expect(analysis.vendorCoverage.amd?.covered || 0).toBeGreaterThan(0);
  });

  it('should provide detailed platform coverage analysis', () => {
    console.log('\n💻 Platform Coverage Analysis:');
    
    for (const [platform, stats] of Object.entries(analysis.platformCoverage)) {
      const percentage = stats.total > 0 ? (stats.covered / stats.total) * 100 : 0;
      console.log(`  ${platform}: ${stats.covered}/${stats.total} (${percentage.toFixed(1)}%)`);
    }

    // Desktop should have good coverage
    expect(analysis.platformCoverage.desktop?.covered || 0).toBeGreaterThan(0);
  });

  it('should identify high-priority missing GPUs', () => {
    console.log('\n🎯 High-Priority Missing GPUs (first 20):');
    
    const highPriorityMissing = analysis.missingGPUs
      .filter(gpu => {
        // Filter for modern, popular GPUs
        const name = gpu.toLowerCase();
        return (
          name.includes('rtx 40') || name.includes('rtx 30') ||
          name.includes('rx 7') || name.includes('rx 6') ||
          name.includes('arc a') || name.includes('m3') || name.includes('m4') ||
          name.includes('adreno 7') || name.includes('mali-g7')
        );
      })
      .slice(0, 20);

    highPriorityMissing.forEach(gpu => {
      console.log(`  - ${gpu}`);
    });

    // This test documents missing GPUs but doesn't fail
    expect(analysis.missingGPUs).toBeDefined();
  });

  it('should validate database integrity', () => {
    console.log('\n🔍 Database Integrity Check:');
    
    const dbEntries = Object.keys(gpuDatabase);
    console.log(`  Database entries: ${dbEntries.length}`);
    
    let validEntries = 0;
    let invalidEntries: string[] = [];

    for (const [gpuName, gpuInfo] of Object.entries(gpuDatabase)) {
      if (gpuInfo.vendor && gpuInfo.platform && gpuInfo.memory && gpuInfo.performance) {
        validEntries++;
      } else {
        invalidEntries.push(gpuName);
      }
    }

    console.log(`  Valid entries: ${validEntries}/${dbEntries.length}`);
    
    if (invalidEntries.length > 0) {
      console.log(`  Invalid entries: ${invalidEntries.join(', ')}`);
    }

    expect(validEntries).toBe(dbEntries.length);
  });

  it('should test lookup functionality with sample GPUs', () => {
    console.log('\n🧪 Testing Lookup Functionality:');
    
    const testCases = [
      'nvidia geforce rtx 4090',
      'amd radeon rx 7900 xtx',
      'intel arc a770',
      'apple m3',
      'adreno 740'
    ];

    for (const testGpu of testCases) {
      const result = lookupGPU(testGpu);
      const memory = getGPUMemory(testGpu);
      
      console.log(`  ${testGpu}: ${result ? '✓' : '✗'} (${memory || 'N/A'} MB)`);
      
      if (result) {
        expect(result.vendor).toBeDefined();
        expect(result.platform).toBeDefined();
        expect(result.performance.tier).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should generate recommendations for database expansion', () => {
    console.log('\n💡 Recommendations for Database Expansion:');
    
    // Analyze missing GPUs by vendor and suggest priorities
    const recommendations: Record<string, string[]> = {};
    
    for (const [vendor, stats] of Object.entries(analysis.vendorCoverage)) {
      if (stats.missing.length > 0) {
        // Get unique, clean GPU names
        const cleanMissing = [...new Set(stats.missing)]
          .filter(gpu => gpu.length > 3 && !gpu.includes('???'))
          .slice(0, 5);
        
        if (cleanMissing.length > 0) {
          recommendations[vendor] = cleanMissing;
        }
      }
    }

    for (const [vendor, gpus] of Object.entries(recommendations)) {
      console.log(`  ${vendor}: Add ${gpus.join(', ')}`);
    }

    expect(Object.keys(recommendations).length).toBeGreaterThanOrEqual(0);
  });
});
