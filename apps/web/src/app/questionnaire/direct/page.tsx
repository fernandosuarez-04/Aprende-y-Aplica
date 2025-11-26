'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Target,
  Brain,
  TrendingUp,
  Users,
  BookOpen,
  Award
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { createClient } from '../../../lib/supabase/client';

interface Question {
  id: number;
  codigo: string;
  section: string;
  bloque: string;
  area_id: number;
  exclusivo_rol_id: number | null;
  texto: string;
  tipo: string;
  opciones: string[]; // Cambiado a array de strings
  peso: number;
  escala: { min: number; max: number };
  scoring: { type: string };
  respuesta_existente: any;
}

interface UserProfile {
  type_rol: string;
  exclusivo_rol_id: number;
}

interface QuestionnaireSection {
  name: string;
  description: string;
  questions: Question[];
}

interface QuestionnaireData {
  sections: QuestionnaireSection[];
  total: number;
  userProfile: UserProfile;
}

export default function DirectQuestionnairePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo cargar preguntas si el usuario está autenticado
    if (!authLoading && isAuthenticated && user) {
      fetchQuestions();
    } else if (!authLoading && !isAuthenticated) {
      setError('Usuario no autenticado. Por favor inicia sesión.');
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  // Mapear type_rol a exclusivo_rol_id (MAPEO CORRECTO según la imagen)
  const mapTypeRolToExclusivoRolId = (typeRol: string): number => {
    // Normalizar el type_rol: convertir a Title Case y limpiar espacios
    const normalizeTypeRol = (rol: string): string => {
      return rol
        .trim() // Eliminar espacios al inicio y final
        .toLowerCase() // Convertir todo a minúsculas
        .split(' ') // Separar por espacios
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar primera letra
        .join(' '); // Unir de nuevo
    };
    
    const normalizedTypeRol = normalizeTypeRol(typeRol);
    
    const mapping: Record<string, number> = {
      // MAPEO CORRECTO basado en la imagen proporcionada
      // IMPORTANTE: Todas las claves están en Title Case porque normalizeTypeRol convierte a Title Case
      
      // Roles con preguntas específicas (según imagen)
      'Ceo': 1,                    // id = 1 → exclusivo_rol_id = 1 → preguntas 7-18
      'Cto': 3,                    // id = 3 → exclusivo_rol_id = 3 → preguntas 201-212 ✅
      'Cto/Cio': 3,               // id = 3 → exclusivo_rol_id = 3 → preguntas 201-212 ✅
      'Cto / Cio': 3,             // id = 3 → exclusivo_rol_id = 3 → preguntas 201-212 ✅ (con espacios)
      'Marketing': 2,              // id = 2,4 → exclusivo_rol_id = 2 → preguntas 31-42
      'Cmo': 2,                    // id = 2 → exclusivo_rol_id = 2 → preguntas 31-42
      'Dirección De Marketing': 2, // id = 2 → exclusivo_rol_id = 2 → preguntas 31-42
      'Miembros De Marketing': 18,  // id = 18 → exclusivo_rol_id = 18 → preguntas 257-268 ✅
      'Gerente De Marketing': 2,   // id = 4 → exclusivo_rol_id = 2 → preguntas 31-42
      'Academia/Investigación': 8, // id = 8 → exclusivo_rol_id = 8 → preguntas 79-90
      'Educación/Docentes': 9,     // id = 9 → exclusivo_rol_id = 9 → preguntas 249-260 ✅
      'Dirección De Finanzas (Cfo)': 13, // id = 13 → exclusivo_rol_id = 13 → preguntas 55-78
      
      // Roles con preguntas específicas NUEVAS (agregados)
      'Gerente De Ti': 5,          // id = 5 → exclusivo_rol_id = 5 → preguntas 213-224 ✅
      'Líder/Gerente De Ventas': 6, // id = 6 → exclusivo_rol_id = 6 → preguntas 225-236 ✅
      'Analista/Especialista Ti': 7, // id = 7 → exclusivo_rol_id = 7 → preguntas 237-248 ✅
      'Analista Ti': 7,            // Alias para Analista/Especialista TI ✅ CLAVE PARA RESOLVER EL BUG
      'Especialista Ti': 7,        // Alias para Analista/Especialista TI ✅
      'Analista De Ti': 7,         // Alias para Analista/Especialista TI ✅
      'Diseño/Industrias Creativas': 10, // id = 10 → exclusivo_rol_id = 10 → preguntas 261-272 ✅
      'Dirección De Ventas': 11,    // id = 11 → exclusivo_rol_id = 11 → preguntas 185-196 ✅
      'Dirección De Operaciones': 12, // id = 12 → exclusivo_rol_id = 12 → preguntas 197-208 ✅
      'Dirección De Rrhh': 14,      // id = 14 → exclusivo_rol_id = 14 → preguntas 209-220 ✅
      'Dirección De Contabilidad': 15, // id = 15 → exclusivo_rol_id = 15 → preguntas 221-232 ✅
      'Dirección De Compras': 16,   // id = 16 → exclusivo_rol_id = 16 → preguntas 233-244 ✅
      'Miembros De Ventas': 17,     // id = 17 → exclusivo_rol_id = 17 → preguntas 257-268 ✅
      'Miembros De Operaciones': 19, // id = 19 → exclusivo_rol_id = 19 → preguntas 281-292 ✅
      'Miembros De Finanzas': 1,   // id = 20 → SIN PREGUNTAS → usar CEO
      'Miembros De Rrhh': 21,       // id = 21 → exclusivo_rol_id = 21 → preguntas 293-304 ✅
      'Miembros De Contabilidad': 22, // id = 22 → exclusivo_rol_id = 22 → preguntas 305-316 ✅
      'Miembros De Compras': 23,    // id = 23 → exclusivo_rol_id = 23 → preguntas 317-328 ✅
      'Gerencia Media': 24,         // id = 24 → exclusivo_rol_id = 24 → preguntas 329-340 ✅
      'Freelancer': 25,             // id = 25 → exclusivo_rol_id = 25 → preguntas 341-352 ✅
      'Consultor': 26,              // id = 26 → exclusivo_rol_id = 26 → preguntas 353-364 ✅
      
      // Alias comunes (en Title Case)
      'Operaciones': 12,            // Dirección de Operaciones → exclusivo_rol_id = 12
      'Compras': 16,                // Dirección de Compras → exclusivo_rol_id = 16
      'Finanzas': 13,               // Dirección de Finanzas → exclusivo_rol_id = 13
      'Rrhh': 14,                   // Dirección de RRHH → exclusivo_rol_id = 14
      'Contabilidad': 15,           // Dirección de Contabilidad → exclusivo_rol_id = 15
      'It': 5,                      // Gerente de TI → exclusivo_rol_id = 5
      'Ti': 5,                      // Gerente de TI → exclusivo_rol_id = 5 ✅
      'Sistemas': 5,                // Gerente de TI → exclusivo_rol_id = 5
      'Tecnología': 3,              // CTO → exclusivo_rol_id = 3
      'Analista': 7,                // Analista TI → exclusivo_rol_id = 7
      'Especialista': 7,            // Especialista TI → exclusivo_rol_id = 7
      'Ventas': 11,                 // Dirección de Ventas → exclusivo_rol_id = 11
      'Diseño': 10,                 // Diseño/Industrias Creativas → exclusivo_rol_id = 10
      'Creativo': 10,               // Diseño/Industrias Creativas → exclusivo_rol_id = 10
      'Educación': 9,               // Educación/Docentes → exclusivo_rol_id = 9
      'Docentes': 9,                // Educación/Docentes → exclusivo_rol_id = 9
      'Profesor': 9,                // Educación/Docentes → exclusivo_rol_id = 9
      'Maestro': 9                  // Educación/Docentes → exclusivo_rol_id = 9
    };
    
    // console.log('Mapping de rol:', normalizedTypeRol, '→', mapping[normalizedTypeRol] || 1);
    return mapping[normalizedTypeRol] || 1; // Fallback a CEO si no se encuentra
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('Usuario no autenticado. Por favor inicia sesión.');
        return;
      }
      
      // Usar el cliente de Supabase configurado
      const supabase = createClient();

      // Obtener perfil del usuario desde la tabla users (como en el sistema anterior)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, type_rol')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        // console.error('Error de perfil:', profileError);
        setError('Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.');
        return;
      }

      // Verificar que el usuario tenga type_rol definido
      if (!userProfile.type_rol || userProfile.type_rol.trim() === '') {
        setError('Tu perfil profesional no está completo. Por favor completa la información de tu rol en la página de estadísticas.');
        return;
      }

      // Obtener perfil completo del usuario desde user_perfil
      const { data: userProfileComplete, error: profileCompleteError } = await supabase
        .from('user_perfil')
        .select('id, area_id, rol_id, dificultad_id')
        .eq('user_id', user.id)
        .single();

      if (profileCompleteError || !userProfileComplete) {
        setError('Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.');
        return;
      }

      // Validar que el perfil tenga todos los datos necesarios
      if (!userProfileComplete.dificultad_id) {
        setError('Tu perfil no tiene un nivel de dificultad asignado. Por favor completa el cuestionario inicial nuevamente.');
        setLoading(false);
        return;
      }

      if (!userProfileComplete.rol_id) {
        setError('Tu perfil no tiene un rol asignado. Por favor completa el cuestionario inicial nuevamente.');
        setLoading(false);
        return;
      }

      if (!userProfileComplete.area_id) {
        setError('Tu perfil no tiene un área asignada. Por favor completa el cuestionario inicial nuevamente.');
        setLoading(false);
        return;
      }

      console.log('Perfil del usuario:', {
        dificultad_id: userProfileComplete.dificultad_id,
        area_id: userProfileComplete.area_id,
        rol_id: userProfileComplete.rol_id
      });

      // Obtener preguntas filtradas por dificultad, área y rol
      // Necesitamos 6 preguntas de Adopción y 6 de Conocimiento
      const { data: allQuestionsByDifficulty, error: difficultyError } = await supabase
        .from('preguntas')
        .select('*')
        .eq('dificultad', userProfileComplete.dificultad_id);

      if (difficultyError) {
        setError('Error al obtener las preguntas');
        return;
      }

      // Filtrar preguntas de Adopción que coincidan con área y rol
      const adopcionFiltered = (allQuestionsByDifficulty || [])
        .filter(q => {
          const isAdopcion = q.bloque && (
            q.bloque.toLowerCase().includes('adopción') || 
            q.bloque.toLowerCase().includes('adopcion') ||
            q.bloque === 'Adopción/uso'
          );
          if (!isAdopcion) return false;
          const areaMatch = q.area_id === userProfileComplete.area_id || q.area_id === null;
          const rolMatch = q.exclusivo_rol_id === userProfileComplete.rol_id || q.exclusivo_rol_id === null;
          return areaMatch && rolMatch;
        })
        .sort((a, b) => {
          if (a.exclusivo_rol_id === userProfileComplete.rol_id && b.exclusivo_rol_id !== userProfileComplete.rol_id) return -1;
          if (a.exclusivo_rol_id !== userProfileComplete.rol_id && b.exclusivo_rol_id === userProfileComplete.rol_id) return 1;
          if (a.area_id === userProfileComplete.area_id && b.area_id !== userProfileComplete.area_id) return -1;
          if (a.area_id !== userProfileComplete.area_id && b.area_id === userProfileComplete.area_id) return 1;
          return a.id - b.id;
        })
        .slice(0, 6);

      // Filtrar preguntas de Conocimiento que coincidan con área y rol
      const conocimientoFiltered = (allQuestionsByDifficulty || [])
        .filter(q => {
          const isConocimiento = q.bloque && q.bloque.toLowerCase().includes('conocimiento');
          if (!isConocimiento) return false;
          const areaMatch = q.area_id === userProfileComplete.area_id || q.area_id === null;
          const rolMatch = q.exclusivo_rol_id === userProfileComplete.rol_id || q.exclusivo_rol_id === null;
          return areaMatch && rolMatch;
        })
        .sort((a, b) => {
          if (a.exclusivo_rol_id === userProfileComplete.rol_id && b.exclusivo_rol_id !== userProfileComplete.rol_id) return -1;
          if (a.exclusivo_rol_id !== userProfileComplete.rol_id && b.exclusivo_rol_id === userProfileComplete.rol_id) return 1;
          if (a.area_id === userProfileComplete.area_id && b.area_id !== userProfileComplete.area_id) return -1;
          if (a.area_id !== userProfileComplete.area_id && b.area_id === userProfileComplete.area_id) return 1;
          return a.id - b.id;
        })
        .slice(0, 6);

      // Combinar las preguntas: primero adopción, luego conocimiento
      const questions = [...adopcionFiltered, ...conocimientoFiltered];
      
      console.log('Preguntas encontradas:', {
        total: questions.length,
        adopcion: adopcionFiltered.length,
        conocimiento: conocimientoFiltered.length,
        dificultad_id: userProfileComplete.dificultad_id,
        area_id: userProfileComplete.area_id,
        rol_id: userProfileComplete.rol_id,
        total_disponibles: allQuestionsByDifficulty?.length || 0
      });

      if (questions.length === 0) {
        const errorMsg = `No se encontraron preguntas para tu perfil. Dificultad: ${userProfileComplete.dificultad_id}, Área: ${userProfileComplete.area_id}, Rol: ${userProfileComplete.rol_id}. Por favor verifica que tu perfil esté completo o contacta al administrador.`;
        console.error(errorMsg, {
          total_preguntas_disponibles: allQuestionsByDifficulty?.length || 0,
          adopcion_encontradas: adopcionFiltered.length,
          conocimiento_encontradas: conocimientoFiltered.length
        });
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (questions.length < 12) {
        console.warn(`Solo se obtuvieron ${questions.length} preguntas de 12 esperadas`, {
          adopcion: adopcionFiltered.length,
          conocimiento: conocimientoFiltered.length,
          dificultad_id: userProfileComplete.dificultad_id,
          area_id: userProfileComplete.area_id,
          rol_id: userProfileComplete.rol_id,
          total_disponibles: allQuestionsByDifficulty?.length || 0
        });
      }

      // console.log('Primera pregunta encontrada:', questions[0]);
      
      // Agrupar preguntas por sección
      const questionsBySection = questions.reduce((acc, q) => {
        if (!acc[q.section]) {
          acc[q.section] = [];
        }
        acc[q.section].push(q);
        return acc;
      }, {});
      // Agrupar preguntas por tipo
      const questionsByType = questions.reduce((acc, q) => {
        acc[q.tipo] = (acc[q.tipo] || 0) + 1;
        return acc;
      }, {});
      // Obtener respuestas existentes usando el user_perfil_id que ya tenemos
      let existingAnswers = [];
      
      try {
        const { data, error } = await supabase
          .from('respuestas')
          .select('pregunta_id, valor')
          .eq('user_perfil_id', userProfileComplete.id);

        if (error) {
          console.error('Error al obtener respuestas existentes:', error);
          existingAnswers = [];
        } else {
          existingAnswers = data || [];
        }
      } catch (err) {
        console.error('Error al obtener respuestas existentes:', err);
        existingAnswers = [];
      }

      // Mapear respuestas existentes
      const answersMap = existingAnswers?.reduce((acc, answer) => {
        acc[answer.pregunta_id] = answer.valor;
        return acc;
      }, {} as Record<number, any>) || {};

      // Combinar preguntas con respuestas existentes y parsear opciones
      const questionsWithAnswers = questions?.map(question => {
        // Parsear opciones si vienen como JSON string
        let opcionesParsed: string[] = [];
        if (question.opciones) {
          if (typeof question.opciones === 'string') {
            try {
              opcionesParsed = JSON.parse(question.opciones);
            } catch (e) {
              console.warn('Error al parsear opciones como JSON:', e);
              opcionesParsed = [question.opciones];
            }
          } else if (Array.isArray(question.opciones)) {
            opcionesParsed = question.opciones;
          } else {
            console.warn('Formato de opciones desconocido:', typeof question.opciones);
            opcionesParsed = [];
          }
        }
        
        return {
          ...question,
          opciones: opcionesParsed,
          respuesta_existente: answersMap[question.id] || null
        };
      }) || [];

      // Organizar preguntas por secciones como en el sistema anterior
      const sections: QuestionnaireSection[] = [];
      
      // Separar por BLOQUE, no por section (basado en genai-form.js)
      // Usar comparación flexible para manejar diferentes formatos del bloque
      const adoptionQuestions = questionsWithAnswers.filter(q => {
        if (!q.bloque) return false;
        const bloqueLower = q.bloque.toLowerCase();
        return bloqueLower.includes('adopción') || 
               bloqueLower.includes('adopcion') ||
               q.bloque === 'Adopción/uso';
      });
      
      const knowledgeQuestions = questionsWithAnswers.filter(q => {
        if (!q.bloque) return false;
        return q.bloque.toLowerCase().includes('conocimiento');
      });
      
      // Crear secciones basadas en los bloques encontrados
      if (adoptionQuestions.length > 0) {
        sections.push({
          name: 'Adopción de IA',
          description: 'Frecuencia de uso de herramientas y técnicas de IA',
          questions: adoptionQuestions
        });
      }

      if (knowledgeQuestions.length > 0) {
        sections.push({
          name: 'Conocimiento Técnico',
          description: 'Comprensión de conceptos y mejores prácticas',
          questions: knowledgeQuestions
        });
      }

      // Si no se encontraron secciones por bloque, crear una sección general
      if (sections.length === 0) {
        console.warn('No se encontraron secciones por bloque, creando sección general');
        if (questionsWithAnswers.length > 0) {
          sections.push({
            name: 'Cuestionario',
            description: 'Preguntas generales',
            questions: questionsWithAnswers
          });
        }
      }

      // Validar que tengamos al menos una sección con preguntas
      if (sections.length === 0 || questionsWithAnswers.length === 0) {
        const errorMsg = `No se pudieron organizar las preguntas. Secciones: ${sections.length}, Preguntas: ${questionsWithAnswers.length}`;
        console.error(errorMsg, {
          sections,
          questionsWithAnswers: questionsWithAnswers.length,
          adopcionQuestions: adoptionQuestions.length,
          knowledgeQuestions: knowledgeQuestions.length
        });
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Debug: Ver todos los bloques únicos en las preguntas
      const uniqueBlocks = [...new Set(questionsWithAnswers.map(q => q.bloque))];
      console.log('Bloques únicos encontrados:', uniqueBlocks);
      console.log('Preguntas con respuestas:', questionsWithAnswers.map(q => ({ 
        id: q.id, 
        section: q.section, 
        bloque: q.bloque, 
        tipo: q.tipo,
        texto: q.texto?.substring(0, 50) + '...'
      })));

      // Calcular exclusivo_rol_id desde type_rol si es necesario
      const exclusivoRolId = mapTypeRolToExclusivoRolId(userProfile.type_rol);

      console.log('Datos a establecer:', {
        sections_count: sections.length,
        total_questions: questionsWithAnswers.length,
        sections: sections.map(s => ({ name: s.name, questions_count: s.questions.length }))
      });

      try {
        setData({
          sections,
          total: questionsWithAnswers.length,
          userProfile: {
            type_rol: userProfile.type_rol,
            exclusivo_rol_id: exclusivoRolId
          }
        });
        
        // Inicializar respuestas existentes
        setAnswers(answersMap);
        
        console.log('✅ Datos establecidos correctamente');
      } catch (setDataError) {
        console.error('Error al establecer datos:', setDataError);
        throw setDataError;
      }

    } catch (error) {
      console.error('Error fetching questions:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Error al cargar las preguntas: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveAnswer = async (questionId: number, value: any) => {
    try {
      setSaving(true);
      
      if (!user) {
        // console.error('No hay usuario autenticado');
        return;
      }
      
      // Usar el cliente de Supabase configurado
      const supabase = createClient();

      try {
        // Primero obtener el user_perfil_id del usuario
        const { data: userProfile, error: profileError } = await supabase
          .from('user_perfil')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          // console.error('Error al obtener perfil de usuario:', profileError);
          // console.error('Datos del perfil:', userProfile);
          return;
        }

        // Verificar si ya existe una respuesta
        const { data: existingAnswer, error: checkError } = await supabase
          .from('respuestas')
          .select('id')
          .eq('user_perfil_id', userProfile.id)
          .eq('pregunta_id', questionId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es normal si no existe la respuesta
          return;
        }

        if (existingAnswer) {
          // Actualizar respuesta existente
          const { error: updateError } = await supabase
            .from('respuestas')
            .update({
              valor: value,
              respondido_en: new Date().toISOString()
            })
            .eq('id', existingAnswer.id);

          if (updateError) {
            // console.error('Error al actualizar respuesta:', updateError);
          } else {
            }
        } else {
          // Crear nueva respuesta
          const insertData = {
            user_perfil_id: userProfile.id,
            pregunta_id: questionId,
            valor: value,
            respondido_en: new Date().toISOString()
          };
          
          const { data: insertResult, error: insertError } = await supabase
            .from('respuestas')
            .insert(insertData)
            .select();

          if (insertError) {
            // console.error('❌ Error al crear nueva respuesta:', insertError);
            // console.error('Detalles del error:', {
            //   message: insertError.message,
            //   details: insertError.details,
            //   hint: insertError.hint,
            //   code: insertError.code
            // });
          } else {
            }
        }
      } catch (tableError) {
        // console.error('❌ Error con la tabla respuestas:', tableError);
        // Continuar sin guardar - el cuestionario puede funcionar sin persistir respuestas
      }

    } catch (error) {
      // console.error('❌ Error general en saveAnswer:', error);
    } finally {
      setSaving(false);
      }
  };

  const handleNext = async () => {
    const currentSection = data?.sections[currentSectionIndex];
    const currentQuestion = currentSection?.questions[currentQuestionIndex];
    
    if (currentQuestion && answers[currentQuestion.id]) {
      await saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }
    
    const isLastQuestionInSection = currentQuestionIndex >= (currentSection?.questions.length || 0) - 1;
    const isLastSection = currentSectionIndex >= (data?.sections.length || 0) - 1;

    if (isLastQuestionInSection && isLastSection) {
      // Última pregunta del último cuestionario
      handleFinish();
    } else if (isLastQuestionInSection) {
      // Última pregunta de la sección, ir a la siguiente sección
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Siguiente pregunta en la misma sección
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Pregunta anterior en la misma sección
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      // Primera pregunta de la sección, ir a la sección anterior
      const previousSection = data?.sections[currentSectionIndex - 1];
      setCurrentSectionIndex(prev => prev - 1);
      setCurrentQuestionIndex(previousSection?.questions.length - 1 || 0);
    }
  };

  const handleFinish = async () => {
    try {
      setSaving(true);
      
      // Guardar la respuesta actual si no se ha guardado
      const currentSection = data?.sections[currentSectionIndex];
      const currentQuestion = currentSection?.questions[currentQuestionIndex];
      
      if (currentQuestion && answers[currentQuestion.id]) {
        await saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
      }
      
      // Guardar TODAS las respuestas restantes
      const savePromises = Object.entries(answers).map(async ([questionId, value]) => {
        try {
          await saveAnswer(parseInt(questionId), value);
          } catch (error) {
          }
      });
      
      await Promise.allSettled(savePromises);
      
      // Redirigir a la página de estadísticas
      router.push('/statistics/results');
      
    } catch (error) {
      // console.error('Error al finalizar cuestionario:', error);
      alert('Error al finalizar el cuestionario. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-white text-lg">Cargando cuestionario...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-700 dark:text-white/70 mb-6">{error || 'No se pudieron cargar las preguntas'}</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/statistics')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Volver al Perfil
            </button>
            <button
              onClick={() => {
                setError('');
                fetchQuestions();
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
            {error?.includes('sesión') && (
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentSection = data.sections[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  const totalQuestions = data.sections.reduce((total, section) => total + section.questions.length, 0);
  const currentQuestionNumber = data.sections
    .slice(0, currentSectionIndex)
    .reduce((total, section) => total + section.questions.length, 0) + currentQuestionIndex + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;
  const answeredQuestions = Object.keys(answers).length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Compact Header - Todo en una línea */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 pt-24"
      >
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push('/statistics')}
              className="flex items-center text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span className="text-xs font-medium">Volver</span>
            </button>
            
            {/* Sección Actual con Icono */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center shrink-0">
                <Brain className="w-3 h-3 text-primary" />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentSection.name}</h1>
                <span className="text-gray-400 dark:text-white/40 text-xs shrink-0">•</span>
                <p className="text-gray-600 dark:text-white/50 text-xs truncate">{currentSection.description}</p>
                <span className="text-gray-500 dark:text-white/30 text-xs shrink-0">({currentSection.questions.length})</span>
              </div>
            </div>
            
            {/* Estadísticas */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center text-gray-600 dark:text-white/60 gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {currentQuestionNumber}/{totalQuestions}
                </span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-white/60 gap-1">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">{answeredQuestions}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar ultra delgada */}
        <div className="w-full bg-gray-200 dark:bg-white/5 h-px">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-primary to-purple-500 h-px shadow-[0_0_4px_rgba(99,102,241,0.3)]"
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-xl"
          >
            {/* Question Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm text-primary font-medium uppercase tracking-wide">
                    {currentQuestion.section} • {currentQuestion.bloque}
                  </h3>
                  <p className="text-gray-600 dark:text-white/60 text-sm">
                    Pregunta {currentQuestion.codigo}
                  </p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.texto}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {}
              {currentQuestion.opciones && currentQuestion.opciones.length > 0 ? (
                currentQuestion.opciones.map((opcion, index) => (
                <motion.button
                  key={`${currentQuestion.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerChange(currentQuestion.id, opcion)}
                  className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                    answers[currentQuestion.id] === opcion
                      ? 'bg-primary/20 dark:bg-primary/20 border-primary dark:border-primary text-gray-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/20 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      answers[currentQuestion.id] === opcion
                        ? 'border-primary bg-primary dark:border-primary dark:bg-primary'
                        : 'border-gray-300 dark:border-white/40'
                    }`}>
                      {answers[currentQuestion.id] === opcion && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">{opcion}</span>
                  </div>
                </motion.button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-700 dark:text-white/60 mb-4">No hay opciones disponibles para esta pregunta.</p>
                  <p className="text-sm text-gray-600 dark:text-white/40">Estructura de la pregunta:</p>
                  <pre className="text-xs text-gray-700 dark:text-white/40 mt-2 bg-gray-100 dark:bg-black/20 p-2 rounded">
                    {JSON.stringify(currentQuestion, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                  currentQuestionIndex === 0 && currentSectionIndex === 0
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Anterior
              </button>

              <div className="flex items-center space-x-4">
                {saving && (
                  <div className="flex items-center text-gray-600 dark:text-white/60">
                    <div className="w-4 h-4 border-2 border-gray-400 dark:border-white/30 border-t-gray-600 dark:border-t-white/60 rounded-full animate-spin mr-2"></div>
                    <span className="text-sm">Guardando...</span>
                  </div>
                )}
              </div>

              {currentQuestionIndex === currentSection.questions.length - 1 && currentSectionIndex === data.sections.length - 1 ? (
                <button
                  onClick={handleFinish}
                  disabled={!answers[currentQuestion.id]}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    answers[currentQuestion.id]
                      ? 'bg-gradient-to-r from-primary to-purple-500 text-white hover:from-primary/80 hover:to-purple-500/80'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Award className="w-5 h-5 mr-2" />
                  Finalizar
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    answers[currentQuestion.id]
                      ? 'bg-primary text-white hover:bg-primary/80'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
