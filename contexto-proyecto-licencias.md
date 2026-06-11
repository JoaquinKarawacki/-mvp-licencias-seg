# Contexto del proyecto — Sistema de Control de Licencias (SEG Ingeniería)

> Documento de traspaso para continuar el desarrollo en una nueva conversación.
> Cubre **backend** (ya estaba) y **frontend** (desarrollado recientemente).

---

## Qué es el proyecto

Sistema interno para gestionar solicitudes de licencia de los empleados de SEG Ingeniería. Reemplaza el flujo manual anterior (planilla Excel + captura + mail) por un sistema web con base de datos, login, roles, solicitudes, aprobaciones, saldos y notificaciones por correo.

Son **dos proyectos separados** (repos distintos):
- **Backend:** `C:\Users\Joaquín\Documents\SEG\-mvp-licencias-seg` (NestJS)
- **Frontend:** `C:\Users\Joaquín\Documents\SEG\licencias-frontend` (Next.js)

---

## Perfil de quien desarrolla (IMPORTANTE para asistir bien)

- Estudiante de 3er año de ingeniería en sistemas.
- Sabe JavaScript, aprendiendo TypeScript.
- **El BACKEND lo escribió él mismo** con guía y correcciones. Prefiere entender el *porqué* de las decisiones.
- **El FRONTEND lo escribe Claude** (decisión tomada al empezar el front): Claude entrega el código completo, él lo pega, prueba y pregunta dudas.
- Valora explicaciones junto a las correcciones. Se le marca proactivamente bugs en su código (incluso del backend).
- A reforzar: sintaxis de TS, revisar el código antes de darlo por terminado (typos, métodos duplicados, puntos y coma).

---

## Cómo levantar TODO el sistema (local, 3 cosas en orden)

Son tres procesos en paralelo, cada uno su terminal:

1. **Base de datos (Docker)** — en la carpeta del backend, con Docker Desktop abierto:
   ```
   docker compose up -d
   ```
   Verificar: `docker ps` (debe aparecer `licencias_seg_db`, postgres:16, puerto 5432).

2. **Backend** — en `-mvp-licencias-seg`:
   ```
   npm run start:dev
   ```
   Escucha en `http://localhost:3000/api` (¡tiene prefijo global `/api`!).

3. **Frontend** — en `licencias-frontend`:
   ```
   npm run dev
   ```
   Corre en `http://localhost:3001`. **Usar siempre `localhost`, NUNCA la IP de red** (rompe el hot reload por cross-origin).

**Credenciales del seed (local y Railway):**
- Admin: `karawacki@segingenieria.com` / `Licencias2026` ← **EMAIL EN MINÚSCULAS**
- (Otros usuarios según los datos iniciales cargados)

---

## ⚠️ TRAMPAS Y BUGS RECURRENTES YA RESUELTOS (leer antes de debuggear)

Estos problemas costaron mucho tiempo. Si reaparecen, acá está la causa:

1. **Doble PostgreSQL (puerto 5432).** Había un Postgres local de Windows corriendo a la vez que el de Docker, pisándose. Síntoma: `P1000 Authentication failed` o `(not available)`. Solución aplicada: matar el local. Para que no vuelva al reiniciar la PC, deshabilitarlo:
   `Set-Service postgresql-x64-18 -StartupType Disabled` (PowerShell admin).

2. **Prisma 7 — la DATABASE_URL va en `prisma.config.ts`, NO en `schema.prisma`.** El config debe tener `import "dotenv/config"` y usar `process.env.DATABASE_URL` con fallback a localhost. El `schema.prisma` solo lleva `datasource db { provider = "postgresql" }` sin url.

3. **React Compiler de Next 16 genera falsos errores de "orden de hooks".** Solución: `reactCompiler: false` en `next.config.mjs`. Si aparece un error de hooks en un componente que está claramente bien, es esto.

4. **Cambios en `.env` / `.env.local` NO entran con hot reload.** Hay que reiniciar el `npm run dev`.

5. **Caché de Next (`.next`) se queda pegada.** Si un cambio no se refleja: Ctrl+C, `rmdir /s /q .next`, `npm run dev`.

