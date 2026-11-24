import { useCallback, useEffect, useRef, useState } from 'react'
import { COPY, Lang } from './i18n'
import { AUTHOR, AUTHORS, DEMO_ACCOUNT, LINKS } from './config'

/* hooks */

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, seen }
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('cb_lang')
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* sin almacenamiento */
  }
  return 'es'
}

/* piezas */

const STATE_VARS = ['--recibido', '--preparando', '--listo', '--cobrado']

function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`phone ${className}`}>
      <img src={src} alt={alt} width={560} height={1244} loading="lazy" decoding="async" />
    </div>
  )
}

function Laptop({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  return (
    <img
      className="laptop"
      src={src}
      alt={alt}
      width={1800}
      height={1034}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Corebar">
      <img src="./logo.png" alt="" width={36} height={36} />
      <span>Corebar</span>
    </a>
  )
}

/* página */

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = COPY[lang]
  const videoRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
    try {
      localStorage.setItem('cb_lang', lang)
    } catch {
      /* sin almacenamiento */
    }
  }, [lang, t])

  const openVideo = useCallback(() => videoRef.current?.showModal(), [])
  const closeVideo = useCallback(() => {
    const d = videoRef.current
    d?.close()
  }, [])

  return (
    <>
      <a className="skip" href="#main">
        {t.skip}
      </a>
      <Effects />
      <Nav lang={lang} setLang={setLang} />
      <main id="main">
        <Hero lang={lang} onVideo={openVideo} />
        <LiveOrder lang={lang} />
        <Stats lang={lang} />
        <Journey lang={lang} />
        <Apps lang={lang} />
        <Stack lang={lang} />
        <Demo lang={lang} />
        <About lang={lang} />
      </main>
      <Footer lang={lang} />
      {LINKS.videoId && (
        <VideoDialog dialogRef={videoRef} lang={lang} onClose={closeVideo} />
      )}
    </>
  )
}


/* efectos y animaciones extra */

function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    if (reduce) return
    root.classList.add('fx')

    // barra de progreso del scroll
    const bar = document.getElementById('fx-bar')
    const onScroll = () => {
      const h = root.scrollHeight - window.innerHeight
      if (bar) bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // foco de luz que sigue al cursor
    const glow = document.getElementById('fx-glow')
    const onMove = (e: PointerEvent) => {
      if (glow) {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
        glow.style.opacity = '1'
      }
    }
    window.addEventListener('pointermove', onMove)

    // aparición escalonada de los bloques
    const sel = [
      '.apps h2',
      '.app-row',
      '.app-col',
      '.stack-diagram > *',
      '.stack-list .group',
      '.demo-in > *',
      '.creds > *',
      '.about-in > *',
      '.journey-head > *',
    ].join(',')
    const els = Array.from(document.querySelectorAll<HTMLElement>(sel))
    els.forEach((el) => {
      const sibs = el.parentElement ? Array.from(el.parentElement.children) : []
      el.style.setProperty('--d', `${Math.max(0, sibs.indexOf(el)) * 90}ms`)
      el.setAttribute('data-reveal', '')
    })
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))

    // la pantalla del hero se inclina con el ratón
    const vis = document.querySelector<HTMLElement>('.hero-visual')
    const hero = document.querySelector<HTMLElement>('.hero')
    const tilt = (e: PointerEvent) => {
      if (!vis || !hero) return
      const r = hero.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      vis.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`)
      vis.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`)
    }
    hero?.addEventListener('pointermove', tilt)

    // parallax suave de las capturas en las secciones de apps
    const par = Array.from(document.querySelectorAll<HTMLElement>('.app-visual'))
    let raf = 0
    const parallax = () => {
      raf = 0
      const vh = window.innerHeight
      par.forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = (r.top + r.height / 2 - vh / 2) / vh
        el.style.setProperty('--py', `${(p * -28).toFixed(1)}px`)
      })
    }
    const onPar = () => {
      if (!raf) raf = requestAnimationFrame(parallax)
    }
    window.addEventListener('scroll', onPar, { passive: true })
    parallax()

    return () => {
      root.classList.remove('fx')
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onPar)
      hero?.removeEventListener('pointermove', tilt)
      io.disconnect()
    }
  }, [])
  return (
    <>
      <div id="fx-bar" aria-hidden="true" />
      <div id="fx-glow" aria-hidden="true" />
    </>
  )
}

