#!/usr/bin/env node

/**
 * Icon Generation Script for AllyTZ Panel Mobile App
 * 
 * Generates all required app icons from a source logo:
 * - icon.png (1024x1024) - Main app icon
 * - adaptive-icon.png (1024x1024) - Android adaptive icon with safe zone
 * - splash-icon.png (1024x1024) - Splash screen icon
 * - favicon.png (48x48) - Web favicon
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_LOGO = path.join(__dirname, '../../public/assets/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../assets');
const BRAND_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcon(inputPath, outputPath, size, options = {}) {
  const { padding = 0, backgroundColor = null, safeZone = false } = options;
  
  try {
    let image = sharp(inputPath);
    
    // Resize to fit within safe area if needed
    const safeSize = safeZone ? Math.floor(size * 0.8) : size;
    const actualSize = size - (padding * 2);
    
    image = image.resize(safeSize, safeSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
    
    // Create canvas with background
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: backgroundColor || { r: 0, g: 0, b: 0, alpha: 1 }
      }
    });
    
    // Composite the resized image onto the canvas
    const imageBuffer = await image.png().toBuffer();
    const metadata = await sharp(imageBuffer).metadata();
    
    // Center the image
    const left = Math.floor((size - metadata.width) / 2);
    const top = Math.floor((size - metadata.height) / 2);
    
    await canvas
      .composite([{
        input: imageBuffer,
        left,
        top
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
    throw error;
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating app icons for AllyTZ Panel...\n');
  
  // Check if source logo exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found at: ${SOURCE_LOGO}`);
    console.error('Please ensure public/assets/logo.png exists');
    process.exit(1);
  }
  
  try {
    fs.copyFileSync(SOURCE_LOGO, path.join(OUTPUT_DIR, 'logo.png'));
    console.log('✅ Copied: logo.png (in-app branding)');

    // 1. Main app icon (1024x1024)
    await generateIcon(
      SOURCE_LOGO,
      path.join(OUTPUT_DIR, 'icon.png'),
      1024,
      { backgroundColor: BRAND_COLORS.white }
    );
    
    // 2. Android adaptive icon (1024x1024) - With safe zone (80% of size)
    await generateIcon(
      SOURCE_LOGO,
      path.join(OUTPUT_DIR, 'adaptive-icon.png'),
      1024,
      { 
        backgroundColor: BRAND_COLORS.white,
        safeZone: true
      }
    );
    
    // 3. Splash screen icon (1024x1024)
    await generateIcon(
      SOURCE_LOGO,
      path.join(OUTPUT_DIR, 'splash-icon.png'),
      1024,
      { backgroundColor: BRAND_COLORS.white }
    );
    
    // 4. Favicon (48x48)
    await generateIcon(
      SOURCE_LOGO,
      path.join(OUTPUT_DIR, 'favicon.png'),
      48,
      { backgroundColor: BRAND_COLORS.white }
    );
    
    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log('\n📋 Generated files:');
    console.log('  - icon.png (1024x1024) - Main app icon');
    console.log('  - adaptive-icon.png (1024x1024) - Android adaptive icon');
    console.log('  - splash-icon.png (1024x1024) - Splash screen');
    console.log('  - favicon.png (48x48) - Web favicon');
    
  } catch (error) {
    console.error('\n❌ Failed to generate icons:', error);
    process.exit(1);
  }
}

// Run the generator
generateAllIcons();
