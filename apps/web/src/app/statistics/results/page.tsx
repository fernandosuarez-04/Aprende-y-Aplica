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

// Componente del gráfico de radar
const RadarChart = ({ data, dimensions }: { data: any[], dimensions: string[] }) => {
  const maxValue = 100;
  const centerX = 250;  // ✅ Aumentado para dar más espacio
  const centerY = 250;  // ✅ Aumentado para dar más espacio
  const radius = 180;   // ✅ Aumentado para hacer el radar más grande
  
  const angleStep = (2 * Math.PI) / dimensions.length;
  
  // Calcular puntos para cada dimensión con escala ULTRA EXTREMA para llenar completamente el radar
  const points = dimensions.map((dimension, index) => {
    const value = data.find(d => d.dimension === dimension)?.score || 0;
    // ✅ Escala ULTRA EXTREMA para llenar completamente el radar
    let scaledValue;
    if (value === 0) {
      scaledValue = 35; // Mínimo visible ultra grande
    } else if (value <= 3) {
      scaledValue = value * 12; // 12x para valores muy bajos
    } else if (value <= 5) {
      scaledValue = value * 10; // 10x para valores muy bajos
    } else if (value <= 8) {
      scaledValue = value * 8; // 8x para valores bajos
    } else if (value <= 12) {
      scaledValue = value * 7; // 7x para valores medios-bajos
    } else if (value <= 15) {
      scaledValue = value * 6; // 6x para valores medios-bajos
    } else if (value <= 20) {
      scaledValue = value * 5; // 5x para valores bajos-medios
    } else if (value <= 25) {
      scaledValue = value * 4.5; // 4.5x para valores medios
    } else if (value <= 35) {
      scaledValue = value * 4; // 4x para valores medios
    } else if (value <= 50) {
      scaledValue = value * 3; // 3x para valores medios-altos
    } else if (value <= 70) {
      scaledValue = value * 2.5; // 2.5x para valores altos
    } else {
      scaledValue = value * 2; // 2x para valores muy altos
    }
    
    // Asegurar que nunca sea menor a 35 para máxima visibilidad
    scaledValue = Math.max(scaledValue, 35);
    
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
            stroke="rgba(255, 255, 255, 0.1)"
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
              stroke="rgba(255, 255, 255, 0.1)"
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
              className="fill-white text-sm font-medium"
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
            className="fill-white text-xs font-bold"
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
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-2xl font-bold text-primary mb-2">{value}</p>
          <p className="text-white/60 text-sm">{description}</p>
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
            className={`group flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer ${
              isUserCountry ? 'bg-yellow-500/20 border border-yellow-500/30' : ''
            }`}
          >
            <div className="w-24 text-right">
              <span className={`text-sm font-medium truncate block group-hover:text-white transition-colors ${
                isUserCountry ? 'text-yellow-300 font-bold' : 'text-white/80'
              }`}>
                {country.pais || 'N/A'}
                {isUserCountry && <span className="ml-1 text-yellow-400">⭐</span>}
              </span>
            </div>
            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden relative">
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
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                {country.pais}: {(country.indice_aipi || 0).toFixed(3)}
                {isUserCountry && ' (Tu país)'}
              </div>
            </div>
            <div className="w-16 text-left">
              <span className={`text-sm font-bold group-hover:text-white transition-colors ${
                isUserCountry ? 'text-yellow-300' : 'text-white/80'
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

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
        console.log('🔍 Usuario sin perfil, redirigiendo a personalizar experiencia');
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
        console.log('🔍 Usuario sin respuestas, redirigiendo a personalizar experiencia');
        router.push('/statistics');
        return;
      }

      console.log('🔍 Usuario tiene datos, cargando estadísticas');
      // Si tiene datos, cargar las estadísticas
      fetchStatisticsData();
    } catch (error) {
      console.error('Error verificando datos del usuario:', error);
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
            respuesta_correcta
          )
        `)
        .eq('user_perfil_id', userProfile.id);

      if (responsesError) {
        console.warn('Error al obtener respuestas:', responsesError);
      }

      // Obtener datos de adopción por países
      const { data: adoptionData, error: adoptionError } = await supabase
        .from('adopcion_genai')
        .select('*')
        .order('indice_aipi', { ascending: false });

      if (adoptionError) {
        console.warn('Error al obtener datos de adopción:', adoptionError);
      }

      // Procesar datos para el radar
      const processedRadarData = processRadarData(responses || []);
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
      console.error('Error al obtener estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const processRadarData = (responses: any[]) => {
    const dimensions = ['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión'];
    const sectionMapping = {
      'Adopción': 'Aplicación',
      'Conocimiento': 'Conocimiento',
      'Técnico': 'Conocimiento'
    };

    const scores = dimensions.map(dimension => {
      const relevantResponses = responses.filter(response => {
        const section = response.preguntas?.section || '';
        const mappedDimension = sectionMapping[section as keyof typeof sectionMapping] || dimension;
        return mappedDimension === dimension;
      });

      let totalScore = 0;
      let totalWeight = 0;

      relevantResponses.forEach(response => {
        const weight = response.preguntas?.peso || 1;
        const value = response.valor;
        
        // Calcular puntuación basada en el tipo de respuesta
        let score = 0;
        if (typeof value === 'string') {
          // Para respuestas de texto, usar escala si está disponible
          const escala = response.preguntas?.escala;
          if (escala && typeof escala === 'object') {
            score = escala[value] || 0;
          } else {
            // Puntuación por defecto basada en la respuesta
            score = value.includes('A)') ? 0 : 
                   value.includes('B)') ? 25 :
                   value.includes('C)') ? 50 :
                   value.includes('D)') ? 75 : 100;
          }
        } else if (typeof value === 'number') {
          score = value;
        }

        totalScore += score * weight;
        totalWeight += weight;
      });

      const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
      
      return {
        dimension,
        score: Math.min(100, Math.max(0, finalScore))
      };
    });

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
        const value = response.valor;
        let score = 0;
        if (typeof value === 'string') {
          score = value.includes('A)') ? 0 : 
                 value.includes('B)') ? 25 :
                 value.includes('C)') ? 50 :
                 value.includes('D)') ? 75 : 100;
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
        const userAnswer = response.valor;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Analizando tus resultados...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push('/statistics')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Volver a Estadísticas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border-b border-white/10 pt-24"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-20"></div> {/* Spacer izquierdo */}
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Mis Estadísticas</h1>
              <p className="text-white/60 text-sm">Análisis personalizado de tus resultados</p>
            </div>
            
            <button
              onClick={() => router.push('/questionnaire/direct')}
              className="flex items-center px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/50 text-primary hover:text-primary/90 rounded-lg transition-all duration-300 group"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-medium">Nueva Encuesta</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Radar Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Radar de Competencias en IA</h2>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto">
              Visualización de tus fortalezas por área funcional basada en tu cuestionario. 
              Cada dimensión se evalúa en una escala de 0 a 100 puntos.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <RadarChart 
                data={radarData} 
                dimensions={['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión']} 
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">¿Qué significa cada dimensión?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Conocimiento</h4>
                    <p className="text-white/60 text-sm">Tu comprensión teórica sobre IA, conceptos fundamentales y terminología.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Aplicación</h4>
                    <p className="text-white/60 text-sm">Tu capacidad para implementar IA en casos de uso reales.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Productividad</h4>
                    <p className="text-white/60 text-sm">Cómo utilizas la IA para optimizar tu trabajo diario.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Lightbulb className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Estrategia</h4>
                    <p className="text-white/60 text-sm">Tu visión sobre el impacto estratégico de la IA en tu organización.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Inversión</h4>
                    <p className="text-white/60 text-sm">Tu disposición para invertir en herramientas y formación en IA.</p>
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
              title="Adopción de IA"
              value={`${analysisData.adoption.score} puntos - ${analysisData.adoption.level}`}
              description={analysisData.adoption.description}
              icon={Zap}
              color="blue"
              delay={0.2}
            />
            
            <StatCard
              title="Conocimiento Técnico"
              value={`${analysisData.knowledge.correct}/${analysisData.knowledge.total} correctas (${analysisData.knowledge.score}%) - ${analysisData.knowledge.level}`}
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
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Recomendaciones Personalizadas</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
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
                      <h3 className="text-white font-medium mb-2">{rec.title}</h3>
                      <p className="text-white/60 text-sm">{rec.description}</p>
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
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Adopción de GenAI en Países Hispanoparlantes</h2>
            </div>
            
            <p className="text-white/60 mb-6">
              Índice de Adopción e Implementación de IA (AIPI) por país. 
              Compara tu nivel de adopción con el promedio de tu región.
            </p>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <CountryBarChart data={countryData} userCountry={userProfile?.pais} />
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-white font-medium">Estadísticas Generales</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">Países analizados:</span>
                      <span className="text-white font-bold text-lg">{countryData.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">Promedio AIPI:</span>
                      <span className="text-white font-bold text-lg">
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
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">Máximo:</span>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">
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
                        <div className="text-white/60 text-xs">
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
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">Mínimo:</span>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const minValue = validCountries.length > 0 ? Math.min(...validCountries.map(c => c.indice_aipi)) : 0;
                                console.log('🔍 Debug mínimo corregido:', {
                                  validCountries: validCountries.map(c => ({ pais: c.pais, indice_aipi: c.indice_aipi })),
                                  minValue,
                                  totalCountries: countryData.length,
                                  validCountriesCount: validCountries.length
                                });
                                return minValue.toFixed(3);
                              })()
                            : '0.000'
                          }
                        </div>
                        <div className="text-white/60 text-xs">
                          {countryData.length > 0 
                            ? (() => {
                                // Filtrar solo países con valores válidos (no null)
                                const validCountries = countryData.filter(c => c.indice_aipi != null && c.indice_aipi > 0);
                                const minValue = validCountries.length > 0 ? Math.min(...validCountries.map(c => c.indice_aipi)) : 0;
                                const minCountry = validCountries.find(c => c.indice_aipi === minValue);
                                console.log('🔍 Debug país mínimo corregido:', { 
                                  minValue, 
                                  minCountry,
                                  validCountries: validCountries.map(c => ({ pais: c.pais, indice_aipi: c.indice_aipi }))
                                });
                                return minCountry?.pais || 'N/A';
                              })()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">Rango:</span>
                      <span className="text-white font-bold text-lg">
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
                      console.log('🔍 Debug país usuario:', {
                        userProfilePais: userProfile.pais,
                        countryData: countryData.map(c => c.pais),
                        userCountryData,
                        countryDataLength: countryData.length
                      });
                      return userCountryData;
                    })() && (
                      <div className="flex justify-between items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-300 font-medium">Tu país ({userProfile.pais}):</span>
                        <div className="text-right">
                          <div className="text-yellow-300 font-bold text-lg">
                            {countryData.find(c => c.pais && c.pais.toLowerCase().trim() === userProfile.pais.toLowerCase().trim())?.indice_aipi?.toFixed(3) || '0.000'}
                          </div>
                          <div className="text-yellow-400/70 text-xs">
                            Posición #{countryData.findIndex(c => c.pais && c.pais.toLowerCase().trim() === userProfile.pais.toLowerCase().trim()) + 1} de {countryData.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-white font-medium">Fuente y Metodología</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Metodología AIPI</h4>
                      <p className="text-white/70 leading-relaxed">
                        El Índice de Adopción e Implementación de IA (AIPI) evalúa el nivel de adopción de 
                        inteligencia artificial en países hispanoparlantes basándose en métricas de 
                        implementación empresarial, uso personal, inversión en tecnología y políticas públicas.
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Fuentes de Datos</h4>
                      <p className="text-white/70 leading-relaxed">
                        • Estudios de adopción empresarial (2023-2024)<br/>
                        • Encuestas de uso personal de IA<br/>
                        • Inversión en tecnología por país<br/>
                        • Políticas públicas de digitalización<br/>
                        • Índices de innovación tecnológica
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Actualización</h4>
                      <p className="text-white/70 leading-relaxed">
                        Datos actualizados trimestralmente. Última actualización: Enero 2025
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