function LiveOrder({ lang }: { lang: Lang }) {
  const steps = COPY[lang].journey.steps
  const { ref, seen } = useInView<HTMLDivElement>(0.4)
  const reduce = useMedia('(prefers-reduced-motion: reduce)')
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!seen || reduce) return
    const id = window.setInterval(() => setI((v) => (v + 1) % 5), 1900)
    return () => window.clearInterval(id)
  }, [seen, reduce])
  const at = reduce ? 3 : Math.min(i, 3)
  const label = lang === 'es' ? 'Así se mueve un pedido' : 'How an order moves'
  const table = lang === 'es' ? 'Mesa 4' : 'Table 4'
  return (
    <section className="live" aria-label={label}>
      <div className="wrap live-in" ref={ref}>
        <p className="live-label">{label}</p>
        <div className="live-track" style={{ ['--at' as string]: at }}>
          <div className="live-line">
            <span className="live-fill" />
          </div>
          <div className="live-token" aria-hidden="true">
            <b>{table}</b>
            <span>#128</span>
          </div>
          <ol>
            {steps.map((st, k) => (
              <li
                key={st.state}
                className={k <= at ? 'on' : ''}
                style={{ ['--c' as string]: `var(${STATE_VARS[k]})` }}
              >
                <i />
                <span>{st.state}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="live-cap" aria-live="off">
          {steps[at].title}
        </p>
      </div>
    </section>
  )
}

function Count({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    if (to === 0) {
      setN(0)
      return
    }
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setN(i)
      if (i >= to) window.clearInterval(id)
    }, 180)
    return () => window.clearInterval(id)
  }, [run, to])
  return <>{n}</>
}

