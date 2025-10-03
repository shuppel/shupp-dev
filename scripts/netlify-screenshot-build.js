#!/usr/bin/env node

// Netlify build hook script for capturing screenshots after deployment
// This should be called from netlify.toml as a post-build step

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DEPLOY_URL = process.env.DEPLOY_URL || process.env.URL;
const SCREENSHOT_API_KEY = process.env.SCREENSHOT_MACHINE_API_KEY;

// Pages to capture (same as local script)
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
    console.log('SCREENSHOT_MACHINE_API_KEY not available - skipping screenshots');
    return false;
  }

  try {
    const screenshotUrl = `https://api.screenshotmachine.com/?key=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&device=desktop&dimension=1200x800&format=png&cacheLimit=0`;
    
    console.log(`📸 Capturing screenshot for ${url}...`);
    
    const response = await fetch(screenshotUrl);
    
    if (!response.ok) {
      const errorHeader = response.headers.get('X-Screenshotmachine-Response');
      console.error(`❌ Screenshot failed for ${url}: ${errorHeader || response.statusText}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`✅ Screenshot saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error capturing screenshot for ${url}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Netlify post-build: Starting screenshot capture...');
  
  if (!DEPLOY_URL) {
    console.log('⚠️  No DEPLOY_URL found - skipping screenshots');
    return;
  }

  if (!SCREENSHOT_API_KEY) {
    console.log('⚠️  SCREENSHOT_MACHINE_API_KEY not set - skipping screenshots');
    return;
  }

  try {
    // Get commit info from Netlify environment or git
    const commitHash = process.env.COMMIT_REF || 
                      (existsSync('.git') ? execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim() : 'unknown');
    const shortHash = commitHash.substring(0, 7);
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`📝 Deploy URL: ${DEPLOY_URL}`);
    console.log(`📝 Commit: ${shortHash}`);
    
    // Create screenshots directory in dist (will be published)
    const screenshotsDir = join(process.cwd(), 'dist', 'screenshots');
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
      const url = `${DEPLOY_URL}${page.path}`;
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
      deploy_url: DEPLOY_URL,
      context: process.env.CONTEXT || 'unknown',
      branch: process.env.BRANCH || 'unknown',
      pages: results
    };
    
    writeFileSync(
      join(commitDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );

    // Create latest.json index file
    const latestIndex = join(screenshotsDir, 'latest.json');
    writeFileSync(latestIndex, JSON.stringify(metadata, null, 2));

    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎉 Screenshot capture complete: ${successCount}/${results.length} successful`);
    console.log(`📁 Screenshots available at: /screenshots/${timestamp}-${shortHash}/`);
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
    // Don't fail the build if screenshots fail
  }
}

main();