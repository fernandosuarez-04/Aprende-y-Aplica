
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de Validación (Zod)
const MaterialSchema = z.object({
    title: z.string(),
    type: z.enum(['quiz', 'reading', 'document', 'exercise', 'pdf', 'link']),
    content_data: z.record(z.any()), // JSONB flexible
    order_index: z.number(),
    estimated_time_minutes: z.number().optional().default(10),
})

const LessonSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    order_index: z.number(),
    video_provider: z.enum(['youtube', 'vimeo', 'direct', 'custom']),
    video_provider_id: z.string(),
    duration_seconds: z.number(),
    transcript_content: z.string().optional(),
    summary_content: z.string().optional(),
    materials: z.array(MaterialSchema).optional().default([]),
})

const ModuleSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    order_index: z.number(),
    lessons: z.array(LessonSchema),
})

const CourseImportPayloadSchema = z.object({
    course: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        level: z.enum(['beginner', 'intermediate', 'advanced']),
        instructor_email: z.string().email(),
        thumbnail_url: z.string().nullable(),
        slug: z.string(),
        price: z.number().default(0),
        learning_objectives: z.array(z.string()).optional().default([]),
    }),
    modules: z.array(ModuleSchema),
    source: z.object({
        platform: z.literal('courseforge'),
        artifact_id: z.string(),
    }),
})

export async function POST(request: Request) {
    try {
        // 1. Validar API Key
        const apiKey = request.headers.get('x-api-key')
        const validApiKey = process.env.COURSEFORGE_API_KEY

        if (!validApiKey || apiKey !== validApiKey) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid or missing API Key' },
                { status: 401 }
            )
        }

        // 2. Parsear y Validar Payload
        const body = await request.json()
        const validation = CourseImportPayloadSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validation.error.format() },
                { status: 400 }
            )
        }

        const { course: courseData, modules, source } = validation.data
        const supabase = await createClient()

        // 3. Verificar Instructor
        const { data: instructor, error: instructorError } = await supabase
            .from('users')
            .select('id')
            .eq('email', courseData.instructor_email)
            .single()

        if (instructorError || !instructor) {
            return NextResponse.json(
                { error: `Instructor not found: ${courseData.instructor_email}` },
                { status: 404 }
            )
        }

        // 4. Verificar Slug Duplicado (Opcional: añadir sufijo o rechazar)
        const { data: existingSlug } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', courseData.slug)
            .single()

        if (existingSlug) {
            return NextResponse.json(
                { error: `Slug already exists: ${courseData.slug}` },
                { status: 409 }
            )
        }

        // 5. Inserción Transaccional (Simulada, Supabase no soporta tnx anidadas via cliente simple fácilmente, hacemos secuencial con manejo de error)
        // NOTA: En un entorno de producción ideal usaríamos una RPC function para atomicidad total.
        // Por simplicidad y compatibilidad con RLS/Auth, insertamos secuencialmente.

        // A. Crear Curso
        const { data: newCourse, error: createError } = await supabase
            .from('courses')
            .insert({
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                level: courseData.level,
                instructor_id: instructor.id,
                thumbnail_url: courseData.thumbnail_url,
                slug: courseData.slug,
                price: courseData.price,
                is_active: false, // Siempre inactivo al inicio
                approval_status: 'pending',
                learning_objectives: courseData.learning_objectives,
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating course:', createError)
            return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
        }

        // B. Crear Módulos y Lecciones
        try {
            for (const mod of modules) {
                // Crear Módulo
                const { data: newModule, error: modError } = await supabase
                    .from('course_modules')
                    .insert({
                        course_id: newCourse.id,
                        module_title: mod.title,
                        module_description: mod.description,
                        module_order_index: mod.order_index,
                        is_published: false,
                        module_duration_minutes: 0, // Se podría calcular
                    })
                    .select()
                    .single()

                if (modError) throw modError

                for (const lesson of mod.lessons) {
                    // Crear Lección
                    const { data: newLesson, error: lessonError } = await supabase
                        .from('course_lessons')
                        .insert({
                            module_id: newModule.module_id,
                            instructor_id: instructor.id, // Heredar instructor
                            lesson_title: lesson.title,
                            lesson_description: lesson.description,
                            lesson_order_index: lesson.order_index,
                            video_provider: lesson.video_provider,
                            video_provider_id: lesson.video_provider_id,
                            duration_seconds: lesson.duration_seconds,
                            transcript_content: lesson.transcript_content,
                            summary_content: lesson.summary_content,
                            is_published: false,
                        })
                        .select()
                        .single()

                    if (lessonError) throw lessonError

                    // Crear Materiales
                    if (lesson.materials.length > 0) {
                        const materialsToInsert = lesson.materials.map(mat => ({
                            lesson_id: newLesson.lesson_id,
                            material_title: mat.title,
                            material_type: mat.type,
                            content_data: mat.content_data,
                            material_order_index: mat.order_index,
                            estimated_time_minutes: mat.estimated_time_minutes,
                        }))

                        const { error: matError } = await supabase
                            .from('lesson_materials')
                            .insert(materialsToInsert)

                        if (matError) throw matError
                    }
                }
            }

            // TODO: Log import event in a future table if desired

            return NextResponse.json({
                success: true,
                course_id: newCourse.id,
                message: 'Course imported successfully and awaiting approval.'
            })

        } catch (insertError) {
            console.error('Error inserting modules/lessons:', insertError)
            // Rollback manual (Borrar curso creado parcial)
            await supabase.from('courses').delete().eq('id', newCourse.id)

            return NextResponse.json(
                { error: 'Partial processing failure. Rolled back.', details: String(insertError) },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
