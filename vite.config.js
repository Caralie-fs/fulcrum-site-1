import { defineConfig } from 'vite'
import { resolve } from 'path'
import { existsSync } from 'fs'

const directoryTrailingSlash = () => ({
  name: 'directory-trailing-slash',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [pathname, query] = (req.url || '/').split('?')
      if (pathname !== '/' && !pathname.endsWith('/') && !pathname.includes('.')) {
        const indexPath = resolve(__dirname, '.' + pathname, 'index.html')
        if (existsSync(indexPath)) {
          res.writeHead(301, { Location: pathname + '/' + (query ? '?' + query : '') })
          res.end()
          return
        }
      }
      next()
    })
  },
})

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: './',
  plugins: [directoryTrailingSlash()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        survey: resolve(__dirname, 'survey/index.html'),
        fellowship: resolve(__dirname, 'fellowship/index.html'),
        fellowshipApply: resolve(__dirname, 'fellowship/apply/index.html'),
        partnerships: resolve(__dirname, 'partnerships/index.html'),
        gathering: resolve(__dirname, 'gathering/index.html'),
        grants: resolve(__dirname, 'grants/index.html'),
        grantsFulcrum: resolve(__dirname, 'grants/fulcrum/index.html'),
        grantsTranslation: resolve(__dirname, 'grants/translation/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
})
