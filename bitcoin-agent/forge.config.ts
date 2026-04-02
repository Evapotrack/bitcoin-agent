import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// Native modules that webpack externalizes — must be copied to the packaged app
const nativeExternals = [
  'tiny-secp256k1',
  'keytar',
  'serialport',
  '@serialport',
  'cbor-x',
  '@anthropic-ai',
  'bip32',
  'bitcoinjs-lib',
  'ecpair',
  'axios',
  'bip39',
];

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: '{**/*.node,**/*.wasm}',
    },
    afterCopy: [
      // Copy externalized native modules into the packaged node_modules
      (buildPath: string, _electronVersion: string, _platform: string, _arch: string, callback: (err?: Error) => void) => {
        const fs = require('fs');
        const path = require('path');
        const srcModules = path.resolve(__dirname, 'node_modules');
        const destModules = path.join(buildPath, 'node_modules');

        function copyRecursive(src: string, dest: string) {
          if (!fs.existsSync(src)) return;
          const stat = fs.statSync(src);
          if (stat.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            for (const child of fs.readdirSync(src)) {
              copyRecursive(path.join(src, child), path.join(dest, child));
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        }

        fs.mkdirSync(destModules, { recursive: true });

        // Copy each externalized module and its dependencies
        for (const mod of nativeExternals) {
          const src = path.join(srcModules, mod);
          const dest = path.join(destModules, mod);
          if (fs.existsSync(src)) {
            copyRecursive(src, dest);
          }
        }

        // Also copy transitive dependencies needed by the externals
        const transitive = [
          'base-x', 'bs58', 'bs58check', 'bech32', 'varuint-bitcoin',
          'create-hash', 'create-hmac', 'cipher-base', 'inherits',
          'hash-base', 'md5.js', 'ripemd160', 'sha.js', 'safe-buffer',
          'randombytes', 'typeforce', 'wif', 'pushdata-bitcoin',
          'uint8array-tools', 'valibot',
          'follow-redirects', 'proxy-from-env', 'form-data', 'combined-stream',
          'delayed-stream', 'mime-types', 'mime-db',
          'node-addon-api', 'prebuild-install', 'node-gyp-build',
        ];

        for (const mod of transitive) {
          const src = path.join(srcModules, mod);
          const dest = path.join(destModules, mod);
          if (fs.existsSync(src) && !fs.existsSync(dest)) {
            copyRecursive(src, dest);
          }
        }

        callback();
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
