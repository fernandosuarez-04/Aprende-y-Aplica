# Plan de Implementación: Moderación con IA (OpenAI API)

## 📋 Resumen Ejecutivo

Este documento describe la implementación de una **segunda capa de moderación** usando la **API de OpenAI** para analizar contenido que pasa el filtro inicial de palabras prohibidas. Esta capa adicional detecta:

- Lenguaje ofensivo contextual
- Insultos sutiles o indirectos
- Acoso o bullying
- Contenido inapropiado disfrazado
- Spam sofisticado
- Discurso de odio implícito

---

## 🎯 Objetivos

1. **Complementar el filtro de palabras** con análisis contextual
2. **Detectar contenido tóxico sofisticado** que evade filtros simples
3. **Usar IA para análisis semántico** del contenido
4. **Mantener tasa baja de falsos positivos** con moderación humana opcional
5. **Registrar análisis para mejorar el sistema** continuamente

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  Usuario Crea Post/Comentario           │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│            CAPA 1: Filtro de Palabras Prohibidas       │
│  (Sistema Actual - Rápido, Sin Costo)                  │
└─────────────────────┬───────────────────────────────────┘
                      ↓
          ¿Contiene palabras prohibidas?
                      ↓
         ┌────────────┴────────────┐
         │                         │
        SÍ                        NO
         │                         │
         ↓                         ↓
    BLOQUEADO              ┌──────────────────┐
    + ADVERTENCIA          │  CAPA 2: AI      │
                           │  (OpenAI API)    │
                           └────────┬─────────┘
                                    ↓
                        Análisis de Contenido con IA
                                    ↓
                  ┌─────────────────┴──────────────┐
                  │                                │
            APROPIADO                        INAPROPIADO
                  │                                │
                  ↓                                ↓
          POST PUBLICADO                    BLOQUEADO
                                          + ADVERTENCIA
                                       + Flag para Revisión
```

---

## 📝 PASO 1: Configurar Variables de Entorno

### 1.1 Agregar API Key de OpenAI

**Archivo:** `.env.local`

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MODERATION_ENABLED=true

# Moderación Avanzada
AI_MODERATION_CONFIDENCE_THRESHOLD=0.7
AI_MODERATION_AUTO_BAN_THRESHOLD=0.95
```

### 1.2 Variables de Configuración

| Variable | Descripción | Valor Recomendado |
|----------|-------------|-------------------|
| `OPENAI_API_KEY` | API Key de OpenAI | Tu key privada |
| `OPENAI_MODEL` | Modelo a usar | `gpt-4o-mini` (más económico) |
| `OPENAI_MODERATION_ENABLED` | Activar/desactivar IA | `true` |
| `AI_MODERATION_CONFIDENCE_THRESHOLD` | Umbral para bloquear | `0.7` (70%) |
| `AI_MODERATION_AUTO_BAN_THRESHOLD` | Umbral para ban automático | `0.95` (95%) |

---

## 📝 PASO 2: Actualizar Base de Datos

### 2.1 SQL para Nuevas Tablas y Funciones

**Archivo:** `database-fixes/moderacion-ai.sql`

