# Stack Tecnológico - MariachisTexas Medellín

## 📋 Resumen General
Aplicación de full-stack moderna para gestión de servicios de mariachis con arquitectura cliente-servidor, containerizada con Docker y orquestación con Docker Compose.

---

## 🖥️ Frontend (React + TypeScript)

### Framework & Build Tools
- **React**: `^19.2.4` - UI library
- **TypeScript**: `~5.8.2` - Type safety
- **Vite**: `^6.2.0` - Build tool y dev server
- **React Router DOM**: `^7.15.1` - Client-side routing
- **@vitejs/plugin-react**: `^5.0.0` - React plugin para Vite

### UI & Styling
- **Tailwind CSS**: `^3.4.19` - Utility-first CSS framework
- **PostCSS**: `^8.5.9` - CSS transformations
- **Autoprefixer**: `^10.4.27` - Vendor prefixes
- **Lucide React**: `^0.563.0` - Icon library
- **Motion**: `^12.34.3` - Animations

### Data & State Management
- **Axios**: `^1.13.6` - HTTP client
- **Zod**: `^4.3.6` - Schema validation
- **React Hot Toast**: `^2.6.0` - Notifications

### Charts & Visualization
- **Chart.js**: `^4.5.1` - Chart library
- **Recharts**: `^3.7.0` - React charting library
- **html2canvas**: `^1.4.1` - Canvas manipulation
- **jsPDF**: `^4.2.1` - PDF generation

### Dev Tools
- **@types/react**: `^19.2.14`
- **@types/react-dom**: `^19.2.3`
- **@types/node**: `^22.14.0`

---

## 🔧 Backend (Node.js + Express + TypeScript)

### Framework & Runtime
- **Express**: `^5.2.1` - Web framework
- **Node.js**: CommonJS module system
- **TypeScript**: `^5.9.3` - Type safety
- **ts-node-dev**: `^2.0.0` - Development environment
- **ts-node**: `^10.9.2` - TypeScript execution

### Database & ORM
- **Prisma**: `^7.6.0` - ORM (incluye CLI y studio)
- **@prisma/client**: `^7.6.0` - Client Prisma
- **@prisma/adapter-pg**: `^7.4.2` - PostgreSQL adapter
- **PostgreSQL**: Base de datos (via Docker)

### Authentication & Security
- **jsonwebtoken**: `^9.0.3` - JWT tokens
- **bcryptjs**: `^3.0.3` - Password hashing
- **helmet**: `^8.1.0` - Security headers
- **express-rate-limit**: `^8.3.1` - Rate limiting
- **cors**: `^2.8.6` - CORS middleware

### Email & Notifications
- **@sendinblue/client**: `^3.3.1` - Brevo (SendinBlue) API
- **Nodemailer**: `^8.0.1` - Email sending
- **Resend**: `^6.12.3` - Email service

### File & Media Handling
- **Multer**: `^2.1.1` - File uploads
- **Cloudinary**: `^2.10.0` - Cloud storage & CDN
- **PDFKit**: `^0.18.0` - PDF generation
- **Puppeteer**: `^24.39.1` - Headless browser automation

### AI & External APIs
- **groq-sdk**: `^1.1.2` - Groq AI API
- **Axios**: `^1.13.6` - HTTP client

### Task Scheduling & Utilities
- **node-cron**: `^4.2.1` - Cron jobs
- **Validator**: `^13.15.26` - Data validation
- **Zod**: `^4.3.6` - Schema validation
- **dotenv**: `^17.4.0` - Environment variables
- **dotenv-cli**: `^11.0.0` - CLI for .env

### Dev Tools & Type Definitions
- **@types/express**: `^5.0.6`
- **@types/node**: `^25.3.3`
- **@types/cors**: `^2.8.19`
- **@types/multer**: `^2.1.0`
- **@types/jsonwebtoken**: `^9.0.10`
- **@types/bcryptjs**: `^2.4.6`
- **@types/nodemailer**: `^7.0.11`
- **@types/validator**: `^13.15.10`
- **@types/pdfkit**: `^0.17.5`
- **@types/node-cron**: `^3.0.11`
- **@types/helmet**: `^0.0.48`
- **Nodemon**: `^3.1.14` - Auto-reload development

---

## 🐳 Containerización & Orquestación

### Docker
- **Docker**: Containerización de Backend y Frontend
- **Dockerfile.dev**: Imagen de desarrollo
- **Dockerfile.prod**: Imagen de producción
- **docker-compose.dev.yml**: Orquestación en desarrollo
- **docker compose.prod.yml**: Orquestación en producción

