# Mordobo Backoffice

Web dashboard for Mordobo administrators to monitor operations, manage users, and oversee services.

- **Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query, Axios
- **Auth:** JWT (login/2FA) contra la API de Mordobo

## Desarrollo local

```bash
npm install
cp .env.example .env   # Editar VITE_API_BASE_URL
npm run dev
```

Abre `http://localhost:5174`.

## Despliegue en Netlify

1. **Conectar el repositorio**
   - En [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**
   - Conecta GitHub y elige el repo `admin-dashboard` (o Mordobo/admin-dashboard)
   - Rama: `main` o la que uses para producción

2. **Configuración de build** (el `netlify.toml` ya lo define)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - No hace falta cambiar nada si existe `netlify.toml`

3. **Variables de entorno**
   - Site → **Site configuration** → **Environment variables**
   - Añade:
     - `VITE_API_BASE_URL`: URL de la API (ej. `https://mordobo-api-qa.onrender.com`)
     - `VITE_ADMIN_SECRET`: (opcional) secreto para endpoints de admin (approve/reject provider)

4. **Deploy**
   - **Deploy site**. Tras el build, la URL quedará tipo `https://nombre-random.netlify.app`
   - Opcional: en **Domain management** puedes poner un subdominio (ej. `backoffice.mordobo.com`)

Las variables con prefijo `VITE_` se inyectan en el build; si cambias algo en Netlify, hay que volver a desplegar.

## System Settings

El módulo **System Settings** (`/settings`) incluye:

- **Admin Users:** lista de admins con rol y estado, invitar por email, editar rol, desactivar (solo Super Admin).
- **Platform Config:** comisión, montos min/max de jobs, ciudades/idiomas soportados, modo mantenimiento (solo Super Admin).
- **Email Templates:** ver y editar plantillas transaccionales (solo Super Admin).
- **Audit Log:** timeline de acciones administrativas (quién, qué, cuándo).

RBAC: **Super Admin** > **Admin** > **Moderator**. La API debe exponer los endpoints descritos en `docs/system-settings-api.md` y las tablas en `docs/system-settings-schema.sql` (en la raíz del repo Backoffice).
