import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - Aprende y Aplica',
  description: 'Inicia sesión o crea una cuenta en Aprende y Aplica',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
