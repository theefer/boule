import path from "path";
import alias from "rollup-plugin-alias";
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import config from 'sapper/config/rollup.js';
import sveltePreprocess from 'svelte-preprocess';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;
const sourcemap = dev ? "inline" : false;

const onwarn = (warning, onwarn) =>
	(warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
	(warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
      onwarn(warning);

const dedupe = importee =>
    importee === "svelte" || importee.startsWith("svelte/");

const aliases = () => ({
    resolve: [".svelte", ".js", ".scss", ".css"],
    entries: [{
            find: /^@smui\/([^\/]+)$/,
            replacement: path.resolve(
                __dirname,
                "node_modules",
                "@smui",
                "$1",
                "index.js"
            )
        },
        {
            find: /^@smui\/([^\/]+)\/(.*)$/,

            replacement: path.resolve(__dirname, "node_modules", "@smui", "$1", "$2")
        }
    ]
});

const postcssOptions = () => ({
	extensions: [".scss", ".sass"],
	extract: false,
	minimize: true,
	use: [
		['sass', {
			includePaths: [
				'./src/theme',
				'./node_modules',
				// This is only needed because we're using a local module. :-/
				// Normally, you would not need this line.
				path.resolve(__dirname, "..", "node_modules")
			],
		}],
	],
});

const preprocess = [
  // sveltePreprocess({ defaults: {script: 'typescript'} }),
  // sveltePreprocess(
  //   {
  // babel: {
  //   presets: [
  //     [
  //       '@babel/preset-env',
  //       {
  //         loose: true,
  //         // No need for babel to resolve modules
  //         modules: false,
  //         targets: {
  //           // ! Very important. Target es6+
  //           esmodules: true,
  //         },
  //       },
  //     ],
  //   ],
  // },
  // }
  // ),
  sveltePreprocess(),
];

export default {
	client: {
		input: config.client.input().replace(/\.js$/, '.ts'),
		output: config.client.output(),
		plugins: [
			alias(aliases()),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				dev,
				hydratable: true,
				emitCss: true,
                          preprocess: sveltePreprocess(),
			}),
			resolve({
				browser: true,
				dedupe,
			}),
			commonjs(),
		  typescript({ sourceMap: dev }),
			postcss(postcssOptions()),

			legacy && babel({
			  extensions: ['.js', '.mjs', '.html', '.svelte', '.ts'],
				babelHelpers: 'runtime',
				exclude: ['node_modules/@babel/**'],
				presets: [
					['@babel/preset-env', {
						targets: '> 0.25%, not dead'
					}]
				],
				plugins: [
					'@babel/plugin-syntax-dynamic-import',
					['@babel/plugin-transform-runtime', {
						useESModules: true
					}]
				]
			}),

			!dev && terser({
				module: true
			})
		],

		preserveEntrySignatures: false,
		onwarn,
	},

	server: {
		input: config.server.input().server.replace(/\.js$/, '.ts'),
		output: config.server.output(),
		plugins: [
			alias(aliases()),
			replace({
				'process.browser': false,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				generate: 'ssr',
                          preprocess: sveltePreprocess(),
				dev,
			}),
			resolve({
				dedupe,
			}),
			commonjs(),
			typescript({ sourceMap: dev }),
			postcss(postcssOptions()),
		],
		external: Object.keys(pkg.dependencies).concat(
			require('module').builtinModules || Object.keys(process.binding('natives'))
		),

		preserveEntrySignatures: 'strict',
		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input().replace(/\.js$/, '.ts'),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			commonjs(),
			typescript({ sourceMap: dev }),
			!dev && terser()
		],

		preserveEntrySignatures: false,
		onwarn,
	}
};
