#!/usr/bin/env bun

/**
 * Script to sync NVIDIA GPU VRAM values with TechPowerUp data
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fetchTechPowerUpVRAM, cleanGPUNameForSearch, delay } from '../src/utils/techpowerup-api';

interface GPUEntry {
  vendor: string;
  platform: string;
  memory: {
    vram?: number;
    unified?: number;
    type: string;
  };
  performance: {
    tier: number;
    fps: number;
  };
  architecture: string;
}

interface GPUDatabase {
  [key: string]: GPUEntry;
}

interface SyncResult {
  name: string;
  oldVRAM: number;
  newVRAM: number;
  updated: boolean;
  searchName: string;
}

async function syncNvidiaVRAM() {
  console.log('🔄 Starting NVIDIA VRAM sync with TechPowerUp...\n');

  // Load GPU database
  const databasePath = join(__dirname, '../src/data/gpu-database.json');
  const database: GPUDatabase = JSON.parse(readFileSync(databasePath, 'utf-8'));

  // Extract NVIDIA GPUs
  const nvidiaGPUs = Object.entries(database)
    .filter(([, gpu]) => gpu.vendor === 'nvidia')
    .map(([name, gpu]) => ({ name, gpu }));

  console.log(`Found ${nvidiaGPUs.length} NVIDIA GPUs in database\n`);

  const results: SyncResult[] = [];
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  // Process each NVIDIA GPU
  for (const { name, gpu } of nvidiaGPUs) {
    processedCount++;
    
    // Get current VRAM from database
    const memory = gpu.memory as any;
    const currentVRAM = memory.vram || memory.unified || 0;
    
    // Clean name for TechPowerUp search
    const searchName = cleanGPUNameForSearch(name);
    
    console.log(`[${processedCount}/${nvidiaGPUs.length}] Processing: ${name}`);
    console.log(`  Search: "${searchName}"`);
    console.log(`  Current VRAM: ${currentVRAM}MB`);
    
    try {
      // Fetch VRAM from TechPowerUp
      const techPowerUpVRAM = await fetchTechPowerUpVRAM(searchName);
      
      if (techPowerUpVRAM !== null) {
        console.log(`  TechPowerUp VRAM: ${techPowerUpVRAM}MB`);
        
        // Check if update is needed (allow 10% tolerance to avoid minor differences)
        const tolerance = Math.max(512, Math.round(techPowerUpVRAM * 0.1));
        const needsUpdate = Math.abs(currentVRAM - techPowerUpVRAM) > tolerance;
        
        if (needsUpdate) {
          // Update the database entry
          if (gpu.platform === 'mobile' || gpu.platform === 'integrated') {
            memory.unified = techPowerUpVRAM;
          } else {
            memory.vram = techPowerUpVRAM;
          }
          
          updatedCount++;
          console.log(`  ✅ Updated: ${currentVRAM}MB → ${techPowerUpVRAM}MB`);
        } else {
          console.log(`  ✓ No update needed (within tolerance)`);
        }
        
        results.push({
          name,
          oldVRAM: currentVRAM,
          newVRAM: techPowerUpVRAM,
          updated: needsUpdate,
          searchName
        });
      } else {
        console.log(`  ❌ No TechPowerUp data found`);
        errorCount++;
        
        results.push({
          name,
          oldVRAM: currentVRAM,
          newVRAM: 0,
          updated: false,
          searchName
        });
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
      errorCount++;
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay to avoid rate limiting
    if (processedCount < nvidiaGPUs.length) {
      await delay(1000);
    }
  }

  // Save updated database
  if (updatedCount > 0) {
    console.log(`💾 Saving updated database with ${updatedCount} changes...`);
    writeFileSync(databasePath, JSON.stringify(database, null, 2));
    console.log('✅ Database saved successfully!\n');
  } else {
    console.log('ℹ️ No updates needed, database unchanged.\n');
  }

  // Summary report
  console.log('📊 Sync Summary:');
  console.log(`  Total GPUs processed: ${processedCount}`);
  console.log(`  Successfully updated: ${updatedCount}`);
  console.log(`  Errors/No data: ${errorCount}`);
  console.log(`  Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);

  // Show updated GPUs
  const updatedGPUs = results.filter(r => r.updated);
  if (updatedGPUs.length > 0) {
    console.log('\n🔄 Updated GPUs:');
    updatedGPUs.forEach(result => {
      console.log(`  • ${result.name}: ${result.oldVRAM}MB → ${result.newVRAM}MB`);
    });
  }

  // Show problematic GPUs
  const problemGPUs = results.filter(r => r.newVRAM === 0);
  if (problemGPUs.length > 0) {
    console.log('\n⚠️ GPUs with no TechPowerUp data:');
    problemGPUs.slice(0, 10).forEach(result => {
      console.log(`  • ${result.name} (searched: "${result.searchName}")`);
    });
    if (problemGPUs.length > 10) {
      console.log(`  ... and ${problemGPUs.length - 10} more`);
    }
  }

  console.log('\n✨ Sync completed!');
}

// Run the sync if this script is executed directly
if (import.meta.main) {
  syncNvidiaVRAM().catch(console.error);
}
