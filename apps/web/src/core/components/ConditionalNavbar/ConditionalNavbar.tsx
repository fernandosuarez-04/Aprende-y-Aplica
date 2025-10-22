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
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isProfilePage = pathname.startsWith('/profile');
  const isNewsPage = pathname.startsWith('/news');
  const isAIDirectoryPage = pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory');
  const isCommunitiesPage = pathname.startsWith('/communities');
  
  // Determine which navbar to show
  const shouldShowDashboardNavbar = isDashboardPage || isNewsPage || isAIDirectoryPage || isCommunitiesPage;
  const shouldShowRegularNavbar = !isAuthPage && !shouldShowDashboardNavbar && !isProfilePage;
  
  return (
    <>
      {shouldShowRegularNavbar && <Navbar />}
      {shouldShowDashboardNavbar && <DashboardNavbar activeItem={getActiveItem(pathname)} />}
      <main className={isAuthPage || shouldShowDashboardNavbar || isProfilePage ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>
    </>
  );
}

// Helper function to determine active item based on pathname
function getActiveItem(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'workshops';
  if (pathname.startsWith('/news')) return 'news';
  if (pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory')) return 'directory';
  if (pathname.startsWith('/communities')) return 'community';
  return 'workshops';
}
