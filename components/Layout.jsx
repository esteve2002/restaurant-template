import { useTheme } from "@/hooks/useTheme";

export default function Layout({ children, type }) {
  const theme = useTheme(type);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.secondary,
        fontFamily: theme.font.body,
      }}
    >
      <header
        className="p-6 border-b shadow-sm"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: theme.font.title }}
        >
          🍽️ Restaurante Demo
        </h1>
      </header>

      <main className="max-w-5xl mx-auto py-10 px-4">{children}</main>

      <footer className="p-6 mt-10 text-center text-sm opacity-70">
        © 2026 — Web generada automáticamente
      </footer>
    </div>
  );
}