6. **Punto y coma faltante en JS** puede romper de formas raras (un `console.log` sin `;` rompió el orden de hooks una vez). Cerrar siempre con `;`.

7. **FECHAS — bug recurrente, prestar atención siempre:**
   - **Al mostrar fechas** que vienen como ISO con `Z` (UTC): NO usar `new Date(stringUTC)` directo, porque se corre un día por zona horaria (UTC-3). Parsear extrayendo año/mes/día: `const [a,m,d] = valor.split("T")[0].split("-"); new Date(Number(a), Number(m)-1, Number(d))`.
   - **Al enviar fechas** desde el front: mandar formato `YYYY-MM-DD` local (función `aFechaLocal` en el form de pedir licencia).
   - **En el backend al guardar:** Prisma espera `Date`, no string. Convertir con `new Date(...)` antes del `.update()` / `.create()`.

8. **Railway — NIXPACKS bake de env vars.** Railpack hacía análisis estático y fallaba con build secrets. Se usa NIXPACKS (`railway.json`). Nixpacks "hornea" las env vars detectadas con ARG/ENV en el Docker build; si `FRONTEND_URL` está vacía al buildear, queda baked como string vacío. Solución definitiva: `origin: true` en CORS (refleja cualquier origen, sin depender de env var).

9. **Railway — Node version.** Nixpacks defaulteaba a Node 18; Prisma 7.8 requiere Node 20+. Se fijó con archivo `.node-version` = `22` en la raíz del backend.

10. **Railway — output path del build.** Si `prisma.config.ts` (raíz) o `generated/` quedan dentro del `rootDir` de TypeScript, el compilador expande el rootDir al proyecto entero y el output sale en `dist/src/main.js` en vez de `dist/main.js`. Solución: excluir `prisma`, `generated` y `prisma.config.ts` en `tsconfig.build.json`.

11. **Credenciales de login — case-sensitive.** La BD guarda `karawacki@segingenieria.com` (todo minúsculas). Si se escribe con mayúscula inicial da 401 "Credenciales inválidas". Siempre ingresar el email en minúsculas.

---

## STACK

### Backend
- NestJS (Node.js, TypeScript)
- PostgreSQL 16 en Docker (local) / Railway PostgreSQL (producción)
- Prisma 7 (cliente generado en `../generated/prisma`, `moduleFormat = "cjs"`, adapter `@prisma/adapter-pg`)
- JWT + Passport
- Microsoft Graph API para emails (OAuth2, app en Azure)
- Prefijo global `/api`, CORS con `origin: true` (refleja cualquier origen)
- ValidationPipe global con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

### Frontend
- Next.js 16.2.7 (App Router, Turbopack)
- React 19.2.4
- Tailwind CSS v4
- **JavaScript (NO TypeScript)**
- `react-day-picker` + `date-fns` (calendario de días sueltos)
- `reactCompiler: false` en next.config.mjs

---

## CONVENCIONES

- **Código en español** (variables, funciones, componentes, comentarios, mensajes).
- **Sin tildes ni eñes** en nombres de tablas, columnas, URLs, identificadores.
- **Rutas/URLs de API en español sin acentos** (`/autenticacion/login`, `/solicitudes`, `/saldos/mios`).
- Backend: arquitectura en capas (Controlador → Servicio → Prisma). Archivos con sufijos en español (`.servicio.ts`, `.controlador.ts`, `.modulo.ts`).
- Frontend: componentes en PascalCase, funciones/variables en camelCase español.
- En Next, los nombres reservados NO se traducen: `app/`, `layout.js`, `page.js`, `globals.css`. El resto de carpetas en español.

---

## IDENTIDAD VISUAL (de la web pública de SEG, reutilizada en la app)

