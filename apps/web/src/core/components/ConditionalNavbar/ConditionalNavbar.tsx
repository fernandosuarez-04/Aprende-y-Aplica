'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '../Navbar';
import { DashboardNavbar } from '../DashboardNavbar';

interface ConditionalNavbarProps {
  children: React.ReactNode;
}

export function ConditionalNavbar({ children }: ConditionalNavbarProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isProfilePage = pathname.startsWith('/profile');
  const isNewsPage = pathname.startsWith('/news');
  const isAIDirectoryPage = pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory');
  const isCommunitiesPage = pathname.startsWith('/communities');
  const isStatisticsPage = pathname.startsWith('/statistics');
  const isQuestionnairePage = pathname.startsWith('/questionnaire');
  const isCoursePage = pathname.startsWith('/courses') && !pathname.includes('/learn');
  const isMyCoursesPage = pathname.startsWith('/my-courses');
  const isCreditsPage = pathname.startsWith('/credits');
  const isReelsPage = pathname.startsWith('/reels');
  const isLearnPage = pathname.includes('/learn');
  
  // Determine which navbar to show
  // For the home page (/), always show the regular navbar
  // NO mostrar navbar en páginas de /learn
  const shouldShowDashboardNavbar = pathname !== '/' && !isLearnPage && (isDashboardPage || isNewsPage || isAIDirectoryPage || isCommunitiesPage || isStatisticsPage || isQuestionnairePage || isCoursePage || isMyCoursesPage);
  const shouldShowRegularNavbar = !shouldShowDashboardNavbar && !isProfilePage && !isAdminPage && !isCreditsPage && !isReelsPage && !isLearnPage;
  
  return (
    <>
      {/* Mostrar DashboardNavbar para páginas del dashboard */}
      {shouldShowDashboardNavbar && <DashboardNavbar activeItem={getActiveItem(pathname)} />}
      
      {/* Mostrar Navbar regular para páginas que no son del dashboard */}
      {shouldShowRegularNavbar && <Navbar />}
      
      <main className={shouldShowDashboardNavbar || isProfilePage || isAdminPage || isCreditsPage || isReelsPage ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>
    </>
  );
}

// Helper function to determine active item based on pathname
function getActiveItem(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'workshops';
  if (pathname.startsWith('/my-courses')) return 'workshops'; // Mis cursos se considera parte de workshops
  if (pathname.startsWith('/news')) return 'news';
  if (pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory')) return 'directory';
  if (pathname.startsWith('/communities')) return 'community';
  if (pathname.startsWith('/statistics')) return 'statistics';
  if (pathname.startsWith('/questionnaire')) return 'workshops'; // El cuestionario se considera parte de workshops
  if (pathname.startsWith('/courses')) return 'workshops'; // Las páginas de cursos se consideran parte de workshops
  return 'workshops';
}
