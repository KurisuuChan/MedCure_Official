#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks if the production build is properly configured to avoid React errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying production build configuration...\n');

const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist folder not found. Run `npm run build` first.');
  process.exit(1);
}

console.log('✅ dist folder exists');

// Check if assets folder exists
if (!fs.existsSync(assetsPath)) {
  console.error('❌ Error: dist/assets folder not found.');
  process.exit(1);
}

console.log('✅ dist/assets folder exists');

// Read all JS files in assets
const files = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));

console.log(`\n📦 Found ${files.length} JavaScript chunks:\n`);

// Categorize chunks
const chunks = {
  vendorReact: [],
  vendorOther: [],
  appComponentsUi: [],
  appOther: [],
  index: []
};

files.forEach(file => {
  const size = fs.statSync(path.join(assetsPath, file)).size;
  const sizeKB = (size / 1024).toFixed(2);
  
  if (file.includes('vendor-react')) {
    chunks.vendorReact.push({ file, size: sizeKB });
  } else if (file.includes('vendor-')) {
    chunks.vendorOther.push({ file, size: sizeKB });
  } else if (file.includes('app-components-ui')) {
    chunks.appComponentsUi.push({ file, size: sizeKB });
  } else if (file.includes('app-')) {
    chunks.appOther.push({ file, size: sizeKB });
  } else if (file.includes('index-')) {
    chunks.index.push({ file, size: sizeKB });
  }
});

// Display React vendor chunk
if (chunks.vendorReact.length > 0) {
  console.log('✅ React Vendor Chunk:');
  chunks.vendorReact.forEach(({ file, size }) => {
    console.log(`   ${file} (${size} KB)`);
  });
} else {
  console.log('⚠️  Warning: No vendor-react chunk found');
}

// Check for problematic app-components-ui chunk
if (chunks.appComponentsUi.length > 0) {
  console.log('\n❌ PROBLEM DETECTED: app-components-ui chunk exists!');
  console.log('   This can cause React to be undefined in components.');
  chunks.appComponentsUi.forEach(({ file, size }) => {
    console.log(`   ${file} (${size} KB)`);
  });
  console.log('\n   Solution: The chunk splitting configuration should be simplified.');
  console.log('   Components should be in the main index chunk, not split separately.');
} else {
  console.log('\n✅ No problematic app-components-ui chunk found');
  console.log('   Components are properly bundled with the main app code.');
}

// Display index chunk
if (chunks.index.length > 0) {
  console.log('\n📄 Main Application Chunk:');
  chunks.index.forEach(({ file, size }) => {
    console.log(`   ${file} (${size} KB)`);
  });
}

// Display other chunks
if (chunks.vendorOther.length > 0) {
  console.log('\n📚 Other Vendor Chunks:');
  chunks.vendorOther.forEach(({ file, size }) => {
    console.log(`   ${file} (${size} KB)`);
  });
}

if (chunks.appOther.length > 0) {
  console.log('\n🎯 Other App Chunks:');
  chunks.appOther.forEach(({ file, size }) => {
    console.log(`   ${file} (${size} KB)`);
  });
}

// Final verdict
console.log('\n' + '='.repeat(60));
if (chunks.appComponentsUi.length === 0 && chunks.vendorReact.length > 0) {
  console.log('✅ BUILD CONFIGURATION IS CORRECT!');
  console.log('   Safe to deploy to Vercel.');
} else {
  console.log('❌ BUILD CONFIGURATION NEEDS FIXING!');
  console.log('   Review vite.config.js chunk splitting settings.');
}
console.log('='.repeat(60) + '\n');
