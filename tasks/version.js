// @ts-check
import fs from 'node:fs';

const PACKAGE_MANIFEST = new URL('../package.json', import.meta.url);

// Both Chrome and Firefox require one to four dot-separated integers without
// leading zeros, each in the 0-65535 range. Chrome rejects anything else at
// upload time, so catch it during the build instead.
const VERSION_PATTERN = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/;
const MAX_VERSION_PART = 65535;

/**
 * @param {string} version
 * @returns {string} The same version, when valid.
 */
export function assertExtensionVersion(version) {
    const parts = VERSION_PATTERN.test(version) ? version.split('.').map(Number) : null;
    if (!parts || parts.some((part) => part > MAX_VERSION_PART)) {
        throw new Error(`Invalid extension version "${version}" in package.json: expected one to four dot-separated integers in the 0-${MAX_VERSION_PART} range without leading zeros`);
    }
    return version;
}

/**
 * The extension version is declared once, in package.json. Manifests are
 * generated from it during the build, so a release cannot ship a stale or
 * platform-specific version.
 *
 * @returns {Promise<string>}
 */
export async function getExtensionVersion() {
    const file = await fs.promises.readFile(PACKAGE_MANIFEST, {encoding: 'utf-8'});
    const {version} = JSON.parse(file);
    return assertExtensionVersion(version);
}