```sql
-- ============================================================================
-- MODERACIÓN CON IA - SEGUNDA CAPA
-- ============================================================================

-- Tabla para registrar análisis de IA
CREATE TABLE IF NOT EXISTS public.ai_moderation_logs (
    log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('post', 'comment', 'other')),
    content_id uuid,
    content_text text NOT NULL,
    
    -- Resultados del análisis
    is_flagged boolean NOT NULL DEFAULT false,
    confidence_score numeric(3,2), -- 0.00 a 1.00
    categories jsonb, -- Categorías detectadas por OpenAI
    reasoning text, -- Explicación de la IA
    
    -- Metadata
    model_used text,
    api_response jsonb,
    processing_time_ms integer,
    
    -- Estado
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT ai_moderation_logs_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_user_id ON public.ai_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_created_at ON public.ai_moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_flagged ON public.ai_moderation_logs(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_status ON public.ai_moderation_logs(status) WHERE status = 'under_review';

-- Comentarios
COMMENT ON TABLE public.ai_moderation_logs IS 'Registro de análisis de contenido con IA para moderación';
COMMENT ON COLUMN public.ai_moderation_logs.confidence_score IS 'Nivel de confianza de la IA (0.00 a 1.00)';
COMMENT ON COLUMN public.ai_moderation_logs.categories IS 'Categorías detectadas por OpenAI (hate, harassment, violence, etc)';
COMMENT ON COLUMN public.ai_moderation_logs.status IS 'Estado del contenido: pending, approved, rejected, under_review';

-- Tabla para configuración de moderación AI
CREATE TABLE IF NOT EXISTS public.ai_moderation_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key text NOT NULL UNIQUE,
    config_value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);

-- Insertar configuración por defecto
INSERT INTO public.ai_moderation_config (config_key, config_value, description) VALUES
    ('enabled', 'true', 'Activar/desactivar moderación con IA'),
    ('confidence_threshold', '0.7', 'Umbral de confianza para bloquear contenido (0.0 a 1.0)'),
    ('auto_ban_threshold', '0.95', 'Umbral para baneo automático sin revisión humana'),
    ('require_human_review', 'true', 'Requiere revisión humana para contenido flaggeado'),
    ('categories_to_flag', '["hate", "harassment", "violence", "sexual", "self-harm"]', 'Categorías que activan el flag')
ON CONFLICT (config_key) DO NOTHING;

-- Función para registrar análisis de IA
CREATE OR REPLACE FUNCTION public.register_ai_moderation_analysis(
    p_user_id uuid,
    p_content_type text,
    p_content_id uuid,
    p_content_text text,
    p_is_flagged boolean,
    p_confidence_score numeric,
    p_categories jsonb,
    p_reasoning text,
    p_model_used text,
    p_api_response jsonb,
    p_processing_time_ms integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.ai_moderation_logs (
        user_id,
        content_type,
        content_id,
        content_text,
        is_flagged,
        confidence_score,
        categories,
        reasoning,
        model_used,
        api_response,
        processing_time_ms,
        status
    ) VALUES (
        p_user_id,
        p_content_type,
        p_content_id,
        p_content_text,
        p_is_flagged,
        p_confidence_score,
        p_categories,
        p_reasoning,
        p_model_used,
        p_api_response,
        p_processing_time_ms,
        CASE 
            WHEN p_is_flagged THEN 'under_review'
            ELSE 'approved'
        END
    )
    RETURNING log_id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Función para obtener estadísticas de moderación AI
CREATE OR REPLACE FUNCTION public.get_ai_moderation_stats(
    p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_analyzed', COUNT(*),
        'total_flagged', COUNT(*) FILTER (WHERE is_flagged = true),
        'pending_review', COUNT(*) FILTER (WHERE status = 'under_review'),
        'average_confidence', AVG(confidence_score) FILTER (WHERE is_flagged = true),
        'average_processing_time_ms', AVG(processing_time_ms),
        'by_category', (
            SELECT jsonb_object_agg(
                category,
                COUNT(*)
            )
            FROM (
                SELECT jsonb_array_elements_text(categories) as category
                FROM ai_moderation_logs
                WHERE created_at > NOW() - (p_days || ' days')::interval
                AND is_flagged = true
            ) cat_data
        )
    ) INTO v_stats
    FROM ai_moderation_logs
    WHERE created_at > NOW() - (p_days || ' days')::interval;
    
    RETURN v_stats;
END;
$$;

-- Vista para contenido pendiente de revisión
CREATE OR REPLACE VIEW public.ai_moderation_pending_review AS
SELECT 
    aml.log_id,
    aml.user_id,
    u.username,
    u.email,
    aml.content_type,
    aml.content_id,
    LEFT(aml.content_text, 100) as content_preview,
    aml.is_flagged,
    aml.confidence_score,
    aml.categories,
    aml.reasoning,
    aml.created_at,
    (SELECT COUNT(*) FROM user_warnings WHERE user_id = aml.user_id) as user_warning_count
FROM ai_moderation_logs aml
JOIN users u ON aml.user_id = u.id
WHERE aml.status = 'under_review'
ORDER BY aml.confidence_score DESC, aml.created_at DESC;

-- RLS Policies
ALTER TABLE public.ai_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_moderation_config ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden ver logs de moderación
CREATE POLICY "Admins can view ai moderation logs"
    ON public.ai_moderation_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND cargo_rol = 'administrador'
        )
    );

-- Solo administradores pueden actualizar configuración
CREATE POLICY "Admins can manage ai moderation config"
    ON public.ai_moderation_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND cargo_rol = 'administrador'
        )
    );

-- Grants
GRANT EXECUTE ON FUNCTION public.register_ai_moderation_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_moderation_stats TO authenticated;

-- Comentarios finales
COMMENT ON FUNCTION public.register_ai_moderation_analysis IS 'Registra el análisis de contenido realizado por IA';
COMMENT ON FUNCTION public.get_ai_moderation_stats IS 'Obtiene estadísticas de moderación con IA de los últimos N días';
COMMENT ON VIEW public.ai_moderation_pending_review IS 'Vista de contenido pendiente de revisión humana';
```

