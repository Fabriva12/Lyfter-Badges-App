# Lyfter Badges

Aplicación de gamificación para eventos de Lyfter. Los asistentes escanean un QR de
bienvenida, se registran y después escanean el QR de cada charla o stand. Cada escaneo
otorga un badge y XP: la XP acumulada define el **nivel global** del asistente, mientras
que el ranking se calcula **por evento**. Al completar todos los badges de un evento se
desbloquea el premio.

Detrás hay un panel de administración para el equipo de Lyfter (`ADMIN`) y para las
empresas con stand (también `ADMIN`, acotado a su stand), más un panel global para el
administrador de la plataforma (`SUPER_ADMIN`) en `/super-admin`.

El diseño técnico completo, las decisiones de arquitectura y los detalles del modelo de
dominio están en [`PLAN.md`](./PLAN.md).

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16.3 + React 19.2 |
| Estilos | Tailwind CSS 4 |
| ORM | Prisma 7.10 |
| Base de datos | Supabase Postgres (session pooler) |
| Autenticación | Better Auth 1.7 |
| Tests | Vitest |
| Gestor de paquetes | pnpm |

## Requisitos

- Node.js 20+
- pnpm
- Un proyecto de Supabase accesible

Variables en `.env`:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión usada por la app en runtime |
| `DIRECT_URL` | Conexión usada por la CLI de Prisma (migraciones) |
| `SHADOW_DATABASE_URL` | Base `lyfter_shadow` para `migrate dev` |
| `BETTER_AUTH_SECRET` | Secreto de Better Auth |
| `BETTER_AUTH_URL` | URL base de la app (por ejemplo `http://localhost:3000`) |

Las URLs de conexión viven en `prisma7.config.ts` (Prisma 7.10 no genera
`prisma.config.ts`). Si el proyecto de Supabase está pausado, despertalo desde el panel
antes de correr migraciones o el seed.

## Puesta en marcha

```bash
pnpm install
pnpm prisma migrate deploy
pnpm dev
```

Para desarrollo con migraciones nuevas:

```bash
pnpm prisma migrate dev
```

