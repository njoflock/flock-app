import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function DesignSystemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] gradient-brand" />
            <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">
              Flock
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge variant="brand">Sistema de Diseño</Badge>
          <h1 className="text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Bienvenido a{" "}
            <span className="gradient-brand-text">Flock</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Identidad visual consistente, premium y moderna. Claro u oscuro, siempre Flock.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button size="lg">Comenzar</Button>
            <Button size="lg" variant="secondary">Ver docs</Button>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Paleta de color</h2>
          <div className="grid grid-cols-5 gap-4">
            {[
              { name: "Naranja", hex: "#FF5102" },
              { name: "Violeta", hex: "#7F07C5" },
              { name: "Morado", hex: "#44016B" },
              { name: "Morado oscuro", hex: "#1C002C" },
              { name: "Blanco", hex: "#FFFFFF" },
            ].map((c) => (
              <div key={c.hex} className="space-y-2">
                <div
                  className="h-20 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="text-xs font-medium text-[var(--text-secondary)]">{c.name}</p>
                <p className="text-xs text-[var(--text-tertiary)] font-mono">{c.hex}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-[var(--radius-md)] gradient-brand shadow-[var(--shadow-card)]" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Gradiente de marca</p>
            <p className="text-xs text-[var(--text-tertiary)] font-mono">#FF5102 → #7F07C5</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Botones</h2>
          <Card className="p-8 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Variantes</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primario</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Peligro</Button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Tamaños</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Pequeño</Button>
                <Button size="md">Mediano</Button>
                <Button size="lg">Grande</Button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Estados</p>
              <div className="flex flex-wrap gap-3">
                <Button loading>Cargando</Button>
                <Button disabled>Deshabilitado</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Badges</h2>
          <Card className="p-8">
            <div className="flex flex-wrap gap-3">
              <Badge variant="brand">Marca</Badge>
              <Badge variant="muted">Neutral</Badge>
              <Badge variant="success">Éxito</Badge>
              <Badge variant="warning">Advertencia</Badge>
              <Badge variant="danger">Error</Badge>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Inputs</h2>
          <Card className="p-8 space-y-4 max-w-md">
            <Input label="Correo electrónico" placeholder="tu@email.com" type="email" />
            <Input label="Con hint" placeholder="Escribe aquí..." hint="Mínimo 8 caracteres." />
            <Input label="Con error" placeholder="..." error="Este campo es obligatorio." />
            <Input placeholder="Sin label" />
          </Card>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Tipografía</h2>
          <Card className="p-8 space-y-4">
            <p className="text-5xl font-bold text-[var(--text-primary)]">Display</p>
            <p className="text-3xl font-semibold text-[var(--text-primary)]">Heading 1</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">Heading 2</p>
            <p className="text-xl font-medium text-[var(--text-primary)]">Heading 3</p>
            <p className="text-base text-[var(--text-primary)]">Body — texto principal de la interfaz.</p>
            <p className="text-sm text-[var(--text-secondary)]">Secondary — texto de apoyo y descripciones.</p>
            <p className="text-xs text-[var(--text-tertiary)]">Caption — metadatos, etiquetas y hints.</p>
            <p className="text-sm font-mono text-[var(--text-secondary)]">#FF5102 — monospace para código.</p>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Cards</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 space-y-2">
              <Badge variant="muted">Default</Badge>
              <h3 className="font-semibold text-[var(--text-primary)]">Card estándar</h3>
              <p className="text-sm text-[var(--text-secondary)]">Bordes redondeados, sombra sutil y fondo blanco.</p>
            </Card>
            <Card elevated className="p-6 space-y-2">
              <Badge variant="brand">Elevated</Badge>
              <h3 className="font-semibold text-[var(--text-primary)]">Card elevada</h3>
              <p className="text-sm text-[var(--text-secondary)]">Mayor sombra para jerarquía visual.</p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="h-8 w-8 rounded-[var(--radius-md)] gradient-brand" />
              <h3 className="font-semibold text-[var(--text-primary)]">Con acento</h3>
              <p className="text-sm text-[var(--text-secondary)]">Combinación con gradiente de marca.</p>
              <Button size="sm" className="w-full">Acción</Button>
            </Card>
          </div>
        </section>

      </main>

      <footer className="border-t border-[var(--border-subtle)] mt-24">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-[var(--text-tertiary)]">Flock Design System v1.0</p>
          <p className="text-sm text-[var(--text-tertiary)]">© 2026 Flock</p>
        </div>
      </footer>
    </div>
  );
}
