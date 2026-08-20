/**
 * tranz-video - Production & Development Build Script
 * High-performance concurrent bundler powered by esbuild.
 */

import * as esbuild from 'esbuild';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, watch } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

const isWatch = process.argv.includes('--watch');
const isProd = process.argv.includes('--prod') || (!isWatch && process.env.NODE_ENV === 'production');

/**
 * Copies all static assets from root to dist/
 */
function copyStaticAssets() {
  mkdirSync(distDir, { recursive: true });

  const staticFiles = [
    'manifest.json',
    'options.html',
    'popup.html',
    'styles.css'
  ];

  for (const file of staticFiles) {
    const src = resolve(rootDir, file);
    const dest = resolve(distDir, file);
    if (existsSync(src)) {
      copyFileSync(src, dest);
    }
  }

  const staticDirs = ['icons'];
  for (const dir of staticDirs) {
    const src = resolve(rootDir, dir);
    const dest = resolve(distDir, dir);
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true });
    }
  }

  console.log('[build] Static assets synchronized to dist/');
}

/**
 * Common esbuild options
 */
const commonOptions = {
  bundle: true,
  minify: isProd,
  sourcemap: !isProd ? 'inline' : false,
  target: ['chrome110'],
  logLevel: 'info',
  treeShaking: true,
  legalComments: 'none'
};

async function buildAll() {
  const startTime = Date.now();
  console.log(`[build] Starting ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} build...`);

  copyStaticAssets();

  // 1. Build Background Service Worker (ESM format)
  const bgBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, 'src/background.ts')],
    outfile: resolve(distDir, 'background.js'),
    format: 'esm'
  });

  // 2. Build Content Script (IIFE format for hermetic isolation in page context)
  const contentBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, 'src/content.ts')],
    outfile: resolve(distDir, 'content.js'),
    format: 'iife'
  });

  // 3. Build Options Page (ESM format)
  const optionsBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, 'src/options.ts')],
    outfile: resolve(distDir, 'options.js'),
    format: 'esm'
  });

  // 4. Build Popup (ESM format)
  const popupBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, 'src/popup.ts')],
    outfile: resolve(distDir, 'popup.js'),
    format: 'esm'
  });

  await Promise.all([bgBuild, contentBuild, optionsBuild, popupBuild]);

  const elapsed = Date.now() - startTime;
  console.log(`[build] ✓ Extension built successfully in ${elapsed}ms -> dist/`);
}

async function startWatch() {
  console.log('[build] Starting watch mode...');
  copyStaticAssets();

  const contexts = await Promise.all([
    esbuild.context({
      ...commonOptions,
      entryPoints: [resolve(rootDir, 'src/background.ts')],
      outfile: resolve(distDir, 'background.js'),
      format: 'esm'
    }),
    esbuild.context({
      ...commonOptions,
      entryPoints: [resolve(rootDir, 'src/content.ts')],
      outfile: resolve(distDir, 'content.js'),
      format: 'iife'
    }),
    esbuild.context({
      ...commonOptions,
      entryPoints: [resolve(rootDir, 'src/options.ts')],
      outfile: resolve(distDir, 'options.js'),
      format: 'esm'
    }),
    esbuild.context({
      ...commonOptions,
      entryPoints: [resolve(rootDir, 'src/popup.ts')],
      outfile: resolve(distDir, 'popup.js'),
      format: 'esm'
    })
  ]);

  await Promise.all(contexts.map((ctx) => ctx.watch()));

  // Watch static files for updates
  const filesToWatch = ['manifest.json', 'options.html', 'popup.html', 'styles.css'];
  for (const file of filesToWatch) {
    const filePath = resolve(rootDir, file);
    if (existsSync(filePath)) {
      watch(filePath, () => {
        copyStaticAssets();
      });
    }
  }

  console.log('[build] Watching for source and asset changes. Press Ctrl+C to stop.');
}

if (isWatch) {
  startWatch().catch((err) => {
    console.error('[build] Watch error:', err);
    process.exit(1);
  });
} else {
  buildAll().catch((err) => {
    console.error('[build] Build failed:', err);
    process.exit(1);
  });
}