- **Rojo SEG:** `#ca3517` (acción, énfasis). Hover: `#a82d12`.
- **Negro:** barra de navegación.
- Grises neutros de Tailwind (`gray-50`, `gray-100`, `gray-500`, `gray-900`, etc.).
- **Tipografía:** Red Hat Display (vía `next/font/google`, variable `--font-red-hat`).
- **Botones:** siempre `rounded-full`. Relleno rojo (acción principal) u outline rojo (secundaria).
- **Cards:** `bg-white rounded-xl border border-gray-100`. Patrón "cabecera roja + cuerpo blanco" para destacar.
- **Excepción controlada a la guía:** se usan colores semánticos SOLO para estados de solicitud (badges) y mensajes de éxito (verde). El resto respeta la paleta rojo/gris/negro.
  - PENDIENTE → ámbar (`bg-amber-50 text-amber-700 border-amber-200`)
  - APROBADA → verde (`bg-green-50 text-green-700 border-green-200`)
  - RECHAZADA → rojo (`bg-red-50 text-red-700 border-red-200`)
  - CANCELADA → gris

---

## MODELO DE DATOS (Prisma)

- **Usuario** — email, hash_contrasena, rol (EMPLEADO|ADMIN), **esta_activo** (este es el que bloquea el login), fecha_creacion, fecha_actualizacion. Relación 1:1 con Empleado.
- **Empleado** — usuario_id, nombre, apellido, fecha_ingreso, es_encargado, **es_estudiante** (default false), **horas_semanales** (Int, default 0; usado para calcular días de licencia de estudio), **esta_activo** (OJO: distinto al de Usuario), sector_id. Relaciones: usuario, sector, solicitudes, revisiones, saldos.
- **Sector** — nombre (único).
- **TipoLicencia** — nombre (único), codigo (único), requiere_saldo, descripcion (opcional), esta_activo.
- **Feriado** — fecha (única), nombre, es_recurrente.
- **SolicitudLicencia** — empleado_id, tipo_licencia_id, dias_descontados, estado (PENDIENTE|APROBADA|RECHAZADA|CANCELADA), comentario, revisado_por, motivo_rechazo, fecha_creacion. Relaciones: empleado, revisor, tipo_licencia, dias (1:N con DiaSolicitado, onDelete Cascade).
- **DiaSolicitado** — solicitud_id, fecha (una fila por cada día pedido).
- **SaldoLicencia** — empleado_id, tipo_licencia_id, anio, total_dias, dias_usados, dias_ajustados. Unicidad compuesta [empleado_id, tipo_licencia_id, anio].
- **Notificacion** — destinatario, asunto, tipo, enviado, error, fecha_creacion.

---

## REGLAS DE NEGOCIO CLAVE

**Roles:** solo EMPLEADO y ADMIN. "Encargado" NO es rol, es atributo `es_encargado` del empleado. El encargado aprueba/rechaza solicitudes de SU sector.

**Cálculo de días (calculador):** el empleado marca días sueltos (no rango). Feriados no descuentan. **Regla del sábado:** por cada semana con 3+ días pedidos, se suma 1 día extra de descuento. 6 tests unitarios pasando.

**Saldos por antigüedad:** 20 días base por año completo; proporcional si <1 año. Días extra: 0 si <5 años; desde 5 años → `1 + floor((antiguedad-5)/4)`. Antigüedad por fecha exacta al 1 de enero. Días por antigüedad se aplican al año siguiente. Se permiten saldos negativos. `dias_ajustados` para correcciones manuales de RRHH.
- **🔴 REDONDEO/PROPORCIONAL — REGLA NUEVA DE RRHH (09/06/2026), reemplaza todo lo anterior:** lo viejo ("`Math.ceil`, total al final" y "proporcional al día") quedó DESACTUALIZADO. La regla vigente: cálculo mes a mes dividido por 30; un mes suma solo si se trabajaron ≥18 días; el empleado solo puede TOMAR la parte entera del acumulado (0,algo NO es tomable → truncar hacia abajo, NO `Math.ceil`). El código actual tiene `mesesTrabajados = 12 - getMonth()` × 1.66 y `Math.ceil` — TODO ESO hay que rehacerlo. Detalle completo, conflicto y duda abierta en la sección "PENDIENTE PRINCIPAL". Solo afecta <1 año; ≥1 año = 20 fijo no cambia.

