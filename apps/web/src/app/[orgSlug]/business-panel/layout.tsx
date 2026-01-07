'use client';

import { BusinessPanelLayout } from '@/features/business-panel/components/BusinessPanelLayout'

export default function BusinessPanelLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <BusinessPanelLayout>{children}</BusinessPanelLayout>
}

