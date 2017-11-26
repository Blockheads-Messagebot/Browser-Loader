import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import string from 'rollup-plugin-string'

// Build notes:
// Ignore the warnings about the 'crypto' module, it isn't used.

export default {
    input: 'src/index.ts',
    output: {
        file: 'bundle.js',
        format: 'iife'
    },
    plugins: [
        resolve(),
        string({ include: '**/*.html' }),
        typescript(),
    ]
}
