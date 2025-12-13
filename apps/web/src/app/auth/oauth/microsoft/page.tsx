'use client';

import { useEffect } from 'react';
import { initiateMicrosoftLogin } from '@/features/auth/actions/oauth';

export default function MicrosoftLoginInitPage() {
  useEffect(() => {
    initiateMicrosoftLogin();
  }, []);
  return null;
}


