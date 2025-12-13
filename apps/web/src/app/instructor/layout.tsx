import { Metadata } from 'next'
import { InstructorLayout } from '@/features/instructor/components'
import { ThemeProvider } from '@/core/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Panel de Instructor | Aprende y Aplica',
  description: 'Panel de instructor para gestionar cursos, estudiantes y contenido educativo.',
}

export default function InstructorLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <InstructorLayout>{children}</InstructorLayout>
    </ThemeProvider>
  )
}

