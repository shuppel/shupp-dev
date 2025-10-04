#!/usr/bin/env node
/* eslint-env node */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SITE_URL = process.env.SITE_URL || 'https://shuppdev.netlify.app';
const SCREENSHOT_API_KEY = process.env.SCREENSHOT_MACHINE_API_KEY;

// Pages to capture
const PAGES_TO_CAPTURE = [
  { path: '/', name: 'home' },
  { path: '/portfolio', name: 'portfolio' },
  { path: '/blog', name: 'blog' },
  { path: '/tools', name: 'tools' },
  { path: '/about', name: 'about' },
  { path: '/thoughtful-app-co', name: 'thoughtful-apps' }
];

async function captureScreenshot(url, outputPath) {
  if (!SCREENSHOT_API_KEY) {
    console.error('SCREENSHOT_MACHINE_API_KEY not found in environment');
    return false;
  }

  try {
    const screenshotUrl = `https://api.screenshotmachine.com/?key=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&device=desktop&dimension=1200x800&format=png&cacheLimit=0`;
    
    console.log(`Capturing screenshot for ${url}...`);
    
    const response = await fetch(screenshotUrl);
    
    if (!response.ok) {
      const errorHeader = response.headers.get('X-Screenshotmachine-Response');
      console.error(`Screenshot failed for ${url}: ${errorHeader || response.statusText}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`Screenshot saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // Check if URL is localhost
    const isLocalhost = SITE_URL.includes('localhost') || SITE_URL.includes('127.0.0.1');
    
    if (isLocalhost) {
      console.log('⚠️  Cannot capture screenshots of localhost URLs with Screenshot Machine API');
      console.log('💡 Deploy to a public URL or use production site for screenshot capture');
      console.log(`🌐 Current URL: ${SITE_URL}`);
      return;
    }

    // Get current commit hash
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const shortHash = commitHash.substring(0, 7);
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`Capturing screenshots for commit: ${shortHash}`);
    console.log(`🌐 Site URL: ${SITE_URL}`);
    
    // Create screenshots directory structure
    const screenshotsDir = join(process.cwd(), 'screenshots');
    const commitDir = join(screenshotsDir, `${timestamp}-${shortHash}`);
    
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
    }
    
    if (!existsSync(commitDir)) {
      mkdirSync(commitDir, { recursive: true });
    }

    // Capture screenshots for each page
    const results = [];
    for (const page of PAGES_TO_CAPTURE) {
      const url = `${SITE_URL}${page.path}`;
      const outputPath = join(commitDir, `${page.name}.png`);
      
      const success = await captureScreenshot(url, outputPath);
      results.push({ page: page.name, url, success });
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create metadata file
    const metadata = {
      commit: commitHash,
      shortHash,
      timestamp: new Date().toISOString(),
      site_url: SITE_URL,
      pages: results
    };
    
    writeFileSync(
      join(commitDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );

    // Create latest symlink
    const latestPath = join(screenshotsDir, 'latest');
    try {
      if (existsSync(latestPath)) {
        execSync(`rm -f "${latestPath}"`);
      }
      execSync(`ln -sf "${commitDir}" "${latestPath}"`);
    } catch (error) {
      console.warn('Could not create latest symlink:', error.message);
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\nScreenshot capture complete: ${successCount}/${results.length} successful`);
    console.log(`Screenshots saved to: ${commitDir}`);
    
    if (successCount < results.length) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Screenshot capture failed:', error.message);
    process.exit(1);
  }
}

main();