function Stats({ lang }: { lang: Lang }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.5)
  const data =
    lang === 'es'
      ? [
          [4, 'estados de un pedido'],
          [3, 'aplicaciones'],
          [1, 'API compartida'],
          [0, 'llamadas a gritos'],
        ]
      : [
          [4, 'order states'],
          [3, 'apps'],
          [1, 'shared API'],
          [0, 'shouting across the room'],
        ]
  return (
    <section className="stats" aria-label={lang === 'es' ? 'Datos' : 'Facts'}>
      <div className="wrap stats-in" ref={ref}>
        {data.map(([n, label], i) => (
          <div key={label as string} className={seen ? 'is-in' : ''} style={{ ['--d' as string]: `${i * 120}ms` }}>
            <b>
              <Count to={n as number} run={seen} />
            </b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* nav */

function Nav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = COPY[lang].nav
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`nav ${solid ? 'is-solid' : ''}`}>
      <div className="wrap nav-in">
        <Brand />
        <nav className="nav-links" aria-label="Principal">
          <a href="#recorrido">{t.journey}</a>
          <a href="#apps">{t.apps}</a>
          <a href="#tecnologia">{t.stack}</a>
          <a href="#demo">{t.demo}</a>
        </nav>
        <div className="nav-tools">
          <div className="lang" role="group" aria-label={t.langLabel}>
            {(['es', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a
            className="icon-btn"
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.github}
          >
            <img src="./logos/github.svg" alt="" width={22} height={22} />
          </a>
        </div>
      </div>
    </header>
  )
}

/* hero */

function Hero({ lang, onVideo }: { lang: Lang; onVideo: () => void }) {
  const t = COPY[lang].hero
  return (
    <section className="hero" id="top" data-enter>
      <img className="hero-mark" src="./logo-bg.png" alt="" aria-hidden="true" width={800} height={800} />
      <div className="wrap hero-in">
        <div className="hero-text">
          <h1>
            {t.h1.map((line, i) => (
              <span className="line" key={line}>
                <span style={{ ['--i' as string]: i }}>{line}</span>
              </span>
            ))}
          </h1>
          <p className="lead">{t.lead}</p>
          <div className="actions">
            <a className="btn" href={LINKS.demoAdmin} target="_blank" rel="noopener noreferrer">
              {t.demo}
            </a>
            {LINKS.videoId ? (
              <button className="btn btn-line" type="button" onClick={onVideo}>
                {t.video}
              </button>
            ) : (
              <a
                className="btn btn-line"
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.code}
              </a>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <Laptop src="./img/mac-resumen.webp" alt={t.altDash} eager />
          <Phone className="hero-phone" src="./img/android-inicio.webp" alt={t.altPhone} />
        </div>
      </div>
    </section>
  )
}

/* recorrido del pedido */

function StepVisual({ i, lang }: { i: number; lang: Lang }) {
  const alt = COPY[lang].journey.alts[i]
  switch (i) {
    case 0:
      return <Phone src="./img/android-nota.webp" alt={alt} />
    case 1:
      return <Laptop src="./img/mac-cocina.webp" alt={alt} />
    case 2:
      return (
        <div className="phones">
          <Phone src="./img/android-notif.webp" alt={alt} />
          <Phone src="./img/android-cocina-listo.webp" alt="" />
        </div>
      )
    default:
      return <Laptop src="./img/mac-factura.webp" alt={alt} />
  }
}

function Journey({ lang }: { lang: Lang }) {
  const t = COPY[lang].journey
  const pinned = useMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
  const sectionRef = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    if (!pinned) return
    let raf = 0
    const calc = () => {
      raf = 0
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      setP(Math.min(1, Math.max(0, -r.top / total)))
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(calc)
    }
    calc()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pinned])

  const n = t.steps.length
  const active = Math.min(n - 1, Math.floor(p * n))

  const goTo = (i: number) => {
    const el = sectionRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const total = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + total * ((i + 0.5) / n), behavior: 'smooth' })
  }

  if (!pinned) {
    return (
      <section className="journey journey-static" id="recorrido" aria-labelledby="journey-h2">
        <div className="wrap">
          <h2 id="journey-h2">{t.h2}</h2>
          <p className="intro">{t.intro}</p>
          <ol className="static-steps">
            {t.steps.map((s, i) => (
              <li key={s.state} style={{ ['--st' as string]: `var(${STATE_VARS[i]})` }}>
                <div className="static-text">
                  <span className="chip">{s.state}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                <div className="static-visual">
                  <StepVisual i={i} lang={lang} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="journey journey-pinned"
      id="recorrido"
      aria-labelledby="journey-h2"
      style={{
        height: `${n * 95 + 40}vh`,
        ['--st' as string]: `var(${STATE_VARS[active]})`,
        ['--p' as string]: p,
      }}
    >
      <div className="pin">
        <div className="wrap pin-in">
          <div className="pin-text">
            <h2 id="journey-h2">{t.h2}</h2>
            <p className="intro">{t.intro}</p>
            <div className="rail" aria-hidden="true">
              <span className="rail-fill" />
              <span className="rail-token" />
            </div>
            <ol className="steps">
              {t.steps.map((s, i) => (
                <li
                  key={s.state}
                  className={i === active ? 'is-active' : ''}
                  style={{ ['--st' as string]: `var(${STATE_VARS[i]})` }}
                >
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === active ? 'step' : undefined}
                    aria-label={`${t.goTo} ${i + 1}: ${s.title}`}
                  >
                    <span className="chip">{s.state}</span>
                    <span className="step-title">{s.title}</span>
                  </button>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="stage">
            {t.steps.map((s, i) => (
              <div
                key={s.state}
                className={`stage-item ${i === active ? 'is-active' : ''}`}
                aria-hidden={i === active ? undefined : true}
              >
                <StepVisual i={i} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* aplicaciones */

function Apps({ lang }: { lang: Lang }) {
  const t = COPY[lang].apps
  return (
    <section className="apps" id="apps" aria-labelledby="apps-h2">
      <div className="wrap">
        <h2 id="apps-h2">{t.h2}</h2>

        <div className="app-row app-admin">
          <div className="app-text">
            <h3>{t.admin.name}</h3>
            <p className="who">{t.admin.who}</p>
            <ul>
              {t.admin.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
          <div className="app-visual">
            <Laptop src="./img/mac-productos.webp" alt={t.admin.alt} />
          </div>
        </div>

        <div className="app-pair">
          <div className="app-col">
            <div className="app-visual">
              <Laptop src="./img/mac-historial.webp" alt={t.kitchen.alt} />
            </div>
            <h3>{t.kitchen.name}</h3>
            <p className="who">{t.kitchen.who}</p>
            <ul>
              {t.kitchen.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
          <div className="app-col">
            <div className="app-visual phones">
              <Phone src="./img/android-mesas.webp" alt={t.android.altMap} />
              <Phone src="./img/android-inicio.webp" alt={t.android.altHome} />
            </div>
            <h3>{t.android.name}</h3>
            <p className="who">{t.android.who}</p>
            <ul>
              {t.android.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            {LINKS.apk && (
              <a className="btn btn-line" href={LINKS.apk} download>
                {t.apk}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* tecnología */

const LOGOS: Record<string, string> = {
  Kotlin: 'kotlin',
  'Jetpack Compose': 'android',
  React: 'react',
  TypeScript: 'typescript',
  Vite: 'vite',
  'Tailwind CSS': 'tailwindcss',
  Java: 'java',
  'Spring Boot': 'spring',
  MySQL: 'mysql',
  Docker: 'docker',
  Nginx: 'nginx',
  Ubuntu: 'ubuntu',
}

function Diagram({ lang, draw }: { lang: Lang; draw: boolean }) {
  const d = COPY[lang].stack.diagram
  const clients = [
    { y: 14, label: d.android, icon: './logos/android.svg' },
    { y: 124, label: d.kitchen, icon: './logos/react.svg' },
    { y: 234, label: d.admin, icon: './logos/react.svg' },
  ]
  return (
    <svg
      className={`diagram ${draw ? 'is-drawn' : ''}`}
      viewBox="0 0 720 380"
      role="img"
      aria-label={d.aria}
    >
      <rect className="srv" x="312" y="62" width="402" height="264" rx="18" />
      <text className="srv-label" x="332" y="90">
        {d.server}
      </text>

      {clients.map((c, i) => (
        <path
          key={c.y}
          className="wire"
          style={{ ['--k' as string]: i }}
          pathLength={1}
          d={`M246 ${c.y + 36} C 290 ${c.y + 36}, 306 190, 354 190`}
        />
      ))}
      <path className="wire" style={{ ['--k' as string]: 3 }} pathLength={1} d="M504 190 H 566" />

      {clients.map((c) => (
        <g key={c.y} className="node">
          <rect x="6" y={c.y} width="240" height="72" rx="14" />
          <image href={c.icon} x="22" y={c.y + 22} width="28" height="28" />
          <text x="62" y={c.y + 42}>
            {c.label}
          </text>
        </g>
      ))}

      <g className="node node-main">
        <rect x="354" y="140" width="150" height="100" rx="14" />
        <image href="./logos/spring.svg" x="372" y="172" width="36" height="36" />
        <text x="418" y="196">
          {d.api}
        </text>
      </g>
      <g className="node">
        <rect x="566" y="140" width="128" height="100" rx="14" />
        <image href="./logos/mysql.svg" x="580" y="172" width="36" height="36" />
        <text x="624" y="196">
          MySQL
        </text>
      </g>
    </svg>
  )
}

function Stack({ lang }: { lang: Lang }) {
  const t = COPY[lang].stack
  const { ref, seen } = useInView<HTMLDivElement>(0.4)
  return (
    <section className="stack" id="tecnologia" aria-labelledby="stack-h2">
      <div className="wrap stack-in">
        <div className="stack-diagram" ref={ref}>
          <h2 id="stack-h2">{t.h2}</h2>
          <p className="intro">{t.intro}</p>
          <Diagram lang={lang} draw={seen} />
        </div>
        <div className="stack-list">
          {t.groups.map((g) => (
            <div className="group" key={g.name}>
              <h3>{g.name}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it}>
                    <img src={`./logos/${LOGOS[it]}.svg`} alt="" width={26} height={26} loading="lazy" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* demo */

function Demo({ lang }: { lang: Lang }) {
  const t = COPY[lang].demo
  return (
    <section className="demo" id="demo" aria-labelledby="demo-h2">
      <div className="wrap demo-in">
        <div>
          <h2 id="demo-h2">{t.h2}</h2>
          <p className="intro">{t.body}</p>
          <div className="actions">
            <a className="btn btn-inv" href={LINKS.demoAdmin} target="_blank" rel="noopener noreferrer">
              {t.admin}
            </a>
            <a
              className="btn btn-line btn-inv-line"
              href={LINKS.demoCocina}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.kitchen}
            </a>
          </div>
          <a className="text-link" href={LINKS.github} target="_blank" rel="noopener noreferrer">
            {t.github}
          </a>
        </div>
        <dl className="creds">
          <div>
            <dt>{lang === 'es' ? 'Administración' : 'Admin'}</dt>
            <dd>{DEMO_ACCOUNT.admin}</dd>
          </div>
          <div>
            <dt>{lang === 'es' ? 'Cocina' : 'Kitchen'}</dt>
            <dd>{DEMO_ACCOUNT.cocina}</dd>
          </div>
          <div>
            <dt>{t.passLabel}</dt>
            <dd>{DEMO_ACCOUNT.pass}</dd>
          </div>
          <p>{t.note}</p>
        </dl>
      </div>
    </section>
  )
}

/* sobre el proyecto */

function About({ lang }: { lang: Lang }) {
  const t = COPY[lang].about
  return (
    <section className="about" id="proyecto" aria-labelledby="about-h2">
      <div className="wrap about-in">
        <h2 id="about-h2">{t.h2}</h2>
        <div>
          <p className="intro">{t.body}</p>
          <p className="author">
            <span>{t.team}</span>
            {AUTHORS.map((a) => (
              <strong key={a}>{a}</strong>
            ))}
          </p>
          <div className="actions">
            <a className="btn" href={LINKS.github} target="_blank" rel="noopener noreferrer">
              {t.github}
            </a>
            {LINKS.linkedin && (
              <a
                className="btn btn-line"
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.linkedin}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* pie y vídeo */

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <Brand />
        <p>{COPY[lang].footer.line}</p>
      </div>
    </footer>
  )
}

function VideoDialog({
  dialogRef,
  lang,
  onClose,
}: {
  dialogRef: React.RefObject<HTMLDialogElement>
  lang: Lang
  onClose: () => void
}) {
  const t = COPY[lang].video
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const on = () => setOpen(d.open)
    d.addEventListener('close', on)
    d.addEventListener('toggle', on)
    const obs = new MutationObserver(on)
    obs.observe(d, { attributes: true, attributeFilter: ['open'] })
    return () => {
      d.removeEventListener('close', on)
      d.removeEventListener('toggle', on)
      obs.disconnect()
    }
  }, [dialogRef])
  return (
    <dialog ref={dialogRef} className="video" aria-label={t.title}>
      <button type="button" className="video-close" onClick={onClose}>
        {t.close}
      </button>
      {open && (
        <iframe
          title={t.title}
          src={`https://www.youtube-nocookie.com/embed/${LINKS.videoId}?autoplay=1&rel=0`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </dialog>
  )
}
