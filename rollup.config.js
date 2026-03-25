import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const commonPlugins = [
  resolve({
    browser: false,
    preferBuiltins: true,
  }),
  commonjs({
    include: /node_modules/,
    requireReturnsDefault: 'auto',
  }),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    tsconfigOverride: { declaration: false },
    check: false,
    clean: true,
  }),
];

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.cjs.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: commonPlugins,
    external: [
      'axios',
      'js-sha3',
      'bs58',
      'big-integer',
      'int64-buffer',
      'ethers',
      '@noble/secp256k1',
      '@noble/hashes',
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.esm.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: commonPlugins,
    external: [
      'axios',
      'ethers',
      '@noble/secp256k1',
      '@noble/hashes',
    ],
  },
];