**Licencia de estudio (NUEVA, implementada):** tipo de licencia con `codigo` `ESTUDIO`. Solo empleados con `es_estudiante = true` tienen saldo de estudio. Días según horas semanales (`calcularDiasEstudio`): ≤36h → 6 días; 37-47h → 9 días; ≥48h → 12 días. **NO depende de antigüedad** (bolsa fija). **NO aplica la regla del sábado ni descuenta distinto por feriados** (confirmado por RRHH: se descuenta igual que la común en ese aspecto). NO requiere adjuntos/comprobante en el sistema.

**Notificaciones (Microsoft Graph):** al crear → mail al encargado. Al aprobar → mail al empleado + a todos@. Al rechazar → mail al empleado con motivo. Los mails nunca rompen el flujo (try/catch sin relanzar). Se registran en tabla Notificacion.

---

## CONTRATO HTTP (endpoints relevantes para el front)

Todos con prefijo `/api`. JWT en header `Authorization: Bearer <token>`.

- `POST /autenticacion/login` — body `{ email, contrasena }` → devuelve `{ token, usuario: { id, email, rol } }`. **El token está en la clave `token`** (no `access_token`).
- `GET /empleados/perfil` — perfil del usuario logueado. Devuelve empleado con `usuario` anidado (`usuario.email`, `usuario.rol`), `es_encargado` plano, `sector.nombre`. **Fuente de verdad de quién es el usuario.**
- `GET /empleados` (ADMIN) — lista con usuario y sector incluidos.
- `POST /empleados` (ADMIN) — crea usuario+empleado en transacción. Body: email, contrasena, nombre, apellido, fecha_ingreso, sector_id, es_encargado?, **es_estudiante?, horas_semanales?**.
- `PATCH /empleados/:id` (ADMIN) — actualiza. Todos los campos opcionales (PartialType).
- `PATCH /empleados/cambiar-contrasenia` (cualquier logueado) — **NUEVO.** Body `{ contrasena_actual, contrasena_nueva }`. El usuarioId sale del token (`@UsuarioActual()`), NO de la URL. Verifica la actual con bcrypt.compare; si no coincide → 401. Devuelve `{ mensaje }`, nunca el hash. **OJO: este endpoint DEBE ir ANTES del `@Patch(':id')` en el controlador**, o NestJS matchea "cambiar-contrasenia" como un :id y lo manda al método de actualizar (que es ADMIN-only → da "sin permisos"). Sin `@Roles`: el JwtGuardia a nivel de clase ya alcanza.
- `GET /saldos/mios?anio=` — devuelve ARRAY de saldos (uno por tipo), cada uno con `tipo_licencia` incluido y campo calculado `disponible`.
- `POST /saldos/generar` (ADMIN) — body `{ empleado_id, tipo_licencia_id, anio }`.
- `PATCH /saldos/ajustar` (ADMIN) — body `{ empleado_id, tipo_licencia_id, anio, dias }` (dias negativo resta).
- `POST /solicitudes` — body `{ tipo_licencia_id, dias: [fechas], comentario? }`.
- `GET /solicitudes/mias` — array, cada una con `dias` y `tipo_licencia` incluidos.
- `GET /solicitudes/pendientes` — (solo encargado) pendientes del sector, con `empleado` incluido.
- `PATCH /solicitudes/:id/aprobar`, `PATCH /solicitudes/:id/rechazar` (body `{ motivo_rechazo }`), `PATCH /solicitudes/:id/cancelar`.
- `GET /tipos-licencia` — **abierto a cualquier logueado** (se modificó para esto). POST/PATCH solo ADMIN.
- `GET /sectores`, `POST /sectores`, `PATCH /sectores/:id` (ADMIN).
- `GET /feriados`, `POST /feriados`, `PATCH /feriados/:id` (ADMIN).

---

## ESTRUCTURA DEL FRONTEND