---

## 📝 PASO 3: Crear Servicio de Moderación con OpenAI

### 3.1 Archivo de Servicio

**Archivo:** `apps/web/src/lib/ai-moderation.ts`

```typescript
import OpenAI from 'openai';

// Tipos
export interface AIModerationResult {
  isInappropriate: boolean;
  confidence: number; // 0.0 a 1.0
  categories: string[];
  reasoning: string;
  requiresHumanReview: boolean;
  processingTimeMs: number;
}

export interface ModerationCategory {
  hate: boolean;
  'hate/threatening': boolean;
  harassment: boolean;
  'harassment/threatening': boolean;
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  sexual: boolean;
  'sexual/minors': boolean;
  violence: boolean;
  'violence/graphic': boolean;
}

// Configuración
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_MODERATION_ENABLED = process.env.OPENAI_MODERATION_ENABLED === 'true';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7');
const AUTO_BAN_THRESHOLD = parseFloat(process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95');

// Cliente de OpenAI
let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

/**
 * Analiza contenido usando la API de Moderación de OpenAI
 */
export async function analyzeContentWithAI(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  // Si la moderación AI está desactivada o no hay API key
  if (!AI_MODERATION_ENABLED || !openai) {
    console.log('⚠️ AI Moderation is disabled or API key missing');
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    // Usar la API de Moderación de OpenAI
    const moderationResponse = await openai.moderations.create({
      input: content,
    });

    const result = moderationResponse.results[0];
    const processingTimeMs = Date.now() - startTime;

    // Extraer categorías flaggeadas
    const flaggedCategories: string[] = [];
    let maxScore = 0;

    Object.entries(result.categories).forEach(([category, isFlagged]) => {
      if (isFlagged) {
        flaggedCategories.push(category);
        const score = result.category_scores[category as keyof typeof result.category_scores];
        if (score > maxScore) {
          maxScore = score;
        }
      }
    });

    // Si hay categorías flaggeadas, usar el score más alto
    const confidence = flaggedCategories.length > 0 ? maxScore : 0;
    const isInappropriate = result.flagged && confidence >= CONFIDENCE_THRESHOLD;

    // Generar razonamiento basado en categorías
    let reasoning = '';
    if (result.flagged && flaggedCategories.length > 0) {
      reasoning = `Contenido flaggeado por: ${flaggedCategories.join(', ')}. Confianza: ${(confidence * 100).toFixed(1)}%`;
    } else {
      reasoning = 'Contenido apropiado según análisis de IA';
    }

    // Determinar si requiere revisión humana
    const requiresHumanReview = 
      isInappropriate && 
      confidence < AUTO_BAN_THRESHOLD &&
      confidence >= CONFIDENCE_THRESHOLD;

    console.log('🤖 AI Moderation Result:', {
      isInappropriate,
      confidence: (confidence * 100).toFixed(1) + '%',
      categories: flaggedCategories,
      requiresHumanReview,
      processingTimeMs,
    });

    return {
      isInappropriate,
      confidence,
      categories: flaggedCategories,
      reasoning,
      requiresHumanReview,
      processingTimeMs,
    };

  } catch (error) {
    console.error('❌ Error in AI moderation:', error);
    
    // En caso de error, ser conservador y permitir el contenido
    // pero registrar para revisión manual
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Analiza contenido con análisis contextual avanzado usando GPT
 * (Alternativa más cara pero más precisa)
 */
export async function analyzeContentWithGPT(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  if (!AI_MODERATION_ENABLED || !openai) {
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    const systemPrompt = `Eres un moderador de contenido experto para una comunidad educativa de IA. 
Tu tarea es analizar contenido y determinar si es apropiado.

