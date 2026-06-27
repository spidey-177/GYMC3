GYMC3/
├── public/ # Archivos estáticos servidos directamente
│
├── src/
│ ├── assets/ # Imágenes, íconos, fuentes locales
│ │
│ ├── components/ # Componentes reutilizables en múltiples páginas
│ │ ├── ui/ # Componentes genéricos de interfaz (botones, inputs, badges, modales)
│ │ └── layout/ # Estructura visual fija (Sidebar, Navbar, PageWrapper)
│ │
│ ├── pages/ # Una carpeta por página del sistema
│ │ ├── Dashboard/
│ │ ├── Recepcion/
│ │ ├── Clientes/
│ │ ├── ClientePerfil/
│ │ ├── Planes/
│ │ └── Asistencia/
│ │
│ ├── services/ # Toda la comunicación con Supabase vive aquí
│ │ ├── dashboard.service.js # getDashboardStats()
│ │ ├── clientes.service.js # getClients(), createClient(), etc.
│ │ ├── membresias.service.js # renewMembership(), changePlan()
│ │ ├── planes.service.js # getPlans(), createPlan(), etc.
│ │ ├── asistencia.service.js # getAttendances()
│ │ └── recepcion.service.js # processAccess()
│ │
│ ├── hooks/ # Custom hooks que conectan servicios con componentes
│ │ └── useClientes.js # Ejemplo: encapsula llamada + loading + error
│ │
│ ├── utils/ # Funciones puras de utilería sin dependencias externas
│ │ └── formatters.js # Ej. formatear fechas, estados a texto legible
│ │
│ ├── lib/ # Configuración de librerías externas
│ │ └── supabaseClient.js # Instancia única del cliente de Supabase
│ │
│ ├── router/ # Definición de rutas con react-router-dom
│ │ └── index.jsx
│ │
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css
│
├── .env # Variables de entorno (URL y key de Supabase)
├── .env.example # Versión sin valores reales para compartir en el repo
├── .gitignore
├── index.html
|\_\_ package.json
└── vite.config.js