La app queda en [http://localhost:3000](http://localhost:3000).

## Datos de demo

El seed siempre crea los niveles (`Level`). El resto del contenido de demo está detrás de
`SEED_DEMO_DATA=true`, que **no** viene configurado por defecto en `.env`.

PowerShell:

```powershell
$env:SEED_DEMO_DATA="true"; pnpm prisma db seed
```

Bash:

```bash
SEED_DEMO_DATA=true pnpm prisma db seed
```

El seed es idempotente: crea/actualiza los eventos **Lyfter Demo 2026** y
**Lyfter Meetup 2026**, sus badges, tokens QR, premios y asistentes con distinto XP.

## Usuarios de test

Estos usuarios tienen cuenta con contraseña (Better Auth, proveedor `credential`) y sirven
para entrar al panel:

| Rol | Email | Contraseña | Entrada en el navbar | Acceso |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | `superadmin@lyfter.demo` | `lyfter-demo-2026` | **Super Admin** | `/super-admin`: todas las empresas, eventos y administradores |
| `ADMIN` (organizador) | `organizer@lyfter.demo` | `lyfter-demo-2026` | **Admin** | `/admin` y los eventos de su empresa |
| `ADMIN` (partner/stand) | `partner@lyfter.demo` | `lyfter-demo-2026` | **Admin** | `/admin`, solo el stand asignado en modo lectura |

El resto de los asistentes sembrados existen únicamente para poblar el leaderboard y la
colección; **no tienen cuenta de credenciales, así que no pueden iniciar sesión**:

| Email | Colección en el evento demo | XP |
| --- | --- | --- |
| `attendee@lyfter.demo` | 2 de 4 badges | 110 |
| `builder@lyfter.demo` | 3 de 4 badges | 150 |
| `coder@lyfter.demo` | 2 de 4 badges | 120 |
| `dev@lyfter.demo` | 1 de 4 badges | 50 |
| `ema@lyfter.demo` | 4 de 4 badges (premio desbloqueado) | 220 |

`attendee@lyfter.demo` además participa del meetup con un badge, para mostrar el estado de
premio "anunciado pero no ganado".

> `verify-fase3@lyfter.test` es un usuario de verificación residual creado por registro
> manual. No se usa en el flujo normal y su contraseña no está documentada.

Para crear más usuarios, usá el formulario de `/login` (pestaña **Create account**). El rol
por defecto es `ATTENDEE`; los roles `ADMIN` y `SUPER_ADMIN` se asignan por base de datos
(el rol `ADMIN` cubre tanto organizadores como partners de stand).

## QRs de demo

Cada token se puede abrir directamente en el navegador con `/s/<token>`. Si no hay sesión,
la app redirige a `/login` y conserva el destino original.

| Evento | Token | URL | Tipo |
| --- | --- | --- | --- |
| Lyfter Demo 2026 | `demo-welcome` | `/s/demo-welcome` | Bienvenida (registro) |
| Lyfter Demo 2026 | `demo-keynote` | `/s/demo-keynote` | Badge — Opening Keynote (50 XP) |
| Lyfter Demo 2026 | `demo-rsc` | `/s/demo-rsc` | Badge — React Server Components (60 XP) |
| Lyfter Demo 2026 | `demo-supabase` | `/s/demo-supabase` | Badge — Supabase Stand (40 XP) |
| Lyfter Demo 2026 | `demo-auth` | `/s/demo-auth` | Badge — Better Auth Workshop (70 XP) |
| Lyfter Meetup 2026 | `demo-meetup-welcome` | `/s/demo-meetup-welcome` | Bienvenida (registro) |
| Lyfter Meetup 2026 | `demo-meetup-checkin` | `/s/demo-meetup-checkin` | Badge — Meetup Check-in (20 XP) |
| Lyfter Meetup 2026 | `demo-meetup-talks` | `/s/demo-meetup-talks` | Badge — Meetup Lightning Talks (30 XP) |

Los escaneos son idempotentes: repetir el mismo QR no vuelve a otorgar XP.

## Rutas

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| `/` | Landing pública | Público |
| `/login` | Inicio de sesión y registro | Público |
| `/s/[token]` | Landing del QR: registra el escaneo o reclama el badge | Requiere sesión |
| `/collection` | Colección, XP global y nivel | Requiere sesión |
| `/leaderboard` | Ranking por evento | Requiere sesión |
| `/badge/[eventBadgeId]` | Página pública del badge e imagen OG | Público |
| `/admin` | Panel según rol | `ADMIN` |
| `/admin/events/[id]` | Detalle del evento (badges, premio, escaneos) | `ADMIN` de la empresa dueña |
| `/admin/stands/[eventBadgeId]` | Vista de solo lectura del stand | `ADMIN` asignado al stand |
| `/super-admin` | Panel global: empresas, eventos y administradores | `SUPER_ADMIN` |

Un objeto que no pertenece al usuario responde `404` a propósito, para no filtrar la
existencia de ids ajenos.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests con Vitest |
| `pnpm test:watch` | Vitest en modo watch |

## Estructura

```
app/                  rutas (App Router)
  admin/              panel de organizador y partner
  super-admin/        panel global del SUPER_ADMIN
  api/auth/[...all]/  handler de Better Auth
  badge/              página pública del badge + OG image
  collection/         colección, XP y nivel
  leaderboard/        ranking por evento
  login/              login y registro
  s/[token]/          landing de los QR
components/           UI (landing, admin, collection, auth, share, scan)
lib/
  auth.ts             instancia de Better Auth
  db.ts               PrismaClient singleton
  session.ts          helpers de sesión (requireSession / requireRole)
  gamification/       lógica pura de XP, niveles, colección y ranking
  admin/              permisos, guards, queries y validación del panel
prisma/
  schema.prisma       modelo de datos
  migrations/         migraciones
  seed.ts             datos de demo
prisma7.config.ts     datasource + shadow DB + seed (nombre propio de Prisma 7.10)
scripts/              scripts manuales de inspección y verificación
```

## Troubleshooting

- **`ENOTFOUND ... tenant/user postgres.<ref> not found`**: el proyecto de Supabase está
  pausado o la connection string quedó vieja. Despertalo desde el dashboard y verificá
  `DATABASE_URL` / `DIRECT_URL`.
- **`P1017 Server has closed the connection` en el primer `migrate dev`**: bug conocido de
  Prisma en instancias nuevas. Crear `_prisma_migrations` a mano y reintentar.
- **`SELF_SIGNED_CERT_IN_CHAIN`**: usar `sslmode=no-verify` contra el pooler de Supabase.
- **`ERR_PNPM_IGNORED_BUILDS`**: `allowBuilds` en `pnpm-workspace.yaml` necesita booleanos
  reales.

Más gotchas de Next.js 16, Prisma 7 y Better Auth en [`PLAN.md`](./PLAN.md).
