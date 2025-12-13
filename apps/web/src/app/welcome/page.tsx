import { Suspense } from 'react';
import WelcomeClient from './welcome-client';
import Loading from '../loading';

export default function WelcomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <WelcomeClient />
    </Suspense>
  );
}

