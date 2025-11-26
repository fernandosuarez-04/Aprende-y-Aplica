/**
 * Script para insertar traducciones de ejemplo en el directorio de apps IA
 *
 * Uso:
 * 1. Instalar ts-node si no lo tienes: npm install -g ts-node
 * 2. Ejecutar: ts-node scripts/seed-app-translations.ts
 *
 * O agregar a package.json:
 * "scripts": {
 *   "seed:translations": "ts-node scripts/seed-app-translations.ts"
 * }
 * Y ejecutar: npm run seed:translations
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface AppTranslation {
  app_id: string
  language: 'en' | 'pt'
  name: string
  description: string
  long_description: string
  features: string[]
  use_cases: string[]
  advantages: string[]
  disadvantages: string[]
}

// Traducciones de ejemplo
const sampleTranslations: Omit<AppTranslation, 'app_id'>[] = [
  // Inglés
  {
    language: 'en',
    name: 'AI Content Generator',
    description: 'Create amazing content with artificial intelligence',
    long_description:
      'This powerful AI tool helps you generate high-quality content for your marketing campaigns, social media posts, blog articles, and more. Using advanced language models, it can understand your requirements and produce engaging, original content in seconds.',
    features: [
      'Advanced GPT-4 integration',
      'Multiple content formats',
      'Customizable tone and style',
      'Real-time content generation',
      'Multi-language support',
    ],
    use_cases: [
      'Blog post creation',
      'Social media content',
      'Email marketing campaigns',
      'Product descriptions',
      'SEO optimization',
    ],
    advantages: [
      'Fast content generation',
      'High-quality output',
      'Cost-effective solution',
      'Easy to use interface',
      'Regular updates and improvements',
    ],
    disadvantages: [
      'Requires internet connection',
      'Monthly subscription needed',
      'Learning curve for advanced features',
    ],
  },
  // Portugués
  {
    language: 'pt',
    name: 'Gerador de Conteúdo IA',
    description: 'Crie conteúdo incrível com inteligência artificial',
    long_description:
      'Esta poderosa ferramenta de IA ajuda você a gerar conteúdo de alta qualidade para suas campanhas de marketing, posts de mídias sociais, artigos de blog e muito mais. Usando modelos de linguagem avançados, pode entender seus requisitos e produzir conteúdo envolvente e original em segundos.',
    features: [
      'Integração avançada com GPT-4',
      'Múltiplos formatos de conteúdo',
      'Tom e estilo personalizáveis',
      'Geração de conteúdo em tempo real',
      'Suporte multilíngue',
    ],
    use_cases: [
      'Criação de posts de blog',
      'Conteúdo para mídias sociais',
      'Campanhas de email marketing',
      'Descrições de produtos',
      'Otimização SEO',
    ],
    advantages: [
      'Geração rápida de conteúdo',
      'Saída de alta qualidade',
      'Solução econômica',
      'Interface fácil de usar',
      'Atualizações e melhorias regulares',
    ],
    disadvantages: [
      'Requer conexão com internet',
      'Assinatura mensal necessária',
      'Curva de aprendizado para recursos avançados',
    ],
  },
]

async function getFirstActiveApp() {
  const { data, error } = await supabase
    .from('ai_apps')
    .select('app_id, name')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('❌ Error obteniendo apps:', error)
    return null
  }

  return data
}

async function insertTranslations(appId: string) {
  console.log('📝 Insertando traducciones...')

  for (const translation of sampleTranslations) {
    const { error } = await supabase
      .from('app_directory_translations')
      .upsert(
        {
          app_id: appId,
          ...translation,
        },
        {
          onConflict: 'app_id,language',
        }
      )

    if (error) {
      console.error(`❌ Error insertando traducción (${translation.language}):`, error)
    } else {
      console.log(`✅ Traducción insertada: ${translation.language}`)
    }
  }
}

async function verifyTranslations(appId: string) {
  console.log('\n🔍 Verificando traducciones insertadas...')

  const { data, error } = await supabase
    .from('app_directory_translations')
    .select('*')
    .eq('app_id', appId)

  if (error) {
    console.error('❌ Error verificando traducciones:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No se encontraron traducciones')
    return
  }

  console.log(`✅ Traducciones encontradas: ${data.length}`)
  data.forEach((t: any) => {
    console.log(`   - ${t.language}: ${t.name}`)
  })
}

async function main() {
  console.log('🚀 Iniciando script de traducciones...\n')

  // 1. Obtener primera app activa
  console.log('1️⃣ Obteniendo primera app activa...')
  const app = await getFirstActiveApp()

  if (!app) {
    console.error('❌ No se encontró ninguna app activa en la base de datos')
    console.log('\n💡 Asegúrate de tener al menos una app en la tabla ai_apps con is_active = true')
    process.exit(1)
  }

  console.log(`✅ App encontrada: ${app.name} (${app.app_id})`)

  // 2. Insertar traducciones
  console.log('\n2️⃣ Insertando traducciones...')
  await insertTranslations(app.app_id)

  // 3. Verificar traducciones
  await verifyTranslations(app.app_id)

  console.log('\n✨ Script completado exitosamente!')
  console.log('\n📋 Próximos pasos:')
  console.log('1. Ve a http://localhost:3000/apps-directory')
  console.log('2. Cambia el idioma a "Português" o "English"')
  console.log('3. Deberías ver el contenido traducido')
}

// Ejecutar script
main()
  .then(() => {
    console.log('\n👋 Saliendo...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
