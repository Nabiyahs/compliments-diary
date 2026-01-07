#!/usr/bin/env node
/**
 * PWA Icon Generator for DayPat
 *
 * Generates app icons using SVG with Caveat font (embedded as path)
 * Creates: 512x512, 192x192, and 180x180 (apple-touch-icon) PNGs
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requirements: sharp (already installed as dev dependency)
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Icon sizes to generate
const SIZES = [
  { size: 512, filename: 'icons/daypat-512.png' },
  { size: 192, filename: 'icons/daypat-192.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
]

// Colors (matching DayPat theme)
const BG_COLOR = '#FFF8E7' // Warm cream background
const TEXT_COLOR = '#F97316' // Orange-500 (brand color)

/**
 * Generate SVG for DayPat icon
 * Using Google Fonts Caveat via @import in SVG
 */
function generateSVG(size) {
  const fontSize = Math.floor(size * 0.20)
  const y = size / 2 + fontSize * 0.1

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&amp;display=swap');
      .logo-text {
        font-family: 'Caveat', cursive;
        font-weight: 700;
        font-size: ${fontSize}px;
        fill: ${TEXT_COLOR};
      }
    </style>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" class="logo-text">DayPat</text>
</svg>`
}

async function generateIcon(size, outputPath) {
  const svg = generateSVG(size)
  const fullPath = path.join(__dirname, '..', 'public', outputPath)

  // Ensure directory exists
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(fullPath)
    console.log(`Generated: ${outputPath} (${size}x${size})`)
  } catch (error) {
    console.error(`Error generating ${outputPath}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('=== DayPat PWA Icon Generator ===\n')

  try {
    // Generate all icon sizes
    for (const { size, filename } of SIZES) {
      await generateIcon(size, filename)
    }

    console.log('\n=== All icons generated successfully! ===')
    console.log('\nFiles created:')
    console.log('  - public/icons/daypat-512.png')
    console.log('  - public/icons/daypat-192.png')
    console.log('  - public/apple-touch-icon.png')

  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

main()
