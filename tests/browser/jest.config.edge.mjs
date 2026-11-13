// @ts-check

import config from './jest.config.mjs';
config.globals.product = 'edge';
config.globals.__CHROMIUM_MV2__ = false;
config.globals.__CHROMIUM_MV3__ = true;
export default config;
