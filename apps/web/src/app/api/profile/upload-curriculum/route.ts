import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Intentar obtener el usuario de las cookies primero
    let { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Si falla con cookies, intentar con header de autorización
    if (userError || !user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const { data: { user: headerUser }, error: headerError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        user = headerUser
        userError = headerError
      }
    }

    if (userError || !user) {
      console.error('Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-cv-${Date.now()}.${fileExt}`
    const filePath = `curriculums/${fileName}`

    // Subir archivo a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('curriculums')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading curriculum:', uploadError)
      return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('curriculums')
      .getPublicUrl(filePath)

    // Actualizar perfil con nueva URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        curriculum_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }
    
    return NextResponse.json({ cvUrl: publicUrl })
  } catch (error) {
    console.error('Error in upload-curriculum API:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
