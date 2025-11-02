'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '../Navbar';
import { DashboardNavbar } from '../DashboardNavbar';
import { BusinessNavbar } from '../BusinessNavbar';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ConditionalNavbarProps {
  children: React.ReactNode;
}

export function ConditionalNavbar({ children }: ConditionalNavbarProps) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  
  const isAuthPage = pathname.startsWith('/auth');
  const isAdminPage = pathname.startsWith('/admin');
  const isInstructorPage = pathname.startsWith('/instructor');
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
  const isBusinessPage = pathname.startsWith('/business') && !pathname.startsWith('/business-panel') && !pathname.startsWith('/business-user');
  const isBusinessPanelPage = pathname.startsWith('/business-panel');
  const isBusinessUserPage = pathname.startsWith('/business-user');
  
  // Verificar si el usuario tiene rol Business o Business User
  const userRole = user?.cargo_rol?.toLowerCase().trim() || '';
  const isBusinessRole = userRole === 'business' || userRole === 'business user' || userRole.includes('business');
  const shouldHideNavbarForBusiness = isBusinessRole && (isStatisticsPage || isQuestionnairePage);
  
  // Determine which navbar to show
  // For the home page (/), always show the regular navbar UNLESS user is Business/Business User
  // NO mostrar navbar en páginas de /learn
  // NO mostrar navbar en /statistics y /questionnaire si el usuario es Business o Business User
  // NO mostrar navbar regular (Aprende y Aplica) si el usuario es Business o Business User
  const shouldShowBusinessNavbar = isBusinessPage;
  const shouldShowDashboardNavbar = pathname !== '/' && !isLearnPage && !isBusinessPage && !isBusinessPanelPage && !isBusinessUserPage && !shouldHideNavbarForBusiness && (isDashboardPage || isNewsPage || isAIDirectoryPage || isCommunitiesPage || isStatisticsPage || isQuestionnairePage || isCoursePage || isMyCoursesPage);
  const shouldShowRegularNavbar = !shouldShowDashboardNavbar && !shouldShowBusinessNavbar && !isProfilePage && !isAdminPage && !isInstructorPage && !isCreditsPage && !isReelsPage && !isLearnPage && !isAuthPage && !isBusinessPanelPage && !isBusinessUserPage && !isBusinessRole;
  
  return (
    <>
      {/* Mostrar BusinessNavbar para página business */}
      {shouldShowBusinessNavbar && <BusinessNavbar />}
      
      {/* Mostrar DashboardNavbar para páginas del dashboard */}
      {shouldShowDashboardNavbar && <DashboardNavbar activeItem={getActiveItem(pathname)} />}
      
      {/* Mostrar Navbar regular para páginas que no son del dashboard */}
      {shouldShowRegularNavbar && <Navbar />}
      
      <main className={shouldShowDashboardNavbar || shouldShowBusinessNavbar || isProfilePage || isAdminPage || isInstructorPage || isCreditsPage || isReelsPage || isAuthPage || isBusinessPanelPage || isBusinessUserPage || shouldHideNavbarForBusiness || isBusinessRole ? '' : 'pt-16 lg:pt-20'}>
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
