import { redirect } from 'next/navigation';
import { SessionService } from '../../features/auth/services/session.service';

export default async function MyCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado
  const user = await SessionService.getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  return <>{children}</>;
}

