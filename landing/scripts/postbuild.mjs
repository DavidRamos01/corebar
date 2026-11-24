// Deja dist/index.html con un script clásico (defer) para que la página
// también se pueda abrir con doble clic (file://) además de servirla con Nginx.
import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../dist/index.html', import.meta.url)
const html = readFileSync(file, 'utf8')
  .replace('<script type="module" crossorigin src=', '<script defer src=')
  .replace('<link rel="stylesheet" crossorigin', '<link rel="stylesheet"')
writeFileSync(file, html)
console.log('dist/index.html listo')
