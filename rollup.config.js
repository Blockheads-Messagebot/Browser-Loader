import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import babel from 'rollup-plugin-babel'
import string from 'rollup-plugin-string'

export default {
    input: 'src/index.ts',
    output: {
        file: 'bundle.js',
        format: 'iife'
    },
    plugins: [
        resolve(),
        commonjs(),
        string({ include: '**/*.html' }),
        typescript(),
        babel()
    ],
}