import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - SOFLIA',
  description: 'Inicia sesión o crea una cuenta en SOFLIA',
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
