// main.ts - Build script that hands in the compiled game package and dossier for evaluation
// It packages the web application assets and generates a compliance dossier into the target directory.

import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

console.log(`Building Vault Break to ${outputDir}...`);

// Ensure output directories exist
mkdirSync(outputDir, { recursive: true });
mkdirSync(join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });

// Copy game/ and screenshots/
cpSync(resolve('game'), join(outputDir, 'game'), { recursive: true });
if (existsSync(resolve('screenshots'))) {
  cpSync(resolve('screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build dossier
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});

const dossierPath = join(outputDir, 'dossier.json');
await import('node:fs/promises').then(fs => fs.writeFile(dossierPath, dossierBytes));

console.log('Build completed successfully. Dossier written.');
