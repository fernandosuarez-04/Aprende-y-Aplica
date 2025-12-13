'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  DollarSign,
  Lightbulb,
  BarChart3,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  BookOpen,
  Users,
  RefreshCw,
  Award
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';

// Componente del gráfico de radar
const RadarChart = ({ data, dimensions }: { data: any[], dimensions: string[] }) => {
  const maxValue = 100;
  const centerX = 250;  // ✅ Aumentado para dar más espacio
  const centerY = 250;  // ✅ Aumentado para dar más espacio
  const radius = 180;   // ✅ Aumentado para hacer el radar más grande
  
  const angleStep = (2 * Math.PI) / dimensions.length;

  // Calcular puntos para cada dimensión usando valores reales
  const points = dimensions.map((dimension, index) => {
    const dataItem = data.find(d => d.dimension === dimension);
    const value = dataItem?.score ?? 0;

    // Usar el valor real directamente (ya está en escala 0-100)
    const scaledValue = value;

    const angle = index * angleStep - Math.PI / 2; // Empezar desde arriba
    const x = centerX + (radius * (scaledValue / maxValue)) * Math.cos(angle);
    const y = centerY + (radius * (scaledValue / maxValue)) * Math.sin(angle);
    return { x, y, value, scaledValue, dimension, angle };
  });
  
  // Crear path para el polígono
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg width="500" height="500" viewBox="0 0 500 500" className="w-full h-auto">
        {/* Grid circular */}
        {[20, 40, 60, 80, 100].map((value, index) => (
          <circle
            key={value}
            cx={centerX}
            cy={centerY}
            r={radius * (value / maxValue)}
            fill="none"
            stroke="rgba(0, 0, 0, 0.1)"
            className="dark:stroke-white/10"
            strokeWidth="1"
          />
        ))}
        
        {/* Líneas radiales */}
        {dimensions.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="rgba(0, 0, 0, 0.1)"
              className="dark:stroke-white/10"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Polígono de datos */}
        <motion.path
          d={pathData}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Puntos de datos */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="rgb(99, 102, 241)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          />
        ))}
        
        {/* Etiquetas de dimensiones con más espacio */}
        {points.map((point, index) => {
          const labelAngle = point.angle;
          const labelRadius = radius + 50; // ✅ Aumentado de 30 a 50 para más espacio
          const labelX = centerX + labelRadius * Math.cos(labelAngle);
          const labelY = centerY + labelRadius * Math.sin(labelAngle);
          
          return (
            <text
              key={index}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 dark:fill-white text-sm font-medium"
              style={{ fontSize: '14px' }} // ✅ Tamaño fijo para consistencia
            >
              {point.dimension}
            </text>
          );
        })}
        
        {/* Etiquetas de valores */}
        {points.map((point, index) => (
          <text
            key={`value-${index}`}
            x={point.x}
            y={point.y - 18}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 dark:fill-white text-xs font-bold"
            style={{ fontSize: '12px' }} // ✅ Tamaño fijo para consistencia
          >
            {point.value}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Componente de tarjeta de estadística
const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = "blue",
  delay = 0 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  color?: string;
  delay?: number;
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600", 
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-lg dark:shadow-xl"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-2xl font-bold text-primary mb-2">{value}</p>
          <p className="text-gray-700 dark:text-white/60 text-sm">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Componente de gráfico de barras para países
const CountryBarChart = ({ data, userCountry }: { data: any[], userCountry?: string }) => {
  // Filtrar datos válidos y calcular máximo
  const validData = data.filter(d => d && d.indice_aipi != null);
  const maxValue = validData.length > 0 ? Math.max(...validData.map(d => d.indice_aipi)) : 1;
  
  // Encontrar el país del usuario en los datos (con normalización de acentos)
  const userCountryData = userCountry ? validData.find(c => 
    c.pais && normalizeCountryName(c.pais) === normalizeCountryName(userCountry)
  ) : null;
  
  return (
    <div className="space-y-2">
      {validData.map((country, index) => {
        const isUserCountry = userCountryData && country.pais === userCountryData.pais;
        
        return (
          <motion.div
            key={country.pais || `country-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className={`group flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer ${
              isUserCountry ? 'bg-yellow-500/20 dark:bg-yellow-500/20 border border-yellow-500/30 dark:border-yellow-500/30' : ''
            }`}
          >
            <div className="w-24 text-right">
              <span className={`text-sm font-medium truncate block group-hover:text-gray-900 dark:group-hover:text-white transition-colors ${
                isUserCountry ? 'text-yellow-600 dark:text-yellow-300 font-bold' : 'text-gray-900 dark:text-white/80'
              }`}>
                {country.pais || 'N/A'}
                {isUserCountry && <span className="ml-1 text-yellow-400">⭐</span>}
              </span>
            </div>
              <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-6 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((country.indice_aipi || 0) / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.05 + 0.5, duration: 1 }}
                  className={`h-full rounded-full relative overflow-hidden group-hover:brightness-125 transition-all duration-300 ${
                    isUserCountry 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                      : 'bg-gradient-to-r from-primary to-purple-500'
                  }`}
                >
                  {/* Efecto de brillo en hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </motion.div>
                {/* Tooltip en hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                  {country.pais}: {(country.indice_aipi || 0).toFixed(3)}
                  {isUserCountry && ' (Tu país)'}
                </div>
              </div>
              <div className="w-16 text-left">
                <span className={`text-sm font-bold group-hover:text-gray-900 dark:group-hover:text-white transition-colors ${
                  isUserCountry ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-900 dark:text-white/80'
                }`}>
                {(country.indice_aipi || 0).toFixed(2)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Función para normalizar nombres de países (eliminar acentos y normalizar espacios)
const normalizeCountryName = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (acentos)
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples
};

export default function StatisticsResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation('statistics-results');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [updatingDifficulty, setUpdatingDifficulty] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkUserDataAndRedirect();
    }
  }, [authLoading, user]);

  const checkUserDataAndRedirect = async () => {
    try {
      const supabase = createClient();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Verificar si el usuario tiene perfil
      const { data: userProfile, error: profileError } = await supabase
        .from('user_perfil')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        // console.log('🔍 Usuario sin perfil, redirigiendo a personalizar experiencia');
        router.push('/statistics');
        return;
      }

      // Verificar si el usuario tiene respuestas
      const { data: responses, error: responsesError } = await supabase
        .from('respuestas')
        .select('id')
        .eq('user_perfil_id', userProfile.id)
        .limit(1);

      if (responsesError || !responses || responses.length === 0) {
        // console.log('🔍 Usuario sin respuestas, redirigiendo a personalizar experiencia');
        router.push('/statistics');
        return;
      }

      // console.log('🔍 Usuario tiene datos, cargando estadísticas');
      // Si tiene datos, cargar las estadísticas
      fetchStatisticsData();
    } catch (error) {
      // console.error('Error verificando datos del usuario:', error);
      router.push('/statistics');
    }
  };

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      // Obtener perfil del usuario
      const { data: userProfile, error: profileError } = await supabase
        .from('user_perfil')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        setError('Perfil de usuario no encontrado');
        return;
      }

      // Guardar el perfil del usuario en el estado
      setUserProfile(userProfile);

      // Obtener respuestas del usuario
      const { data: responses, error: responsesError } = await supabase
        .from('respuestas')
        .select(`
          *,
          preguntas (
            id,
            section,
            bloque,
            peso,
            escala,
            scoring,
            respuesta_correcta,
            texto,
            dimension,
            dificultad
          )
        `)
        .eq('user_perfil_id', userProfile.id);

      if (responsesError) {
        // console.warn('Error al obtener respuestas:', responsesError);
      }

      // Obtener datos de adopción por países
      const { data: adoptionData, error: adoptionError } = await supabase
        .from('adopcion_genai')
        .select('*')
        .order('indice_aipi', { ascending: false });

      if (adoptionError) {
        // console.warn('Error al obtener datos de adopción:', adoptionError);
      }

      // Log simplificado de respuestas recibidas
      console.log('📋 Total de respuestas recibidas:', responses?.length || 0);

      // Log para debug de Inversión
      console.log('📋 Preguntas 16-18:', responses?.filter(r => r.pregunta_id >= 16 && r.pregunta_id <= 18).map(r => ({
        id: r.pregunta_id,
        bloque: r.preguntas?.bloque,
        section: r.preguntas?.section,
        texto: r.preguntas?.texto?.substring(0, 80) + '...',
        valor: r.valor
      })));
      
      // Procesar datos para el radar (pasar dificultad_id del usuario)
      const processedRadarData = processRadarData(responses || [], userProfile.dificultad_id);
      console.log('📊 Datos del radar procesados:', processedRadarData);
      setRadarData(processedRadarData);

      // Procesar análisis
      const analysis = processAnalysis(responses || [], userProfile);
      setAnalysisData(analysis);

      // Procesar recomendaciones
      const recs = generateRecommendations(processedRadarData, analysis);
      setRecommendations(recs);

      // Datos de países
      setCountryData(adoptionData || []);

    } catch (error) {
      // console.error('Error al obtener estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Normaliza el score según la dificultad del usuario
   * - Dificultad 1: máximo 20 puntos (20%) - escala proporcional
   * - Dificultad 2: máximo 40 puntos (40%) - escala proporcional
   * - Dificultad 3: máximo 60 puntos (60%) - escala proporcional
   * - Dificultad 4: máximo 80 puntos (80%) - escala proporcional
   * - Dificultad 5: máximo 100 puntos (100%) - sin escalar
   * 
   * Ejemplo: Si el usuario tiene dificultad 1 y obtiene 50 puntos (50%),
   * el score normalizado será 10 puntos (50% de 20 = 10)
   */
  const normalizeScoreByDifficulty = (score: number, userDifficulty: number | null | undefined): number => {
    if (!userDifficulty || userDifficulty < 1 || userDifficulty > 5) {
      // Si no hay dificultad definida, retornar el score sin normalizar
      return score;
    }

    const maxScoreByDifficulty: { [key: number]: number } = {
      1: 20,
      2: 40,
      3: 60,
      4: 80,
      5: 100
    };

    const maxScore = maxScoreByDifficulty[userDifficulty] || 100;
    
    // Normalización proporcional: escalar el score según el máximo permitido
    // Si el score es 50 y el máximo es 20, entonces: 50 * 20 / 100 = 10
    // Si el score es 100 y el máximo es 20, entonces: 100 * 20 / 100 = 20
    const normalizedScore = (score * maxScore) / 100;
    
    return Math.round(normalizedScore);
  };

  // Función para calcular la dificultad desde el uso de IA
  const calcularDificultad = (uso_ia: string): number => {
    const usoIALower = uso_ia.toLowerCase().trim();
    
    if (usoIALower.includes('siempre') || usoIALower.includes('todos los días') || usoIALower.includes('todos o casi todos los días')) {
      return 5;
    } else if (usoIALower.includes('frecuentemente') || usoIALower.includes('casi siempre') || usoIALower.includes('3-4 veces por semana')) {
      return 4;
    } else if (usoIALower.includes('a veces') || usoIALower.includes('ocasionalmente') || usoIALower.includes('1-2 veces por semana')) {
      return 3;
    } else if (usoIALower.includes('rara vez') || usoIALower.includes('casi nunca') || usoIALower.includes('1-2 veces al mes')) {
      return 2;
    } else {
      return 1; // Nunca (por defecto)
    }
  };

  // Función para actualizar la dificultad del usuario
  const handleUpdateDifficulty = async () => {
    if (!selectedDifficulty) {
      alert('Por favor selecciona una opción');
      return;
    }

    try {
      setUpdatingDifficulty(true);
      const supabase = createClient();

      if (!user || !userProfile) {
        alert('Error: Usuario no autenticado');
        return;
      }

      // Calcular la nueva dificultad
      const nuevaDificultad = calcularDificultad(selectedDifficulty);

      // Actualizar el perfil del usuario
      const { error: updateError } = await supabase
        .from('user_perfil')
        .update({ 
          dificultad_id: nuevaDificultad,
          uso_ia_respuesta: selectedDifficulty
        })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error al actualizar dificultad:', updateError);
        alert('Error al actualizar la dificultad. Por favor intenta de nuevo.');
        return;
      }

      // Actualizar el estado local
      setUserProfile({
        ...userProfile,
        dificultad_id: nuevaDificultad
      });

      // Cerrar el modal y redirigir al cuestionario
      setShowDifficultyModal(false);
      router.push('/questionnaire/direct');
    } catch (error) {
      console.error('Error al actualizar dificultad:', error);
      alert('Error al actualizar la dificultad. Por favor intenta de nuevo.');
    } finally {
      setUpdatingDifficulty(false);
    }
  };

  const processRadarData = (responses: any[], userDifficulty: number | null | undefined = null) => {
    const dimensions = ['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión'];
    
    // Procesar scores por dimensión
    
    const scores = dimensions.map(dimension => {
      const relevantResponses = responses.filter(response => {
        // Usar el campo dimension directamente de la pregunta (es un array jsonb)
        const questionDimensions = response.preguntas?.dimension;
        
        // Si la pregunta tiene el campo dimension, usarlo directamente
        if (questionDimensions && Array.isArray(questionDimensions)) {
          return questionDimensions.includes(dimension);
        }
        
        // Fallback: usar la lógica anterior si no hay campo dimension
        const section = response.preguntas?.section || '';
        const bloque = response.preguntas?.bloque || '';
        const texto = response.preguntas?.texto?.toLowerCase() || '';
        const preguntaId = response.pregunta_id;

        // Log de debug para preguntas 13-18 (todas las de Conocimiento)
        if (preguntaId >= 13 && preguntaId <= 18) {
          console.log(`🔍 Evaluando pregunta ${preguntaId} para dimensión ${dimension}:`, {
            preguntaId,
            bloque,
            section,
            texto_preview: texto.substring(0, 50)
          });
        }

        // Mapear sección/bloque a dimensión de manera más inteligente
        let mappedDimension = '';

        // 1. Mapeo directo por bloque (si existe)
        if (bloque === 'Productividad' || bloque === 'productividad') {
          mappedDimension = 'Productividad';
        } else if (bloque === 'Estrategia' || bloque === 'estrategia') {
          mappedDimension = 'Estrategia';
        } else if (bloque === 'Inversión' || bloque === 'Inversion' || bloque === 'inversión' || bloque === 'inversion') {
          mappedDimension = 'Inversión';
        } else if (bloque === 'Adopción') {
          // 2. Para bloque "Adopción", distribuir por ID de pregunta
          // IDs 7-8: Aplicación (uso frecuente de herramientas)
          // IDs 9-10: Productividad (frecuencia de uso)
          // IDs 11-12: Estrategia (planificación y adopción estratégica)
          if (preguntaId >= 7 && preguntaId <= 8) {
            mappedDimension = 'Aplicación';
          } else if (preguntaId >= 9 && preguntaId <= 10) {
            mappedDimension = 'Productividad';
          } else if (preguntaId >= 11 && preguntaId <= 12) {
            mappedDimension = 'Estrategia';
          } else {
            // Fallback: distribuir por texto
            if (texto.includes('frecuencia') || texto.includes('uso') || texto.includes('aplicación') || texto.includes('aplicar')) {
              mappedDimension = 'Aplicación';
            } else if (texto.includes('productividad') || texto.includes('eficiencia') || texto.includes('optimizar')) {
              mappedDimension = 'Productividad';
            } else if (texto.includes('estrategia') || texto.includes('planificación') || texto.includes('plan')) {
              mappedDimension = 'Estrategia';
            } else {
              mappedDimension = 'Aplicación'; // Default para Adopción
            }
          }
        } else if (bloque === 'Conocimiento') {
          // 3. Para "Conocimiento", distribuir por ID de pregunta
          // IDs 13-15: Conocimiento (conceptos básicos)
          // IDs 16-17: Inversión (presupuesto, capacitación)
          // ID 18: Estrategia (contratos, gobernanza)

          // Log para debug
          if (preguntaId >= 16 && preguntaId <= 18) {
            console.log(`🔍 Mapeando pregunta ${preguntaId}:`, {
              preguntaId,
              tipo_preguntaId: typeof preguntaId,
              comparacion_16_17: preguntaId >= 16 && preguntaId <= 17,
              comparacion_18: preguntaId === 18
            });
          }

          if (preguntaId >= 13 && preguntaId <= 15) {
            mappedDimension = 'Conocimiento';
          } else if (preguntaId >= 16 && preguntaId <= 17) {
            mappedDimension = 'Inversión';
            console.log(`✅ Pregunta ${preguntaId} mapeada a Inversión`);
          } else if (preguntaId === 18) {
            mappedDimension = 'Estrategia';
            console.log(`✅ Pregunta ${preguntaId} mapeada a Estrategia (desde Conocimiento)`);
          } else {
            // Fallback: distribuir por texto
            if (texto.includes('inversión') || texto.includes('presupuesto') || texto.includes('capacitación') || texto.includes('formación')) {
              mappedDimension = 'Inversión';
            } else {
              mappedDimension = 'Conocimiento'; // Default para Conocimiento
            }
          }
        } else {
          // 4. Fallback general por texto
          if (texto.includes('productividad') || texto.includes('eficiencia')) {
            mappedDimension = 'Productividad';
          } else if (texto.includes('estrategia') || texto.includes('planificación')) {
            mappedDimension = 'Estrategia';
          } else if (texto.includes('inversión') || texto.includes('presupuesto')) {
            mappedDimension = 'Inversión';
          } else if (texto.includes('conocimiento') || texto.includes('conceptos')) {
            mappedDimension = 'Conocimiento';
          } else {
            mappedDimension = 'Aplicación';
          }
        }

        // Log del resultado del mapeo para preguntas 16-18
        if (preguntaId >= 16 && preguntaId <= 18) {
          console.log(`✅ Pregunta ${preguntaId} mapeada a: "${mappedDimension}" (buscando: "${dimension}")`);
        }

        return mappedDimension === dimension;
      });

      // Log simplificado
      if (relevantResponses.length > 0) {
        console.log(`📈 ${dimension}: ${relevantResponses.length} respuestas`);
      }

      let totalScore = 0;
      let totalWeight = 0;

      relevantResponses.forEach((response, idx) => {
        const preguntaId = response.pregunta_id;
        const weight = response.preguntas?.peso || 1;
        let value = response.valor;
        
        // Manejar valor como jsonb - Supabase normalmente devuelve jsonb ya parseado
        // Pero puede venir como string si es un JSON string anidado
        if (value != null) {
          // Si es un string, verificar si necesita parsing
          if (typeof value === 'string') {
            const trimmed = value.trim();
            // Si parece un JSON string (empieza y termina con comillas dobles)
            if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Si falla, mantener el valor original
              }
            }
          }
        }
        
        // Calcular puntuación basada en el tipo de respuesta
        let score = 0;

        // 🔍 PASO 1: Verificar si la pregunta tiene respuesta_correcta (preguntas de conocimiento)
        const correctAnswer = response.preguntas?.respuesta_correcta;

        if (correctAnswer) {
          // ✅ Pregunta de conocimiento: correcto = 100, incorrecto = 0
          if (typeof value === 'string') {
            score = value.trim() === correctAnswer.trim() ? 100 : 0;
          }
        } else if (typeof value === 'string') {
          // 📊 Pregunta de adopción/frecuencia: usar escala A-E
          const escala = response.preguntas?.escala;

          if (escala && typeof escala === 'object' && Object.keys(escala).length > 0) {
            // Intentar encontrar el score en la escala
            // La clave puede ser el valor completo o solo la letra (A, B, C, D, E)
            score = escala[value] || 0;

            // Si no encontró score, intentar con solo la primera letra
            if (score === 0 && value.length > 0) {
              const firstChar = value.trim()[0].toUpperCase();
              score = escala[firstChar] || escala[firstChar.toLowerCase()] || 0;

              // Si aún no encuentra, buscar claves que empiecen con la letra
              if (score === 0) {
                for (const key of Object.keys(escala)) {
                  if (key.trim().toUpperCase().startsWith(firstChar)) {
                    score = escala[key];
                    break;
                  }
                }
              }
            }
          } else {
            // Puntuación por defecto basada en la respuesta
            // ⚠️ IMPORTANTE: Buscar el patrón al INICIO del string (usando startsWith o regex)
            // para evitar falsos positivos (ej: "D) Frecuente" contiene 'A' en "Frecuente")
            const trimmedValue = value.trim();

            if (trimmedValue.startsWith('E)') || /^E\)/i.test(trimmedValue)) score = 100;
            else if (trimmedValue.startsWith('D)') || /^D\)/i.test(trimmedValue)) score = 75;
            else if (trimmedValue.startsWith('C)') || /^C\)/i.test(trimmedValue)) score = 50;
            else if (trimmedValue.startsWith('B)') || /^B\)/i.test(trimmedValue)) score = 25;
            else if (trimmedValue.startsWith('A)') || /^A\)/i.test(trimmedValue)) score = 0;
            else {
              score = 50; // Respuesta por defecto
            }
          }
        } else if (typeof value === 'number') {
          score = value;
        }

        totalScore += score * weight;
        totalWeight += weight;

        // Log detallado para Conocimiento (preguntas 13-15)
        if (dimension === 'Conocimiento' && preguntaId >= 13 && preguntaId <= 15) {
          console.log(`📝 Conocimiento - Pregunta ${preguntaId}:`, {
            valor: value,
            respuesta_correcta: correctAnswer,
            es_correcta: correctAnswer ? (value.trim() === correctAnswer.trim()) : 'N/A',
            score,
            weight,
            runningTotal: totalScore,
            runningWeight: totalWeight
          });
        }
      });

      const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
      
      // Aplicar normalización por dificultad del usuario
      const normalizedScore = normalizeScoreByDifficulty(finalScore, userDifficulty);

      return {
        dimension,
        score: Math.min(100, Math.max(0, normalizedScore)),
        rawScore: finalScore, // Guardar el score sin normalizar para referencia
        maxPossibleScore: userDifficulty ? (userDifficulty * 20) : 100 // Máximo posible según dificultad
      };
    });

    // Log final de scores
    console.log('📊 Scores finales por dimensión:', scores.map(s => `${s.dimension}: ${s.score}`).join(', '));

    return scores;
  };

  const processAnalysis = (responses: any[], userProfile: any) => {
    const adoptionResponses = responses.filter(r => 
      r.preguntas?.section === 'Adopción' || r.preguntas?.bloque === 'Adopción'
    );
    const knowledgeResponses = responses.filter(r => 
      r.preguntas?.section === 'Conocimiento' || r.preguntas?.bloque === 'Conocimiento'
    );

    // Calcular puntuación de adopción
    let adoptionScore = 0;
    if (adoptionResponses.length > 0) {
      const totalAdoption = adoptionResponses.reduce((sum, response) => {
        let value = response.valor;

        // Manejar valor como jsonb
        if (value && typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Si falla el parse, usar el valor original
          }
        }

        let score = 0;
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          // Buscar el patrón al INICIO del string para evitar falsos positivos
          if (trimmedValue.startsWith('E)') || /^E\)/i.test(trimmedValue)) score = 100;
          else if (trimmedValue.startsWith('D)') || /^D\)/i.test(trimmedValue)) score = 75;
          else if (trimmedValue.startsWith('C)') || /^C\)/i.test(trimmedValue)) score = 50;
          else if (trimmedValue.startsWith('B)') || /^B\)/i.test(trimmedValue)) score = 25;
          else if (trimmedValue.startsWith('A)') || /^A\)/i.test(trimmedValue)) score = 0;
          else score = 50;
        }
        return sum + score;
      }, 0);
      adoptionScore = Math.round(totalAdoption / adoptionResponses.length);
    }

    // Calcular puntuación de conocimiento
    let knowledgeScore = 0;
    let correctAnswers = 0;
    if (knowledgeResponses.length > 0) {
      knowledgeResponses.forEach(response => {
        const correctAnswer = response.preguntas?.respuesta_correcta;
        let userAnswer = response.valor;
        
        // Manejar valor como jsonb
        if (userAnswer && typeof userAnswer === 'string' && userAnswer.startsWith('"') && userAnswer.endsWith('"')) {
          try {
            userAnswer = JSON.parse(userAnswer);
          } catch (e) {
            // Si falla el parse, usar el valor original
          }
        }
        
        if (correctAnswer && userAnswer === correctAnswer) {
          correctAnswers++;
        }
      });
      knowledgeScore = Math.round((correctAnswers / knowledgeResponses.length) * 100);
    }

    return {
      adoption: {
        score: adoptionScore,
        level: getLevel(adoptionScore),
        description: getAdoptionDescription(adoptionScore)
      },
      knowledge: {
        score: knowledgeScore,
        correct: correctAnswers,
        total: knowledgeResponses.length,
        level: getLevel(knowledgeScore),
        description: getKnowledgeDescription(knowledgeScore, correctAnswers, knowledgeResponses.length)
      }
    };
  };

  const getLevel = (score: number) => {
    if (score >= 80) return 'Avanzado';
    if (score >= 60) return 'Intermedio';
    if (score >= 40) return 'Medio';
    if (score >= 20) return 'Básico';
    return 'Principiante';
  };

  const getAdoptionDescription = (score: number) => {
    if (score >= 80) return 'Excelente nivel de adopción de IA. Has integrado herramientas de IA de manera efectiva en múltiples áreas de tu trabajo.';
    if (score >= 60) return 'Buen nivel de adopción de IA. Has comenzado a integrar herramientas de IA en algunos aspectos de tu trabajo.';
    if (score >= 40) return 'Nivel medio de adopción de IA. Estás explorando algunas herramientas de IA en tu trabajo diario.';
    if (score >= 20) return 'Nivel básico de adopción de IA. Has comenzado a experimentar con algunas herramientas de IA.';
    return 'Nivel principiante de adopción de IA. Hay muchas oportunidades para comenzar a integrar IA en tu trabajo.';
  };

  const getKnowledgeDescription = (score: number, correct: number, total: number) => {
    if (score >= 80) return `Excelente comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
    if (score >= 60) return `Buena comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
    if (score >= 40) return `Comprensión media de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
    if (score >= 20) return `Comprensión básica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
    return `Comprensión principiante de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%). Hay oportunidades significativas para expandir tu entendimiento técnico.`;
  };

  const generateRecommendations = (radarData: any[], analysis: any) => {
    const recommendations = [];
    
    // Recomendación basada en la dimensión más baja
    const lowestDimension = radarData.reduce((min, current) => 
      current.score < min.score ? current : min
    );
    
    if (lowestDimension.score < 40) {
      recommendations.push({
        title: `Mejora en: ${lowestDimension.dimension}`,
        description: `Tu puntuación en ${lowestDimension.dimension} es de ${lowestDimension.score} puntos. Enfócate en desarrollar esta área para equilibrar tu perfil de competencias.`,
        icon: TrendingUp,
        priority: 'high'
      });
    }

    // Recomendación basada en conocimiento técnico
    if (analysis.knowledge.score < 50) {
      recommendations.push({
        title: 'Profundiza tus conocimientos técnicos',
        description: `Con ${analysis.knowledge.correct}/${analysis.knowledge.total} respuestas correctas (${analysis.knowledge.score}%), enfócate en entender mejor los fundamentos de la IA y las mejores prácticas.`,
        icon: BookOpen,
        priority: 'high'
      });
    }

    // Recomendación basada en adopción
    if (analysis.adoption.score < 60) {
      recommendations.push({
        title: 'Aumenta tu adopción de IA',
        description: 'Explora más herramientas de IA y busca oportunidades para integrarlas en tu flujo de trabajo diario.',
        icon: Zap,
        priority: 'medium'
      });
    }

    return recommendations;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary dark:border-primary/50 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-lg">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('error.title')}</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/statistics')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            {t('error.backButton')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Modal de Dificultad */}
      <AnimatePresence>
        {showDifficultyModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDifficultyModal(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('difficultyModal.title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                      {t('difficultyModal.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white/90 mb-3">
                    {t('difficultyModal.question')} <span className="text-red-500 dark:text-red-400">{t('difficultyModal.required')}</span>
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.selectPlaceholder')}
                    </option>
                    <option value="Nunca" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.options.never')}
                    </option>
                    <option value="Rara vez" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.options.rarely')}
                    </option>
                    <option value="A veces" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.options.sometimes')}
                    </option>
                    <option value="Frecuentemente" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.options.frequently')}
                    </option>
                    <option value="Siempre" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {t('difficultyModal.options.always')}
                    </option>
                  </select>

                  {userProfile?.dificultad_id && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>{t('difficultyModal.currentLevel')}</strong> {userProfile.dificultad_id}
                        {userProfile.dificultad_id < 5 && (
                          <span className="block mt-1 text-blue-700 dark:text-blue-300">
                            {t('difficultyModal.nextLevelHint')}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDifficultyModal(false)}
                    disabled={updatingDifficulty}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('difficultyModal.cancelButton')}
                  </button>
                  <button
                    onClick={handleUpdateDifficulty}
                    disabled={!selectedDifficulty || updatingDifficulty}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-lg hover:from-primary/80 hover:to-purple-500/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updatingDifficulty ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('difficultyModal.updatingButton')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('difficultyModal.continueButton')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 pt-24"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-20"></div> {/* Spacer izquierdo */}

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('header.title')}</h1>
              <p className="text-gray-600 dark:text-white/60 text-sm">{t('header.subtitle')}</p>
            </div>

            <button
              onClick={() => {
                // Obtener la dificultad actual del usuario para pre-seleccionarla
                if (userProfile?.dificultad_id) {
                  const dificultadMap: { [key: number]: string } = {
                    1: 'Nunca',
                    2: 'Rara vez',
                    3: 'A veces',
                    4: 'Frecuentemente',
                    5: 'Siempre'
                  };
                  setSelectedDifficulty(dificultadMap[userProfile.dificultad_id] || '');
                }
                setShowDifficultyModal(true);
              }}
              className="flex items-center px-4 py-2 bg-primary/20 dark:bg-primary/20 hover:bg-primary/30 dark:hover:bg-primary/30 border border-primary/30 dark:border-primary/30 hover:border-primary/50 dark:hover:border-primary/50 text-primary dark:text-primary hover:text-primary/90 rounded-lg transition-all duration-300 group"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-medium">{t('header.newSurvey')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Radar Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-lg dark:shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('radar.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-white/60 max-w-2xl mx-auto mb-4">
              {t('radar.description')}
            </p>
            {userProfile?.dificultad_id && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">{t('radar.difficultyLevel')} {userProfile.dificultad_id}</p>
                    <p>
                      {t('radar.difficultyInfo', { max: userProfile.dificultad_id * 20 })}
                      {userProfile.dificultad_id < 5 && (
                        <span className="block mt-1 text-blue-700 dark:text-blue-300">
                          {t('radar.difficultyAdvance')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <RadarChart 
                data={radarData} 
                dimensions={['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión']} 
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('radar.dimensionsTitle')}</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">{t('radar.dimensions.knowledge.title')}</h4>
                    <p className="text-gray-700 dark:text-white/60 text-sm">{t('radar.dimensions.knowledge.description')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">{t('radar.dimensions.application.title')}</h4>
                    <p className="text-gray-700 dark:text-white/60 text-sm">{t('radar.dimensions.application.description')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">{t('radar.dimensions.productivity.title')}</h4>
                    <p className="text-gray-700 dark:text-white/60 text-sm">{t('radar.dimensions.productivity.description')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Lightbulb className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">{t('radar.dimensions.strategy.title')}</h4>
                    <p className="text-gray-700 dark:text-white/60 text-sm">{t('radar.dimensions.strategy.description')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">{t('radar.dimensions.investment.title')}</h4>
                    <p className="text-gray-700 dark:text-white/60 text-sm">{t('radar.dimensions.investment.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        {analysisData && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <StatCard
              title={t('analysis.adoption.title')}
              value={`${analysisData.adoption.score} ${t('analysis.adoption.points')} - ${analysisData.adoption.level}`}
              description={analysisData.adoption.description}
              icon={Zap}
              color="blue"
              delay={0.2}
            />

            <StatCard
              title={t('analysis.knowledge.title')}
              value={`${analysisData.knowledge.correct}/${analysisData.knowledge.total} ${t('analysis.knowledge.correct')} (${analysisData.knowledge.score}%) - ${analysisData.knowledge.level}`}
              description={analysisData.knowledge.description}
              icon={BookOpen}
              color="green"
              delay={0.4}
            />
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('recommendations.title')}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                      rec.priority === 'high' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <rec.icon className={`w-4 h-4 ${
                        rec.priority === 'high' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium mb-2">{rec.title}</h3>
                      <p className="text-gray-700 dark:text-white/60 text-sm">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* GenAI Adoption by Countries */}
        {countryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('countries.title')}</h2>
            </div>

            <p className="text-gray-700 dark:text-white/60 mb-6">
              {t('countries.description')}
            </p>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <CountryBarChart data={countryData} userCountry={userProfile?.pais} />
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-medium">{t('countries.stats.title')}</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-white/5 rounded-lg">
                      <span className="text-gray-700 dark:text-white/70">{t('countries.stats.countriesAnalyzed')}</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">{countryData.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-white/5 rounded-lg">
                      <span className="text-gray-700 dark:text-white/70">{t('countries.stats.averageAIPI')}</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">
                        {countryData.length > 0 
                          ? (() => {
                              // Filtrar solo países con valores válidos (no null)
                              const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                              const average = validCountries.length > 0 
                                ? validCountries.reduce((sum, c) => sum + c.indice_aipi, 0) / validCountries.length 
                                : 0;
                              return average.toFixed(3);
                            })()
                          : '0.000'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-white/5 rounded-lg">
                      <span className="text-gray-700 dark:text-white/70">{t('countries.stats.maximum')}</span>
                      <div className="text-right">
                        <div className="text-gray-900 dark:text-white font-bold text-lg">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const maxValue = validCountries.length > 0 ? Math.max(...validCountries.map(c => c.indice_aipi)) : 0;
                                return maxValue.toFixed(3);
                              })()
                            : '0.000'
                          }
                        </div>
                        <div className="text-gray-600 dark:text-white/60 text-xs">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const maxValue = validCountries.length > 0 ? Math.max(...validCountries.map(c => c.indice_aipi)) : 0;
                                const maxCountry = validCountries.find(c => c.indice_aipi === maxValue);
                                return maxCountry?.pais || 'N/A';
                              })()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-white/5 rounded-lg">
                      <span className="text-gray-700 dark:text-white/70">{t('countries.stats.minimum')}</span>
                      <div className="text-right">
                        <div className="text-gray-900 dark:text-white font-bold text-lg">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const minValue = validCountries.length > 0 ? Math.min(...validCountries.map(c => c.indice_aipi)) : 0;
                                // console.log('🔍 Debug mínimo corregido:', {
                                //   validCountries: validCountries.map(c => ({ pais: c.pais, indice_aipi: c.indice_aipi })),
                                //   minValue,
                                //   totalCountries: countryData.length,
                                //   validCountriesCount: validCountries.length
                                // });
                                return minValue.toFixed(3);
                              })()
                            : '0.000'
                          }
                        </div>
                        <div className="text-gray-600 dark:text-white/60 text-xs">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const minValue = validCountries.length > 0 ? Math.min(...validCountries.map(c => c.indice_aipi)) : 0;
                                const minCountry = validCountries.find(c => c.indice_aipi === minValue);
                                // console.log('🔍 Debug país mínimo corregido:', {
                                //   minValue,
                                //   minCountry,
                                //   validCountries: validCountries.map(c => ({ pais: c.pais, indice_aipi: c.indice_aipi }))
                                // });
                                return minCountry?.pais || 'N/A';
                              })()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-white/5 rounded-lg">
                      <span className="text-gray-700 dark:text-white/70">{t('countries.stats.range')}</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">
                        {countryData.length > 0 
                          ? (() => {
                              // Filtrar solo países con valores válidos (no null)
                              const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                              const maxValue = validCountries.length > 0 ? Math.max(...validCountries.map(c => c.indice_aipi)) : 0;
                              const minValue = validCountries.length > 0 ? Math.min(...validCountries.map(c => c.indice_aipi)) : 0;
                              return (maxValue - minValue).toFixed(3);
                            })()
                          : '0.000'
                        }
                      </span>
                    </div>
                    {userProfile?.pais && (() => {
                      const userCountryData = countryData.find(c => 
                        c.pais && c.pais.toLowerCase().trim() === userProfile.pais.toLowerCase().trim()
                      );
                      // console.log('🔍 Debug país usuario:', {
                      //   userProfilePais: userProfile.pais,
                      //   countryData: countryData.map(c => c.pais),
                      //   userCountryData,
                      //   countryDataLength: countryData.length
                      // });
                      return userCountryData;
                    })() && (
                      <div className="flex justify-between items-center p-3 bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-700 dark:text-yellow-300 font-medium">Tu país ({userProfile.pais}):</span>
                        <div className="text-right">
                          <div className="text-yellow-700 dark:text-yellow-300 font-bold text-lg">
                            {countryData.find(c => c.pais && c.pais.toLowerCase().trim() === userProfile.pais.toLowerCase().trim())?.indice_aipi?.toFixed(3) || '0.000'}
                          </div>
                          <div className="text-yellow-600 dark:text-yellow-400/70 text-xs">
                            Posición #{countryData.findIndex(c => c.pais && c.pais.toLowerCase().trim() === userProfile.pais.toLowerCase().trim()) + 1} de {countryData.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-medium">{t('countries.methodology.title')}</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-lg">
                      <h4 className="text-gray-900 dark:text-white font-medium mb-2">{t('countries.methodology.aipiTitle')}</h4>
                      <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                        {t('countries.methodology.aipiDescription')}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-white/5 rounded-lg">
                      <h4 className="text-gray-900 dark:text-white font-medium mb-2">{t('countries.methodology.sourcesTitle')}</h4>
                      <p className="text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-line">
                        {t('countries.methodology.sourcesDescription')}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-white/5 rounded-lg">
                      <h4 className="text-gray-900 dark:text-white font-medium mb-2">{t('countries.methodology.updateTitle')}</h4>
                      <p className="text-gray-700 dark:text-white/70 leading-relaxed">
                        {t('countries.methodology.updateDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
