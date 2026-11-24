export type Lang = 'es' | 'en'

export interface Step {
  state: string
  title: string
  body: string
}

export interface Copy {
  meta: { title: string; description: string }
  skip: string
  nav: { journey: string; apps: string; stack: string; demo: string; github: string; langLabel: string }
  hero: {
    h1: string[]
    lead: string
    demo: string
    video: string
    code: string
    altDash: string
    altPhone: string
  }
  journey: { h2: string; intro: string; steps: Step[]; alts: string[]; goTo: string }
  apps: {
    h2: string
    admin: { name: string; who: string; items: string[]; alt: string }
    kitchen: { name: string; who: string; items: string[]; alt: string }
    android: { name: string; who: string; items: string[]; altMap: string; altHome: string }
    apk: string
  }
  stack: {
    h2: string
    intro: string
    diagram: { android: string; kitchen: string; admin: string; api: string; db: string; server: string; aria: string }
    groups: { name: string; items: string[] }[]
  }
  demo: {
    h2: string
    body: string
    admin: string
    kitchen: string
    userLabel: string
    passLabel: string
    github: string
    note: string
  }
  about: { h2: string; body: string; team: string; linkedin: string; github: string }
  footer: { line: string }
  video: { close: string; title: string }
}

export const COPY: Record<Lang, Copy> = {
  es: {
    meta: {
      title: 'Corebar · Gestión de restaurante: camarero, cocina y administración',
      description:
        'Corebar conecta la app del camarero, la pantalla de cocina y el panel de administración de un restaurante. Proyecto de fin de ciclo de DAM, desplegado y con demo.',
    },
    skip: 'Saltar al contenido',
    nav: {
      journey: 'Recorrido',
      apps: 'Aplicaciones',
      stack: 'Tecnología',
      demo: 'Demo',
      github: 'Código en GitHub',
      langLabel: 'Idioma',
    },
    hero: {
      h1: ['Un pedido,', 'de la mesa', 'a la caja.'],
      lead:
        'Corebar conecta la app del camarero, la pantalla de cocina y el panel de administración de un restaurante. Es mi proyecto de fin de ciclo de DAM, publicado y funcionando.',
      demo: 'Probar la demo',
      video: 'Ver el vídeo',
      code: 'Ver el código',
      altDash: 'Panel de administración de Corebar con ingresos, tickets y mesas ocupadas',
      altPhone: 'App Android de Corebar con las acciones del camarero',
    },
    journey: {
      h2: 'El recorrido de un pedido',
      intro: 'Cuatro estados, tres aplicaciones y ninguna llamada a gritos.',
      goTo: 'Ir al paso',
      steps: [
        {
          state: 'Recibido',
          title: 'El camarero toma nota',
          body:
            'Elige la mesa, añade los platos de la carta y el pedido queda registrado en esa mesa. Desde la misma pantalla puede cobrar o liberar la mesa.',
        },
        {
          state: 'Preparando',
          title: 'Cocina ve cada mesa como un ticket',
          body:
            'Toca un plato para pasarlo de Recibido a Preparando y a Listo. Si algo se acaba, lo marca como agotado. Los pedidos nuevos aparecen solos.',
        },
        {
          state: 'Listo',
          title: 'Sala se entera sin preguntar',
          body:
            'Cuando un plato está listo, el móvil del camarero avisa con «Listo para recoger», el plato y la mesa. En Estado de cocina sigue cada plato hasta entregarlo.',
        },
        {
          state: 'Cobrado',
          title: 'Se cobra y queda registrado',
          body:
            'Al cobrar se emite la factura simplificada con el desglose del IVA. El panel de administración suma ese ingreso a las ventas.',
        },
      ],
      alts: [
        'Pantalla Nota de mesa de la app Android con las líneas del pedido y el botón Finalizar y cobrar',
        'Web de cocina con los pedidos de cada mesa y el estado de cada plato',
        'Notificación Listo para recoger y pantalla Estado de cocina en la app Android',
        'Factura simplificada abierta en el panel de administración',
      ],
    },
    apps: {
      h2: 'Tres aplicaciones, un mismo sistema',
      admin: {
        name: 'Panel de administración',
        who: 'Para quien lleva el negocio.',
        items: [
          'Resumen con ingresos, tickets, mesas ocupadas y stock crítico',
          'Pedidos, tickets y facturas',
          'Productos, categorías y stock',
          'Mesas y personal',
        ],
        alt: 'Catálogo de productos en el panel de administración',
      },
      kitchen: {
        name: 'Web de cocina',
        who: 'Para quien cocina.',
        items: [
          'Un ticket por mesa con los minutos de espera',
          'Colores por estado del plato y por tiempo',
          'Historial de pedidos completados',
        ],
        alt: 'Historial de pedidos completados en la web de cocina',
      },
      android: {
        name: 'App Android',
        who: 'Para quien está en sala.',
        items: [
          'Mapa de mesas del salón y la barra, con zoom',
          'Nota de mesa con la carta y sus fotos',
          'Notificación cuando un plato está listo',
        ],
        altMap: 'Mapa de mesas en la app Android',
        altHome: 'Inicio de la app Android con las acciones del camarero',
      },
      apk: 'Descargar el APK',
    },
    stack: {
      h2: 'Cómo está montado',
      intro:
        'Las tres aplicaciones hablan con una sola API. Todo corre en mi propio servidor, con HTTPS.',
      diagram: {
        android: 'App Android',
        kitchen: 'Web de cocina',
        admin: 'Administración',
        api: 'API',
        db: 'Base de datos',
        server: 'Servidor propio con Docker y Nginx',
        aria: 'Esquema: la app Android, la web de cocina y el panel de administración se conectan a una API de Spring Boot que guarda los datos en MySQL.',
      },
      groups: [
        { name: 'App Android', items: ['Kotlin', 'Jetpack Compose'] },
        { name: 'Webs', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
        { name: 'Servidor', items: ['Java', 'Spring Boot', 'MySQL'] },
        { name: 'Despliegue', items: ['Docker', 'Nginx', 'Ubuntu'] },
      ],
    },
    demo: {
      h2: 'Pruébalo tú mismo',
      body:
        'La demo es un entorno aparte, con datos inventados. Puedes tocar todo sin romper nada: se restablece cada noche.',
      admin: 'Abrir el panel de administración',
      kitchen: 'Abrir la web de cocina',
      userLabel: 'Usuario',
      passLabel: 'Contraseña',
      github: 'Ver el código en GitHub',
      note: 'La app Android necesita instalar el APK.',
    },
    about: {
      h2: 'Sobre el proyecto',
      body:
        'Corebar es el proyecto de fin de ciclo del grado superior de Desarrollo de Aplicaciones Multiplataforma (DAM).',
      team: 'Hecho por',
      linkedin: 'LinkedIn',
      github: 'GitHub',
    },
    footer: { line: 'Corebar. Proyecto de fin de ciclo de DAM.' },
    video: { close: 'Cerrar el vídeo', title: 'Vídeo de demostración de Corebar' },
  },

  en: {
    meta: {
      title: 'Corebar · Restaurant management: waiter, kitchen and admin',
      description:
        'Corebar connects a restaurant’s waiter app, kitchen screen and admin panel. A final-year DAM project, deployed and with a live demo.',
    },
    skip: 'Skip to content',
    nav: {
      journey: 'Order flow',
      apps: 'Apps',
      stack: 'Tech',
      demo: 'Demo',
      github: 'Code on GitHub',
      langLabel: 'Language',
    },
    hero: {
      h1: ['One order,', 'from table', 'to till.'],
      lead:
        'Corebar connects a restaurant’s waiter app, kitchen screen and admin panel. It is my final-year DAM project, deployed and working.',
      demo: 'Try the demo',
      video: 'Watch the video',
      code: 'See the code',
      altDash: 'Corebar admin panel showing revenue, tickets and occupied tables',
      altPhone: 'Corebar Android app showing the waiter’s actions',
    },
    journey: {
      h2: 'How an order travels',
      intro: 'Four states, three apps and nobody shouting across the room.',
      goTo: 'Go to step',
      steps: [
        {
          state: 'Received',
          title: 'The waiter takes the order',
          body:
            'Pick the table, add dishes from the menu and the order is saved on that table. From the same screen the waiter can take payment or free the table.',
        },
        {
          state: 'Preparing',
          title: 'The kitchen sees each table as a ticket',
          body:
            'Tap a dish to move it from Received to Preparing and then Ready. If something runs out, it is marked as sold out. New orders show up on their own.',
        },
        {
          state: 'Ready',
          title: 'The floor knows without asking',
          body:
            'When a dish is ready, the waiter’s phone shows “Ready to collect” with the dish and the table. Kitchen status follows each dish until it is delivered.',
        },
        {
          state: 'Paid',
          title: 'Payment is taken and recorded',
          body:
            'Paying issues a simplified invoice with the VAT breakdown. The admin panel adds that income to the sales figures.',
        },
      ],
      alts: [
        'Table note screen in the Android app with the order lines and the checkout button',
        'Kitchen web app with each table’s orders and the status of every dish',
        'Ready-to-collect notification and kitchen status screen in the Android app',
        'Simplified invoice opened in the admin panel',
      ],
    },
    apps: {
      h2: 'Three apps, one system',
      admin: {
        name: 'Admin panel',
        who: 'For whoever runs the business.',
        items: [
          'Overview with revenue, tickets, occupied tables and low stock',
          'Orders, tickets and invoices',
          'Products, categories and stock',
          'Tables and staff',
        ],
        alt: 'Product catalogue in the admin panel',
      },
      kitchen: {
        name: 'Kitchen web app',
        who: 'For whoever cooks.',
        items: [
          'One ticket per table with waiting minutes',
          'Colours by dish status and by time',
          'History of completed orders',
        ],
        alt: 'History of completed orders in the kitchen web app',
      },
      android: {
        name: 'Android app',
        who: 'For whoever works the floor.',
        items: [
          'Map of the dining room and bar tables, with zoom',
          'Table notes with the menu and its photos',
          'Notification when a dish is ready',
        ],
        altMap: 'Table map in the Android app',
        altHome: 'Android app home screen with the waiter’s actions',
      },
      apk: 'Download the APK',
    },
    stack: {
      h2: 'How it is built',
      intro: 'The three apps talk to a single API. Everything runs on my own server, over HTTPS.',
      diagram: {
        android: 'Android app',
        kitchen: 'Kitchen web app',
        admin: 'Admin panel',
        api: 'API',
        db: 'Database',
        server: 'Own server with Docker and Nginx',
        aria: 'Diagram: the Android app, the kitchen web app and the admin panel connect to a Spring Boot API that stores data in MySQL.',
      },
      groups: [
        { name: 'Android app', items: ['Kotlin', 'Jetpack Compose'] },
        { name: 'Web apps', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
        { name: 'Server', items: ['Java', 'Spring Boot', 'MySQL'] },
        { name: 'Deployment', items: ['Docker', 'Nginx', 'Ubuntu'] },
      ],
    },
    demo: {
      h2: 'Try it yourself',
      body:
        'The demo is a separate environment with made-up data. Touch anything: it resets every night.',
      admin: 'Open the admin panel',
      kitchen: 'Open the kitchen web app',
      userLabel: 'Username',
      passLabel: 'Password',
      github: 'See the code on GitHub',
      note: 'The Android app needs the APK installed.',
    },
    about: {
      h2: 'About the project',
      body:
        'Corebar is the final-year project of the higher vocational degree in Multiplatform Application Development (DAM).',
      team: 'Made by',
      linkedin: 'LinkedIn',
      github: 'GitHub',
    },
    footer: { line: 'Corebar. Final-year DAM project.' },
    video: { close: 'Close video', title: 'Corebar demo video' },
  },
}
