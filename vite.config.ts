import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: isDevelopment,
        // Optimize JSX runtime for production
        jsxRuntime: 'automatic'
      })
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    
    server: {
      port: 3000,
      host: true,
      cors: true,
      // Enable HMR optimizations
      hmr: {
        overlay: true
      }
    },
    
    build: {
      outDir: 'dist',
      // Optimized source map configuration
      sourcemap: isProduction ? 'hidden' : true,
      assetsDir: 'assets',
      // Enhanced Terser minification
      minify: 'terser',
      terserOptions: {
        compress: {
          // Advanced compression options
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          // Remove unused code
          dead_code: true,
          // Optimize conditionals
          conditionals: true,
          // Optimize comparisons
          comparisons: true,
          // Optimize sequences
          sequences: true,
          // Optimize properties
          properties: true,
          // Hoist function declarations
          hoist_funs: true,
          // Hoist variable declarations
          hoist_vars: false,
          // Join consecutive var statements
          join_vars: true,
          // Optimize loops
          loops: true,
          // Remove unreachable code
          unused: true,
          // Reduce variables
          reduce_vars: true,
          // Collapse single-use variables
          collapse_vars: true,
          // Optimize if-return and if-continue
          if_return: true,
          // Inline simple functions
          inline: 2,
          // Side effects optimization
          side_effects: true,
          // Passes for optimization
          passes: 2
        },
        mangle: {
          // Mangle properties for smaller bundles
          properties: {
            regex: /^_/
          },
          // Keep function names for better debugging
          keep_fnames: !isProduction,
          // Keep class names for better debugging
          keep_classnames: !isProduction
        },
        format: {
          // Remove comments in production
          comments: !isProduction,
          // Preserve annotations
          preserve_annotations: !isProduction
        }
      },
      
      // Enhanced rollup options
      rollupOptions: {
        // External dependencies (for library builds)
        external: [],
        
        // Input configuration
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        
        output: {
          // Optimized chunk file naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          
          // Optimized asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          
          // Entry file naming
          entryFileNames: `assets/js/[name]-[hash].js`,
          
          // Let Vite automatically handle chunk splitting for optimal performance
          manualChunks: undefined
        },
        
        // Enhanced warning handling
        onwarn(warning, warn) {
          // Suppress specific warnings for cleaner builds
          if (
            warning.code === 'UNRESOLVED_IMPORT' ||
            warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
            warning.code === 'EVAL' ||
            warning.code === 'CIRCULAR_DEPENDENCY' ||
            warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
            warning.message.includes('TypeScript') ||
            warning.message.includes('@rollup/rollup') ||
            warning.message.includes('Use of eval')
          ) {
            return;
          }
          warn(warning);
        },
        
        // Tree-shaking configuration
        treeshake: {
          moduleSideEffects: (id) => {
            // Preserve side effects for CSS and certain modules
            return id.includes('.css') || 
                   id.includes('polyfill') ||
                   id.includes('@capacitor');
          },
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      
      // Enhanced chunk size warning limit
      chunkSizeWarningLimit: 1000,
      
      // Disable compressed size reporting for faster builds
      reportCompressedSize: false,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Asset inlining threshold
      assetsInlineLimit: 4096,
      
      // Target modern browsers for better optimization
      target: 'es2022',
      
      // Enable CSS minification
      cssMinify: isProduction,
      
      // Write bundle to disk
      write: true,
      
      // Empty output directory before build
      emptyOutDir: true
    },
    
    // Enhanced dependency optimization
    optimizeDeps: {
      // Pre-bundle these dependencies
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'lucide-react',
        'framer-motion',
        'recharts',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'clsx',
        '@supabase/supabase-js',
        '@google/genai'
      ],
      
      // Exclude problematic dependencies
      exclude: [
        '@rollup/rollup-win32-x64-msvc',
        'fsevents'
      ],
      
      // Force optimization for specific dependencies
      force: isDevelopment,
      
      // ESBuild options for dependency optimization
      esbuildOptions: {
        target: 'es2022',
        supported: {
          'top-level-await': true
        }
      }
    },
    
    // Environment variable definitions
    define: {
      'process.env': JSON.stringify(env),
      '__DEV__': JSON.stringify(isDevelopment),
      '__PROD__': JSON.stringify(isProduction),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
    },
    
    // Enhanced ESBuild configuration
    esbuild: {
      target: 'es2022',
      // Drop console logs and debugger in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Minify identifiers in production
      minifyIdentifiers: isProduction,
      // Minify syntax in production
      minifySyntax: isProduction,
      // Minify whitespace in production
      minifyWhitespace: isProduction,
      // Legal comments handling
      legalComments: isProduction ? 'none' : 'inline',
      // JSX configuration
      jsx: 'automatic',
      // Source map configuration
      sourcemap: !isProduction,
      // Charset configuration
      charset: 'utf8'
    },
    
    // CSS configuration
    css: {
      // PostCSS configuration
      postcss: {
        plugins: []
      },
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCase'
      },
      // CSS preprocessing options
      preprocessorOptions: {
        scss: {
          additionalData: ''
        }
      },
      // Development source maps
      devSourcemap: isDevelopment
    },
    
    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      cors: true
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: []
    },
    
    // Experimental features
    experimental: {
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      }
    }
  };
});
