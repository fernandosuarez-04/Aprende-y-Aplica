import { redirect } from 'next/navigation';
import { SessionService } from '../../features/auth/services/session.service';
import { OrganizationStylesProvider } from '../../features/business-panel/contexts/OrganizationStylesContext';

export default async function StudyPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado
  const user = await SessionService.getCurrentUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <OrganizationStylesProvider>
      {children}
    </OrganizationStylesProvider>
  );
}

