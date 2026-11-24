import { createPortal } from 'react-dom'

/** Dibuja su contenido directamente en <body>, por encima de cabecera y menú. */
export function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body)
}
