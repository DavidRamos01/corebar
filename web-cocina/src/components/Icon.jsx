// Iconos de trazo simple (24×24). Sustituyen a los emojis; heredan el color del texto.
const PATHS = {
  inbox:   <><path d="M4 13l2-7h12l2 7" /><path d="M4 13v5h16v-5h-5a3 3 0 0 1-6 0H4z" /></>,
  flame:   <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z" />,
  check:   <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plate:   <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>,
  user:    <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  clock:   <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  alert:   <><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4M12 17v.5" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-4.5L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4.5L20 15" /><path d="M20 20v-5h-5" /></>,
  list:    <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></>,
  trash:   <><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13" /></>,
  close:   <path d="M6 6l12 12M18 6L6 18" />,
  undo:    <><path d="M9 7L4 12l5 5" /><path d="M4 12h10a6 6 0 0 1 6 6" /></>,
  ban:     <><circle cx="12" cy="12" r="8.5" /><path d="M6 18L18 6" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M12 8v4.5l3 1.8" /></>,
  box:     <><path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
  ticket:  <><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21V3z" /><path d="M9.5 11l2 2 3.5-4" /></>,
  lock:    <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  pot:     <><path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6z" /><path d="M2 10h2M20 10h2M9 6c0-1.5 1-1.5 1-3M14 6c0-1.5 1-1.5 1-3" /></>,
}

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
