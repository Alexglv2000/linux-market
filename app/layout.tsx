import type { Metadata } from 'next'
import { Providers } from './providers'
import { TauriTitlebar } from '@/components/tauri-titlebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Linux-Market — Software para Linux y Soluciones Inmediatas',
  description: 'Ecosistema de gestión minorista nativo para Linux. Seguridad de grado militar, hardware locking y sincronización en tiempo real. Creado para usuarios exigentes.',
  icons: {
    icon: '/iconolinuxmarket.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden min-h-screen">
        <Providers>
          <TauriTitlebar />
          <div id="app-content">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