Debes detectar:
- Lenguaje ofensivo o insultos (directos o indirectos)
- Acoso o bullying
- Discurso de odio (racismo, sexismo, homofobia, etc.)
- Spam o contenido promocional no deseado
- Amenazas o violencia
- Contenido sexual inapropiado

Responde SOLO con un objeto JSON válido con este formato:
{
  "isInappropriate": boolean,
  "confidence": number (0.0 a 1.0),
  "categories": string[],
  "reasoning": string
}`;

    const userPrompt = `Analiza este ${context?.contentType || 'contenido'}:

"${content}"

${context?.previousWarnings ? `Nota: Este usuario tiene ${context.previousWarnings} advertencias previas.` : ''}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(responseText);

    const processingTimeMs = Date.now() - startTime;

    return {
      isInappropriate: analysis.isInappropriate || false,
      confidence: analysis.confidence || 0,
      categories: analysis.categories || [],
      reasoning: analysis.reasoning || 'Sin razón proporcionada',
      requiresHumanReview: 
        analysis.isInappropriate && 
        analysis.confidence < AUTO_BAN_THRESHOLD &&
        analysis.confidence >= CONFIDENCE_THRESHOLD,
      processingTimeMs,
    };

  } catch (error) {
    console.error('❌ Error in GPT moderation:', error);
    
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación GPT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Registra el análisis de IA en la base de datos
 */
export async function logAIModerationAnalysis(
  userId: string,
  contentType: 'post' | 'comment',
  contentId: string | null,
  content: string,
  result: AIModerationResult,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase.rpc('register_ai_moderation_analysis', {
      p_user_id: userId,
      p_content_type: contentType,
      p_content_id: contentId,
      p_content_text: content,
      p_is_flagged: result.isInappropriate,
      p_confidence_score: result.confidence,
      p_categories: JSON.stringify(result.categories),
      p_reasoning: result.reasoning,
      p_model_used: OPENAI_MODEL,
      p_api_response: null,
      p_processing_time_ms: result.processingTimeMs,
    });

    if (error) {
      console.error('Error logging AI moderation:', error);
    }
  } catch (error) {
    console.error('Exception logging AI moderation:', error);
  }
}

/**
 * Verifica si el usuario debe ser baneado automáticamente
 * basado en el nivel de confianza de la IA
 */