### Docker Compose Services
1. **Backend Service**
   - Container: `softmartex_backend_dev`
   - Puerto: `3000:3000`
   - Volumes: Sincronización de código fuente
   - Network: `softmartex_net`

2. **Frontend Service**
   - Container: `softmartex_frontend_dev`
   - Puerto: `5173:5173`
   - Depends on: Backend
   - Network: `softmartex_net`

3. **Network**
   - Driver: Bridge
   - Nombre: `softmartex_net`

### Reverse Proxy & Nginx
- **Nginx**: `nginx/` - Configuración de reverse proxy
- Manejo de enrutamiento entre Frontend y Backend

---

## 🗄️ Base de Datos

### PostgreSQL
- Gestión de datos para la aplicación
- Adaptador: `@prisma/adapter-pg`
- ORM: Prisma con migraciones

### Prisma Features
- Schema-driven development
- Migraciones automáticas
- Prisma Studio (GUI para datos)
- Seed scripts para datos iniciales

---

## 🔑 Características de Seguridad

1. **Autenticación**: JWT tokens
2. **Hashing**: bcryptjs para contraseñas
3. **CORS**: Control de origen cruzado
4. **Rate Limiting**: Limitación de solicitudes
5. **Security Headers**: Helmet middleware
6. **Validación**: Zod + Validator

---

## 📡 APIs & Integraciones Externas

### Email
- **Brevo (SendinBlue)**: Envío de correos
- **Resend**: Servicio de email

### Cloud & Storage
- **Cloudinary**: Almacenamiento de imágenes/archivos

### AI
- **Groq API**: Procesamiento con IA

### Autenticación Externa (Configurado)
- **Spotify**: OAuth integration (credenciales en .env)

---

## 🔄 Scripts & Comandos

### Frontend
```bash
npm run dev      # Desarrollo con Vite
npm run build    # Build para producción
npm run lint     # TypeScript check
npm run preview  # Preview del build
```

### Backend
```bash
npm run dev           # Desarrollo con ts-node-dev
npm run build         # Compilar TypeScript
npm run start         # Iniciar en producción
npm run studio        # Abrir Prisma Studio
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Seed de datos
```

---

## 📁 Estructura del Proyecto

```
Frontend-Backend-MariachisTexas/
├── Frontend-MariachisTexas/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile.{dev,prod}
├── Backend-MariachisTexas/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile.{dev,prod}
├── nginx/
├── docker-compose.dev.yml
├── docker compose.prod.yml
└── .env.production
```

---

## 🌐 Configuración de Entorno

Variables requeridas en `.env`:
- `DATABASE_URL` - Conexión PostgreSQL
- `FRONTEND_URL` - URL del frontend
- `VITE_API_URL` - URL de la API
- `JWT_SECRET` - Secreto para JWT
- `BREVO_API_KEY` - API key de Brevo
- `MAIL_FROM_ADDRESS` - Dirección de email
- `SPOTIFY_CLIENT_ID` - Spotify OAuth
- `SPOTIFY_CLIENT_SECRET` - Spotify OAuth
- `GROQ_API_KEY` - API key de Groq

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────┐
│          Usuario / Navegador Web                     │
└────────────────────────┬────────────────────────────┘
                         │
          ┌──────────────┴───────────────┐
          │                              │
    ┌─────▼──────┐              ┌────────▼──────┐
    │  Frontend   │              │   Nginx      │
    │  (React)    │──────────────│  (Proxy)     │
    │  Port 5173  │              │              │
    └─────┬──────┘              └────────┬──────┘
          │                              │
          └──────────────┬───────────────┘
                         │ (Axios)
                         │ HTTP/HTTPS
          ┌──────────────▼────────────────┐
          │      Backend (Express)        │
          │      (Node.js + TypeScript)   │
          │      Port 3000                │
          └──────────────┬────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼──┐   ┌──────▼──┐   ┌───────▼────┐
    │PostgreSQL│  │Prisma  │   │External   │
    │Database   │  │(ORM)   │   │Services   │
    │           │  │        │   │(Groq,etc) │
    └───────────┘  └────────┘   └───────────┘
```

---

## 🚀 Deployment

- **Containerización**: Docker + Docker Compose
- **Base de Datos**: PostgreSQL (via contenedor)
- **Reverse Proxy**: Nginx
- **Entorno**: Desarrollo (docker-compose.dev.yml) y Producción (docker compose.prod.yml)

---

**Última actualización**: Junio 2026
**Versión**: 1.0.0