```
app/
├── layout.js               (ProveedorAuth + fuente Red Hat)
├── globals.css             (@import tailwindcss + fuente)
├── page.js                 (Home: saludo, usa RutaProtegida)
├── login/page.js           (pantalla de login, sin barra)
├── saldo/page.js           (Mi Saldo)
├── solicitudes/
│   ├── page.js             (Mis Solicitudes, con cancelar)
│   └── nueva/page.js       (Pedir Licencia, calendario react-day-picker)
├── pendientes/page.js      (vista encargado: aprobar/rechazar)
└── admin/
    ├── page.js             (panel índice con tarjetas)
    ├── tipos/page.js       (ABM tipos de licencia)
    ├── sectores/page.js    (ABM sectores)
    ├── empleados/page.js   (ABM empleados, crea + EDITA)
    ├── feriados/page.js    (ABM feriados)
    └── saldos/page.js      (generar + ajustar saldos)
contexto/
└── contexto.js             (ProveedorAuth, usarAuth, iniciarSesion, cerrarSesion)
librerias/
└── api.js                  (pedirApi: wrapper de fetch con token)
componentes/
├── RutaProtegida.js        (protege rutas + incluye BarraNavegacion)
├── BarraNavegacion.js      (barra negra, links según rol/encargado)
└── EstadoBadge.js          (badge de estado con color semántico)
```

### Decisiones de arquitectura del front (ya tomadas, NO cambiar)
- **JWT en localStorage** (clave `token`). Pragmático para herramienta interna.
- **`pedirApi(ruta, { metodo, cuerpo })`** en `librerias/api.js` — inyecta el token, maneja errores (message string o array de NestJS), base URL desde `NEXT_PUBLIC_API_URL` (que incluye `/api`).
- **AuthContext** en `contexto/contexto.js`: al cargar, si hay token recupera el perfil. `iniciarSesion` guarda token → pide perfil → setea usuario. El perfil es la fuente de verdad.
- **RutaProtegida** envuelve cada página protegida: maneja "cargando", redirige al login si no hay usuario, y renderiza BarraNavegacion + el contenido. Dentro de él, `usuario` siempre existe (pero igual usar `?.` por la evaluación de children).
- **Chequeo de ADMIN** en las páginas de admin: `usuario?.usuario?.rol !== "ADMIN"` muestra mensaje de sin permisos.
- **Patrón de pantalla con datos:** trío de estados `datos` / `cargando` / `error`. Patrón de acción: "hacer PATCH/POST → recargar lista".
- **`.env.local` del front (local):** `NEXT_PUBLIC_API_URL=http://localhost:3000/api`. Script dev con `-p 3001`.
- **Variables de entorno en Railway (frontend):** `NEXT_PUBLIC_API_URL=https://mvp-licencias-seg-production.up.railway.app/api`.

---

## DEPLOY EN RAILWAY — COMPLETADO ✅

### URLs de producción
- **Backend:** `https://mvp-licencias-seg-production.up.railway.app`
- **Frontend:** `https://mvp-licecias-seg-frontend-production.up.railway.app`

### Configuración del backend en Railway

**Build:** Nixpacks builder, Node.js 22 (`.node-version` = `22` en raíz del backend).
- Comando de build: `pnpm run build` → que ejecuta `prisma generate && nest build`
- `generated/` está en `.gitignore` → se genera en Railway durante el build

**Start:** `npx prisma migrate deploy && node dist/src/main.js`
- `migrate deploy` aplica migraciones pendientes al conectar
- Output en `dist/src/main.js` (no `dist/main.js`) por la estructura del proyecto con `src/`

