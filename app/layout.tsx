import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header>
          <nav>
            <a href="/">Inicio</a>
            <a href="/about">Nosotros</a>
            <a href="/blog">Blog</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>© {new Date().getFullYear()} Mi Sitio</footer>
      </body>
    </html>
  )
}
