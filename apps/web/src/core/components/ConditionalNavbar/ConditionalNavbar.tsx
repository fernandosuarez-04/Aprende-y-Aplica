'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '../Navbar';

interface ConditionalNavbarProps {
  children: React.ReactNode;
}

export function ConditionalNavbar({ children }: ConditionalNavbarProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isProfilePage = pathname.startsWith('/profile');
  const isNewsPage = pathname.startsWith('/news');
  
  return (
    <>
      {!isAuthPage && !isDashboardPage && !isProfilePage && !isNewsPage && <Navbar />}
      <main className={isAuthPage || isDashboardPage || isProfilePage || isNewsPage ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>
    </>
  );
}
