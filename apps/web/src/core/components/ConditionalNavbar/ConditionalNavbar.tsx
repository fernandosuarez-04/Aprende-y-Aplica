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
  
  return (
    <>
      {!isAuthPage && !isDashboardPage && !isProfilePage && <Navbar />}
      <main className={isAuthPage || isDashboardPage || isProfilePage ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>
    </>
  );
}
