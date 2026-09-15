import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  console.log('[SCORM Package] Cleaning old dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

console.log('[SCORM Package] Building Vite bundle...');
execSync('npm run build', { stdio: 'inherit' });

const scormStageDir = path.join(distDir, 'scorm_package');

// Prepare staging directory dist/scorm_package
if (fs.existsSync(scormStageDir)) {
  fs.rmSync(scormStageDir, { recursive: true, force: true });
}
fs.mkdirSync(scormStageDir, { recursive: true });

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Move built dist items into dist/scorm_package (excluding scorm_package itself)
const distEntries = fs.readdirSync(distDir);
distEntries.forEach(entry => {
  if (entry === 'scorm_package') return;
  const srcPath = path.join(distDir, entry);
  const destPath = path.join(scormStageDir, entry);
  fs.renameSync(srcPath, destPath);
});

console.log('[SCORM Package] Copying imsmanifest.xml to SCORM package...');
const manifestSrc = path.join(process.cwd(), 'scorm', 'imsmanifest.xml');
const manifestDist = path.join(scormStageDir, 'imsmanifest.xml');
fs.copyFileSync(manifestSrc, manifestDist);

console.log('[SCORM Package] Copying data JSON files to src/data...');
const jsonDistDir = path.join(scormStageDir, 'src', 'data');
fs.mkdirSync(jsonDistDir, { recursive: true });

const dataFiles = fs.readdirSync(path.join(process.cwd(), 'src', 'data'));
dataFiles.forEach(file => {
  fs.copyFileSync(
    path.join(process.cwd(), 'src', 'data', file),
    path.join(jsonDistDir, file)
  );
});

console.log('[SCORM Package] Copying public images to assets/images...');
const publicImagesSrc = path.join(process.cwd(), 'public', 'assets', 'images');
const distImagesDest = path.join(scormStageDir, 'assets', 'images');
copyDirRecursive(publicImagesSrc, distImagesDest);

console.log('[SCORM Package] Creating scorm_package.zip...');

try {
  // Compress contents of dist/scorm_package so imsmanifest.xml is at the root of the ZIP file
  execSync('powershell -Command "Compress-Archive -Path dist\\scorm_package\\* -DestinationPath scorm_package.zip -Force"', { stdio: 'inherit' });
  console.log('[SCORM Package] scorm_package.zip generated successfully!');
} catch (err) {
  console.error('[SCORM Package] Failed to zip package:', err.message);
}

console.log('[SCORM Package] Syncing to workspace scorm_package folder...');
const rootScormPkgDir = path.join(process.cwd(), 'scorm_package');
copyDirRecursive(scormStageDir, rootScormPkgDir);

console.log('[SCORM Package] Build output ready in scorm_package.zip!');
console.log('[SCORM Package] Upload scorm_package.zip directly to KLC2 LMS.');