**Archivo `railway.json`:**
```json
{
  "build": { "builder": "NIXPACKS", "buildCommand": "pnpm run build" },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/src/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Variables de entorno en Railway (backend):**
- `DATABASE_URL` — connection string de Railway PostgreSQL
- `JWT_SECRET` — clave para firmar tokens
- `PORT` — lo inyecta Railway automáticamente

**CORS:** `origin: true` en `src/main.ts` — refleja cualquier origen. No necesita `FRONTEND_URL`.

**Datos iniciales:** el script `prisma/datosIniciales.ts` se corrió manualmente contra la DB de Railway con `pnpm tsx prisma/datosIniciales.ts` (con `DATABASE_URL` apuntando a Railway). **Los datos de producción ya están cargados.**

---

## ESTADO ACTUAL

### Backend: ETAPAS 1-10 COMPLETADAS ✅
Fundación, Autenticación (JWT), Usuarios/Empleados/Sectores, Tipos y Feriados, Calculador, Solicitudes, Saldos, Notificaciones, (Etapa 9 AuditLog pendiente), **Deploy a Railway ✅ HECHO**.

### Frontend: PANTALLAS MÍNIMAS + ADMIN COMPLETADAS ✅
- ✅ Login (real, con backend)
- ✅ Home / barra de navegación / RutaProtegida
- ✅ Mi Saldo (datos reales)
- ✅ Mis Solicitudes (con cancelar)
- ✅ Pedir Licencia (calendario días sueltos, funciona, regla del sábado verificada)
- ✅ Pendientes del Sector (encargado aprueba/rechaza con motivo)
- ✅ Panel admin + 5 ABM: tipos, sectores, empleados (crea + edita), feriados, saldos

### ✅ FLUJO REAL PROBADO end-to-end (local + producción)
Empleado pide licencia → encargado aprueba → saldo descontado. Login funciona en Railway. Datos reales de empleados cargados.

---

## ⚠️ PENDIENTE PRINCIPAL — Rehacer cálculo proporcional (<1 año) con la regla NUEVA de RRHH

### ⚠️ ESTA REGLA REEMPLAZA LO ANTERIOR. Leer con atención, hay un conflicto con el redondeo viejo.

**Regla que dio RRHH (sesión del 09/06/2026) — pendiente de codear:**
- Para empleados con **menos de un año**, el saldo se genera **mes a mes**.
- **Todo se calcula dividiendo por 30** (base 30 días/mes, NO los días reales del calendario).
- Un mes cuenta como mes trabajado **solo si se trabajaron 18 días o más** en ese mes. Si trabajó menos de 18 días en el mes (típicamente el mes de ingreso), ese mes NO suma.
- El saldo se acumula con decimales internamente (el "0,algo"), PERO **el empleado solo puede TOMAR la parte entera**. Con 0,X no puede tomar nada; recién con 1 entero puede tomar 1 día. El decimal sigue acumulándose para seguir creciendo, pero no es tomable como fracción.

**🔴 CONFLICTO IMPORTANTE con lo que estaba "confirmado" antes:**
- Antes RRHH había dicho "redondeo hacia arriba (`Math.ceil`), total al final". El código actual tiene `return Math.ceil(diasBase + diasExtra)`.
- La regla NUEVA dice lo CONTRARIO para lo tomable: 0,algo NO se puede tomar → eso es **truncar hacia abajo (`Math.floor`)**, no `Math.ceil`. Hay que reconciliar esto. Lo más probable: el `Math.ceil` del proporcional <1 año debe pasar a `Math.floor` (o manejar total_dias con decimal y truncar solo lo *disponible/tomable*). Definir bien con RRHH.
- OJO: esto puede implicar separar dos conceptos: lo que se ACUMULA (con decimal) vs lo que se puede TOMAR (entero, floor). Hoy el sistema tiene un solo `total_dias`. Pensar si total_dias guarda el decimal y el "disponible tomable" se trunca, o si se trunca al generar.

**DUDA A CONFIRMAR CON RRHH antes de codear:** ¿el umbral de 18 días aplica solo al mes de ingreso (parcial), o a todos los meses? (Lo lógico: solo el de ingreso; los demás se trabajan enteros y suman completos.)

**Dónde:** bloque `else` de `calcularDiasCorrespondientes` en `saldos.servicio.ts`. Backend → guiar, lo escribe el usuario. CUIDADO con la trampa de fechas/UTC al contar días trabajados en el mes de ingreso.

(La rama de antigüedad ≥1 año = 20 días fijos NO cambia. Los días extra por antigüedad tampoco. Esto es solo para <1 año.)

---

## ✅ HECHO EN LAS SESIONES RECIENTES

### Sesión del 11/06/2026 — Deploy a Railway
- **Deploy completo backend + frontend en Railway.** Ambos servicios en producción y funcionando. Login verificado con credenciales reales.
- **Configuración Railway resuelta:** builder Nixpacks (no Railpack), Node 22 via `.node-version`, `railway.json` con build y start commands.
- **Build pipeline corregido:** `prisma generate && nest build` para generar el cliente Prisma en Railway (no está en git); `tsconfig.build.json` excluye `prisma/`, `generated/` y `prisma.config.ts` para evitar que se expanda el rootDir y el output vaya a `dist/src/`.
- **CORS cambiado a `origin: true`:** no depende de `FRONTEND_URL` (que Nixpacks horneaba vacía en el Docker build). Funciona con cualquier frontend.
- **`prisma.config.ts` usa env var:** `process.env.DATABASE_URL` con fallback a localhost (antes tenía localhost hardcodeado → crasheaba en Railway).
- **Seed corrido contra Railway:** datos de empleados reales cargados en producción.
- **Artefactos de compilación ignorados:** `prisma.config.js/map/d.ts` y `tsconfig.build.tsbuildinfo` en `.gitignore`.

### Sesión anterior — Licencia de estudio + Cambiar contraseña
- **Licencia de estudio — IMPLEMENTADA Y PROBADA.** Campos `es_estudiante` + `horas_semanales` en Empleado (migración `empleado_estudiante` aplicada). Lógica en `saldos.servicio.ts` (`calcularDiasEstudio`, rama `codigo === 'ESTUDIO'` en `generarSaldo` que valida que sea estudiante). ABM de empleados (crea+edita) maneja los campos nuevos.
  - **BUG resuelto:** la comparación `tipoLicencia.codigo === 'ESTUDIO'` falló al inicio porque el código del tipo estaba cargado distinto (mayúsculas/espacios). **RECOMENDACIÓN pendiente (no aplicada):** blindar con `.trim().toUpperCase()` en la comparación, y/o normalizar el `codigo` a mayúsculas al crear el TipoLicencia en su servicio. Opcional.
- **Filtro de tipo Estudio en el front (Pedir Licencia).** En `app/solicitudes/nueva/page.js` se filtra: si `!usuario?.es_estudiante`, se oculta el tipo con `codigo === "ESTUDIO"` del select (variable `tiposVisibles`). Requiere que `GET /tipos-licencia` devuelva el campo `codigo`.
  - **DECISIÓN CONSCIENTE (no es olvido):** la validación de "no sos estudiante" vive SOLO en el front (filtro visual). NO se valida al crear la solicitud en el backend. Decidido así por ser sistema interno, usuarios sin conocimiento técnico, superficie de ataque nula. El agujero teórico (mandar la request a mano) se aceptó. NO reimplementar salvo que cambie el contexto.
- **Cambiar la propia contraseña — IMPLEMENTADA (back + front).**
  - Backend: DTO `cambiar-contrasenia.dto.ts` (`contrasena_actual`, `contrasena_nueva`); método `cambiarContrasenia(usuarioId, dto)` en `empleados.servicio.ts` (compara actual con bcrypt, 401 si no coincide, no devuelve hash); endpoint `PATCH /empleados/cambiar-contrasenia` con `@UsuarioActual()` (id del token, no de URL). **TRAMPA ya resuelta:** el endpoint debe ir ANTES de `@Patch(':id')` en el controlador o NestJS lo matchea como :id y el RolesGuardia (ADMIN) lo rebota con "sin permisos".
  - Frontend: pantalla nueva `app/cambiar-contrasena/page.js` (3 campos: actual, nueva, repetir; valida en cliente; manda solo actual+nueva al back por el `forbidNonWhitelisted`). Acceso vía nombre del usuario clickeable en `BarraNavegacion.js` (link a `/cambiar-contrasena`).
- **Editar empleados — bug de `fecha_ingreso` ARREGLADO.** Al editar, la `fecha_ingreso` viajaba como string y Prisma la rechazaba (`Expected ISO-8601 DateTime`). Fix en `empleados.servicio.ts`, método `actualizar`: destructurar `fecha_ingreso` del spread y convertir con `new Date(...)` en el data object.

---

## LO QUE FALTA / EN CURSO

### 🔲 Pedido del usuario, pendiente de hacer
1. **Activar/desactivar empleados.** REQUIERE CAMBIO DE BACKEND: hay DOS `esta_activo` (Usuario y Empleado). El login chequea el de **Usuario**. Para que "desactivar" bloquee el login, hay que: (a) agregar `esta_activo` opcional al `CrearEmpleadoDto` (lo hereda el Actualizar vía PartialType), y (b) en el servicio `actualizar`, sacar `esta_activo` del spread y actualizarlo en el **Usuario** (decidir si sincronizar ambos). DECISIÓN DE DISEÑO pendiente con el usuario.

### 🔲 BUG DEL MAIL (descubierto, no resuelto)
El mail SÍ intenta salir (Microsoft Graph conecta), pero falla con `GraphError: The requested user 'undefined' is invalid`. **El problema es el REMITENTE, no el destinatario** — le llega `undefined` como usuario emisor. Probable variable de entorno faltante (el `.env` tiene `SMTP_FROM=` vacío). Revisar `notificaciones.servicio.ts` para ver de dónde saca el remitente. Es bug de backend, acotado. En Railway también faltaría configurar las variables de Azure (AZURE_CLIENT_ID, etc.).

### 🔲 Pulidos de frontend
- Vestir el calendario de Pedir Licencia con colores SEG (hoy genérico/azul).
- Editar/desactivar en los demás ABM (tipos, sectores, feriados) — hoy solo crean y listan.
- Refactor: las funciones de fecha (`aFechaLocal`, `formatearRango`) están duplicadas en solicitudes/page.js y pendientes/page.js. Mover a `librerias/fechas.js`.

### 🔲 BUG CONOCIDO — `FeriadoControlador.actualizar` (fix listo, no aplicado)
El método `actualizar` tiene los decoradores cruzados: `@Param('id') @Body() id:string, actualizarFeriadoDto: ActualizarFeriadoDto`. Dos errores: (1) dos decoradores sobre el mismo parámetro `id` (gana `@Body()`, así que `id` recibe el body entero → `+id` da NaN); (2) el DTO queda sin `@Body()`, llega `undefined`. Resultado: la ruta PATCH de feriados está rota. **FIX (aplicar cuando se quiera, 30 seg):**
```ts
@Patch(':id')
async actualizar(
  @Param('id') id: string,
  @Body() actualizarFeriadoDto: ActualizarFeriadoDto,
) {
    return this.feriadoServicio.actualizar(+id, actualizarFeriadoDto);
}
```

### 🔲 Del backend original (Etapa 9 + extras)
- **Etapa 9 — Auditoría:** tabla `AuditLog`, registrar quién hizo qué (aprobaciones, ajustes, modificaciones de empleados) con valor anterior/nuevo.
- **Cron de saldos anuales:** `@nestjs/schedule`, que el 1 de enero genere saldos del año nuevo para empleados activos.
- **Limpiezas menores:** typo "solictu" en mensajes de error de solicitudes; `SaldosModulo` debería exportar su servicio y `SolicitudesModulo` importarlo (hoy duplicado en providers); revertir emails de prueba en `.env`.
- **Seed declarado en prisma.config.ts:** `prisma migrate reset` NO corre el seed automáticamente (no está bien declarado en `prisma.config.ts` para Prisma 7). Quedó pendiente dejarlo declarado para que el reset lo dispare solo, e idealmente que el seed cree un empleado estudiante de prueba + el TipoLicencia con código ESTUDIO.

---

## NOTAS DE ESTILO DE TRABAJO

- Ir **de a una pantalla/feature por vez**, no todo de golpe.
- Para el frontend: Claude entrega código completo, el usuario lo pega y prueba. Explicar qué hace cada parte nueva.
- Para el backend: guiar, no entregar hecho (el usuario lo escribe).
- Marcar proactivamente bugs detectados en el código del usuario.
- Confirmar la forma exacta de las respuestas del backend (pedir el servicio/DTO) antes de armar una pantalla, para no adivinar nombres de campos.
