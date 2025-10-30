import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

/**
 * Endpoint para migrar encuestas antiguas sin estructura votes/userVotes
 *
 * IMPORTANTE: Solo ejecutar una vez para corregir datos existentes
 *
 * GET /api/admin/migrate-polls
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient();

    logger.log('🔄 [POLL MIGRATION] Iniciando migración de encuestas...');

    // Obtener todos los posts de tipo 'poll'
    const { data: polls, error: pollsError } = await supabase
      .from('community_posts')
      .select('id, attachment_data, content')
      .eq('attachment_type', 'poll');

    if (pollsError) {
      logger.error('Error obteniendo encuestas:', pollsError);
      return NextResponse.json({ error: 'Error obteniendo encuestas' }, { status: 500 });
    }

    if (!polls || polls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay encuestas para migrar',
        migrated: 0
      });
    }

    logger.log(`📊 [POLL MIGRATION] Encontradas ${polls.length} encuestas`);

    let migratedCount = 0;
    const errors: string[] = [];

    for (const poll of polls) {
      try {
        const pollData = poll.attachment_data;

        // Verificar si ya tiene la estructura correcta
        if (pollData.votes && typeof pollData.votes === 'object') {
          logger.log(`✅ [POLL MIGRATION] Encuesta ${poll.id} ya tiene estructura correcta`);
          continue;
        }

        // La encuesta necesita migración
        logger.log(`🔧 [POLL MIGRATION] Migrando encuesta ${poll.id}...`);

        // Verificar que tenga options
        if (!pollData.options || !Array.isArray(pollData.options)) {
          logger.warn(`⚠️ [POLL MIGRATION] Encuesta ${poll.id} no tiene options válidas`);
          errors.push(`Poll ${poll.id}: No options array`);
          continue;
        }

        // Crear estructura votes inicializada
        const votes: Record<string, string[]> = {};
        pollData.options.forEach((option: string) => {
          votes[option] = [];
        });

        // Crear estructura actualizada
        const updatedPollData = {
          ...pollData,
          votes: votes,
          userVotes: pollData.userVotes || {}
        };

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('community_posts')
          .update({
            attachment_data: updatedPollData,
            updated_at: new Date().toISOString()
          })
          .eq('id', poll.id);

        if (updateError) {
          logger.error(`❌ [POLL MIGRATION] Error actualizando ${poll.id}:`, updateError);
          errors.push(`Poll ${poll.id}: ${updateError.message}`);
          continue;
        }

        migratedCount++;
        logger.log(`✅ [POLL MIGRATION] Encuesta ${poll.id} migrada exitosamente`);

      } catch (error) {
        logger.error(`❌ [POLL MIGRATION] Error procesando poll ${poll.id}:`, error);
        errors.push(`Poll ${poll.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.log(`🎉 [POLL MIGRATION] Migración completa: ${migratedCount}/${polls.length} encuestas migradas`);

    return NextResponse.json({
      success: true,
      message: 'Migración completada',
      total: polls.length,
      migrated: migratedCount,
      alreadyCorrect: polls.length - migratedCount - errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('❌ [POLL MIGRATION] Error en migración:', error);
    return NextResponse.json(
      { error: 'Error en migración', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
