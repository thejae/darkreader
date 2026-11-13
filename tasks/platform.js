// @ts-check

export const PLATFORM = {
    API: /** @type {const} */('api'),
    CHROMIUM_MV2: /** @type {const} */('chrome'),
    CHROMIUM_MV2_PLUS: /** @type {const} */('chrome-plus'),
    CHROMIUM_MV3: /** @type {const} */('chrome-mv3'),
    CHROMIUM_MV3_PLUS: /** @type {const} */('chrome-mv3-plus'),
    EDGE: /** @type {const} */('edge'),
    FIREFOX_MV2: /** @type {const} */('firefox'),
    FIREFOX_MV3: /** @type {const} */('firefox-mv3'),
    THUNDERBIRD: /** @type {const} */('thunderbird'),
};

/**
 * Edge builds the Chromium MV3 codebase, so every MV3 code path applies to it.
 * @param {string} platform
 * @returns {boolean}
 */
export const isChromiumMV3 = (platform) =>
    platform === PLATFORM.CHROMIUM_MV3 ||
    platform === PLATFORM.CHROMIUM_MV3_PLUS ||
    platform === PLATFORM.EDGE;

/**
 * @param {string} platform
 * @returns {boolean}
 */
export const isPlus = (platform) =>
    platform === PLATFORM.CHROMIUM_MV2_PLUS ||
    platform === PLATFORM.CHROMIUM_MV3_PLUS;
