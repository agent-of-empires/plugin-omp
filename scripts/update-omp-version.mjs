import { readFile, writeFile } from "node:fs/promises";

const [mode, version] = process.argv.slice(2);
if (!['check', 'apply'].includes(mode) || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  throw new Error('Usage: node scripts/update-omp-version.mjs <check|apply> <stable-version>');
}

const manifestPath = 'aoe-plugin.toml';
const packagePath = 'omp-extension/package.json';
const manifest = await readFile(manifestPath, 'utf8');
const packageText = await readFile(packagePath, 'utf8');
const manifestLine = manifest.match(/^provider_versions = \[(.*)\]$/m);
const packageLine = packageText.match(/^(\s*"@oh-my-pi\/pi-coding-agent": ")([^"]+)(")$/m);
if (!manifestLine || !packageLine) throw new Error('Cannot find unique provider allowlists');
const manifestHas = manifestLine[1].split(', ').includes(`"=${version}"`);
const packageHas = packageLine[2].split(' || ').includes(`=${version}`);
if (manifestHas !== packageHas) throw new Error('Provider allowlists disagree');
if (manifestHas) {
  console.log('supported');
} else if (mode === 'check') {
  console.log('update');
} else {
  const updatedManifest = manifest.replace(manifestLine[0], `provider_versions = [${manifestLine[1]}, "=${version}"]`);
  const updatedPackage = packageText.replace(packageLine[0], `${packageLine[1]}${packageLine[2]} || =${version}${packageLine[3]}`);
  await writeFile(manifestPath, updatedManifest);
  await writeFile(packagePath, updatedPackage);
  console.log('updated');
}
