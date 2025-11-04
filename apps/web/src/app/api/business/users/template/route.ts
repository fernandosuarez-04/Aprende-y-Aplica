import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    // Crear plantilla CSV con headers
    const csvHeaders = [
      'username',
      'email',
      'first_name',
      'last_name',
      'display_name',
      'org_role',
      'password'
    ]

    // Agregar fila de ejemplo
    const csvExample = [
      csvHeaders.join(','),
      'usuario1,usuario1@empresa.com,Juan,Pérez,Juan Pérez,member,password123',
      'usuario2,usuario2@empresa.com,María,García,María García,member,password456',
      'usuario3,usuario3@empresa.com,Carlos,Ruiz,Carlos Ruiz,admin,password789'
    ].join('\n')

    // Crear respuesta con archivo CSV
    return new NextResponse(csvExample, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="plantilla-importacion-usuarios.csv"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al generar plantilla'
      },
      { status: 500 }
    )
  }
}
