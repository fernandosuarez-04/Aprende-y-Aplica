import { redirect } from 'next/navigation';
import { SessionService } from '../../features/auth/services/session.service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado usando nuestro sistema de sesiones
  const user = await SessionService.getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-carbon">
      {children}
    </div>
  );
}
