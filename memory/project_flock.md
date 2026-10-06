---
name: project-flock-app
description: Contexto del producto Flock — stack, arquitectura y estado actual
metadata:
  type: project
---

App SaaS llamada Flock. Next.js 16 + Tailwind v4 + TypeScript. Directorio: /Users/nataliaortiz/Documents/APP.

**Stack:** Next.js 16 App Router, Tailwind v4 (config en CSS, sin tailwind.config.ts), @supabase/ssr para auth, next-themes para dark mode.

**Why:** Producto SaaS premium con identidad visual propia (Flock). Se construye feature por feature, sin romper lo existente.

**How to apply:** Cada nueva pantalla hereda los tokens CSS de globals.css. Componentes en /components/ui/. Auth con Supabase SSR en /lib/supabase/.

**Estado (2026-06-26):**
- ✅ Sistema de diseño: tokens, dark/light mode, Button, Card, Badge, Input, ThemeToggle
- ✅ Login: dos columnas, gradiente Flock, Microsoft Entra ID via Supabase OAuth (`azure` provider)
- ✅ Callback OAuth: /auth/callback/route.ts → upsertUser → redirect /inicio
- ✅ Middleware: protección de rutas, redirige a /login sin sesión
- ✅ Layout principal: sidebar premium dark + topbar integrado + área blanca
- ✅ Sidebar: gradiente multicapa #1C002C/#44016B, orbes sutiles, nav con indicador lateral activo, usuario en footer con menú desplegable, colapso a 64px
- ✅ TopBar: mismo gradiente dark que sidebar, integrado visualmente, notificaciones + avatar
- ✅ next-themes removido — theme provider propio sin conflicto React 19
- ⏳ Supabase: credenciales pendientes (.env.local con placeholders). SQL en supabase/migrations/001_users.sql