export function shouldAutoBan(result: AIModerationResult): boolean {
  return result.isInappropriate && result.confidence >= AUTO_BAN_THRESHOLD;
}
```

---

## 📝 PASO 4: Integrar en API de Posts

### 4.1 Modificar `route.ts` de Posts

**Archivo:** `apps/web/src/app/api/communities/[slug]/posts/route.ts`

Agregar después de la validación del filtro de palabras prohibidas:

```typescript
// ⭐ MODERACIÓN CAPA 2: Análisis con IA (después del filtro de palabras)
if (!forbiddenCheck.contains) {
  // Importar servicio de IA
  const { 
    analyzeContentWithAI, 
    logAIModerationAnalysis,
    shouldAutoBan 
  } = await import('../../../../../lib/ai-moderation');
  
  // Analizar contenido con IA
  const aiResult = await analyzeContentWithAI(content, {
    contentType: 'post',
    userId: user.id,
    previousWarnings: await getUserWarningsCount(user.id),
  });
  
  // Registrar análisis en BD (sin await para no bloquear)
  logAIModerationAnalysis(
    user.id,
    'post',
    null,
    content,
    aiResult,
    supabase
  ).catch(err => console.error('Error logging AI analysis:', err));
  
  // Si la IA detectó contenido inapropiado
  if (aiResult.isInappropriate) {
    try {
      // Si el nivel de confianza es muy alto, baneo automático
      if (shouldAutoBan(aiResult)) {
        const warningResult = await registerWarning(
          user.id,
          content,
          'post'
        );
        
        return NextResponse.json(
          { 
            error: '❌ Contenido altamente inapropiado detectado. Has sido baneado automáticamente.',
            banned: true,
            aiAnalysis: {
              confidence: aiResult.confidence,
              categories: aiResult.categories,
              reasoning: aiResult.reasoning,
            }
          },
          { status: 403 }
        );
      }
      
      // Si requiere revisión humana, marcar para revisión pero permitir por ahora
      if (aiResult.requiresHumanReview) {
        logger.log('⚠️ Content flagged for human review:', {
          userId: user.id,
          confidence: aiResult.confidence,
          categories: aiResult.categories,
        });
        
        // El contenido se publica pero queda marcado para revisión
        // Los administradores pueden revisar en el panel de moderación
      } else {
        // Bloquear y registrar advertencia
        const warningResult = await registerWarning(
          user.id,
          content,
          'post'
        );
        
        if (warningResult.userBanned) {
          return NextResponse.json(
            { 
              error: '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
              banned: true
            },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { 
            error: `🤖 El contenido ha sido identificado como inapropiado por nuestro sistema de IA. ${warningResult.message}`,
            warning: true,
            warningCount: warningResult.warningCount,
            aiAnalysis: {
              confidence: aiResult.confidence,
              categories: aiResult.categories,
              reasoning: aiResult.reasoning,
            }
          },
          { status: 400 }
        );
      }
    } catch (error) {
      logger.error('Error processing AI moderation result:', error);
      // En caso de error, permitir el contenido pero loggearlo
    }
  }
}
```

---

## 📝 PASO 5: Integrar en API de Comentarios

### 5.1 Modificar `route.ts` de Comentarios

**Archivo:** `apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts`

Agregar el mismo código después del filtro de palabras prohibidas (igual que en posts).

---

## 📝 PASO 6: Instalar Dependencias

### 6.1 Instalar SDK de OpenAI

```bash
npm install openai
# o
yarn add openai
# o
pnpm add openai
```

---

## 📝 PASO 7: Panel de Administración para Revisión

### 7.1 Crear Página de Revisión

**Archivo:** `apps/web/src/app/admin/moderation-ai/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PendingReview {
  log_id: string;
  user_id: string;
  username: string;
  email: string;
  content_type: string;
  content_preview: string;
  confidence_score: number;
  categories: string[];
  reasoning: string;
  created_at: string;
  user_warning_count: number;
}

export default function AIModerationPanel() {
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ai_moderation_pending_review')
      .select('*')
      .order('confidence_score', { ascending: false });

    if (!error && data) {
      setPending(data);
    }
    
    setLoading(false);
  }

  async function handleReview(logId: string, action: 'approve' | 'reject') {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('ai_moderation_logs')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('log_id', logId);

    if (!error) {
      setPending(prev => prev.filter(p => p.log_id !== logId));
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Moderación con IA - Revisión Pendiente
      </h1>
      
      <div className="bg-white rounded-lg shadow">
        {pending.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay contenido pendiente de revisión
          </div>
        ) : (
          <div className="divide-y">
            {pending.map((item) => (
              <div key={item.log_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-500">
                      {item.username} ({item.email})
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.user_warning_count} advertencias previas
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {(item.confidence_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">confianza</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm">{item.content_preview}...</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-xs text-gray-600 mb-1">
                    Categorías: {item.categories?.join(', ') || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">
                    Razón: {item.reasoning}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(item.log_id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReview(item.log_id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Rechazar y Advertir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📊 Diagrama de Flujo Completo

```
Usuario Crea Post/Comentario
          ↓
[CAPA 1: Filtro Palabras Prohibidas]
          ↓
    ¿Palabra prohibida?
          ↓
    ┌─────┴─────┐
   SÍ          NO
    ↓           ↓
BLOQUEADO   [CAPA 2: AI Moderation]
    +              ↓
ADVERTENCIA   OpenAI API Análisis
                  ↓
        ¿Contenido inapropiado?
                  ↓
           ┌──────┴──────┐
          SÍ            NO
           ↓             ↓
    ¿Confianza > 95%?   POST
           ↓         PUBLICADO
     ┌─────┴─────┐
    SÍ          NO
     ↓           ↓
  BANEO    ¿Confianza > 70%?
 AUTOMÁTICO      ↓
           ┌─────┴─────┐
          SÍ          NO
           ↓           ↓
      BLOQUEADO    PUBLICADO
         +            +
    ADVERTENCIA   FLAG PARA
                  REVISIÓN
```

---

## 🧪 Testing

### Test 1: Contenido Obvio
```typescript
// Debería ser bloqueado por CAPA 1 (palabras prohibidas)
"Eres un idiota"
```

### Test 2: Contenido Sutil
```typescript
// Debería pasar CAPA 1 pero ser detectado por CAPA 2 (AI)
"No me sorprende que pienses eso, claramente no tienes la capacidad mental"
```

### Test 3: Contenido Contextual
```typescript
// Debería ser detectado por AI
"Deberías dejar de existir, el mundo estaría mejor sin ti"
```

### Test 4: Contenido Apropiado
```typescript
// Debería pasar ambas capas
"Gracias por compartir, muy interesante tu punto de vista"
```

---

## 💰 Estimación de Costos

### OpenAI Moderation API
- **Gratis** para moderación básica
- Muy rápida (~200-300ms)

### GPT-4o-mini
- **~$0.15 por 1M tokens input**
- ~$0.60 por 1M tokens output
- Estimado: **~$0.0001 por análisis** (100 tokens aprox)
- 10,000 posts/mes = **~$1 USD/mes**

### Recomendación
Usar **Moderation API (gratis)** para casos normales y GPT solo cuando se necesite análisis contextual avanzado.

---

## ✅ Checklist de Implementación

- [ ] Agregar variables de entorno (API Key)
- [ ] Ejecutar SQL (`moderacion-ai.sql`)
- [ ] Instalar SDK de OpenAI (`npm install openai`)
- [ ] Crear servicio `ai-moderation.ts`
- [ ] Integrar en API de posts
- [ ] Integrar en API de comentarios
- [ ] Crear panel de administración
- [ ] Probar con diferentes tipos de contenido
- [ ] Ajustar umbrales de confianza según necesidad
- [ ] Monitorear costos de API

---

## 🎯 Próximos Pasos

1. **Implementar CAPA 1** (palabras prohibidas) - ✅ YA HECHO
2. **Implementar CAPA 2** (IA) - Este documento
3. **Monitorear y ajustar** umbrales de confianza
4. **Agregar más categorías** de detección
5. **Machine Learning** propio en el futuro

---

¡Sistema de moderación de 2 capas completo! 🎉
