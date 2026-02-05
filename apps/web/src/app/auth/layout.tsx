import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutenticaciÃ³n - SOFLIA',
  description: 'Inicia sesiÃ³n o crea una cuenta en SOFLIA',
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
