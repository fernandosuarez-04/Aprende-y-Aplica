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
  
  return (
    <>
      {!isAuthPage && !isDashboardPage && <Navbar />}
      <main className={isAuthPage || isDashboardPage ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>
    </>
  );
}
