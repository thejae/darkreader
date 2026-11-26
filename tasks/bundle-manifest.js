// @ts-check
import {getDestDir, absolutePath} from './paths.js';
import {PLATFORM} from './platform.js';
import * as reload from './reload.js';
import {createTask} from './task.js';
import {readJSON, writeJSON} from './utils.js';
import {getExtensionVersion} from './version.js';

// Debug builds use a dev-only version so they never look like a release.
const DEBUG_VERSION = '1';

async function patchManifest(platform, debug, watch, test) {
    const isMV2 = platform === PLATFORM.CHROMIUM_MV2 || platform === PLATFORM.CHROMIUM_MV2_PLUS;
    const isMV3 = platform === PLATFORM.CHROMIUM_MV3 || platform === PLATFORM.CHROMIUM_MV3_PLUS;
    const isPlus = platform === PLATFORM.CHROMIUM_MV2_PLUS || platform === PLATFORM.CHROMIUM_MV3_PLUS;

    const manifest = await readJSON(absolutePath('src/manifest.json'));
    const manifestPatch = isMV2 ? {} : await readJSON(absolutePath(`src/manifest-${platform.replace('-plus', '')}.json`));
    const manifestExtras = isPlus ? await readJSON(absolutePath(`src/plus/manifest.json`)) : {};
    const patched = {...manifest, ...manifestPatch, ...manifestExtras};
    // Version has a single source of truth (package.json) and is written here
    // for every platform, so a release cannot ship a stale manifest version.
    patched.version = debug ? DEBUG_VERSION : await getExtensionVersion();
    if (debug && isMV3) {
        patched.name = isPlus ? 'Dark Reader MV3 Plus' : 'Dark Reader MV3';
    }
    if (isMV3) {
        patched.browser_action = undefined;
    }
    if (debug) {
        patched.description = `Debug build, platform: ${platform}, watch: ${watch ? 'yes' : 'no'}.`;
    }
    if (debug && !test && isMV3) {
        patched.permissions.push('tabs');
    }
    if (debug && (isMV2 || isMV3)) {
        patched.version_name = isPlus ? 'Debug Plus' : 'Debug';
    }
    // Needed to test settings export and CSS theme export via a download
    if (test || debug) {
        patched.permissions.push('downloads');
    }
    return patched;
}

async function manifests({platforms, debug, watch, test}) {
    const enabledPlatforms = Object.values(PLATFORM).filter((platform) => platform !== PLATFORM.API && platforms[platform]);
    for (const platform of enabledPlatforms) {
        const manifest = await patchManifest(platform, debug, watch, test);
        const destDir = getDestDir({debug, platform});
        await writeJSON(`${destDir}/manifest.json`, manifest);
    }
}

const bundleManifestTask = createTask(
    'bundle-manifest',
    manifests,
).addWatcher(
    ['src/manifest*.json'],
    async (changedFiles, _, buildPlatforms) => {
        const chrome = changedFiles.some((file) => file.endsWith('manifest.json'));
        const platforms = {};
        for (const platform of Object.values(PLATFORM)) {
            const changed = chrome || changedFiles.some((file) => file.endsWith(`manifest-${platform.replace('-plus', '')}.json`));
            platforms[platform] = changed && buildPlatforms[platform];
        }
        await manifests({platforms, debug: true, watch: true, test: false});
        reload.reload({type: reload.FULL});
    },
);

export default bundleManifestTask;
