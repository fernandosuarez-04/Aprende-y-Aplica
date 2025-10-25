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
    
    console.log('=== MAPEO DEBUG ===');
    console.log('Type_rol original:', typeRol);
    console.log('Type_rol normalizado:', normalizedTypeRol);
    console.log('Mapeo encontrado:', mapping[normalizedTypeRol]);
    console.log('Mapeo completo disponible:', Object.keys(mapping));
    console.log('==================');
    
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
      
      console.log('Usuario autenticado:', user.id);
      
      // Usar el cliente de Supabase configurado
      const supabase = createClient();

      // Obtener perfil del usuario desde la tabla users (como en el sistema anterior)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, type_rol')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error de perfil:', profileError);
        setError('Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.');
        return;
      }

      // Verificar que el usuario tenga type_rol definido
      if (!userProfile.type_rol || userProfile.type_rol.trim() === '') {
        console.warn('El usuario no tiene type_rol definido en su perfil');
        setError('Tu perfil profesional no está completo. Por favor completa la información de tu rol en la página de estadísticas.');
        return;
      }

      console.log('=== PERFIL USUARIO ===');
      console.log('Perfil encontrado:', userProfile);
      console.log('Type_rol exacto:', `"${userProfile.type_rol}"`);
      console.log('Longitud del type_rol:', userProfile.type_rol.length);
      console.log('=====================');

      // Mapear type_rol a exclusivo_rol_id (basado en el sistema anterior)
      const exclusivoRolId = mapTypeRolToExclusivoRolId(userProfile.type_rol);
      console.log('=== DEBUG MAPEO ===');
      console.log('Type_rol del usuario:', userProfile.type_rol);
      console.log('Exclusivo_rol_id mapeado:', exclusivoRolId);
      console.log('Mapeo completo:', {
        'CEO': 1,
        'CTO/CIO': 2,
        'Dirección de Marketing': 3,
        'Dirección de Ventas': 6
      });
      console.log('==================');

      // Obtener preguntas filtradas por perfil
      console.log('Buscando preguntas para:', {
        type_rol: userProfile.type_rol,
        exclusivo_rol_id: exclusivoRolId
      });

      // Primero intentar buscar preguntas específicas para el perfil
      let questions = [];
      let questionsError = null;

      // Cargar preguntas según exclusivo_rol_id (basado en genai-form.js)
      // Para CTO: exclusivo_rol_id = 2
      // Para CEO: exclusivo_rol_id = 1
      // Para Marketing: exclusivo_rol_id = 3
      // Para Ventas: exclusivo_rol_id = 11, 17
      // Para Educación: exclusivo_rol_id = 9
      const { data: specificQuestions, error: specificError } = await supabase
        .from('preguntas')
        .select('*')
        .eq('exclusivo_rol_id', exclusivoRolId)
        .eq('section', 'Cuestionario')
        .order('bloque', { ascending: true })
        .order('codigo', { ascending: true });
      
      console.log('Buscando preguntas específicas para exclusivo_rol_id:', exclusivoRolId);

      console.log('Preguntas específicas para el perfil:', { 
        specificQuestions, 
        specificError,
        count: specificQuestions?.length || 0,
        userProfile: { type_rol: userProfile.type_rol, exclusivo_rol_id: exclusivoRolId }
      });

      // Debug adicional: verificar qué preguntas se están obteniendo
      if (specificQuestions && specificQuestions.length > 0) {
        console.log('Primeras 3 preguntas encontradas:', specificQuestions.slice(0, 3).map(q => ({
          id: q.id,
          codigo: q.codigo,
          section: q.section,
          bloque: q.bloque,
          exclusivo_rol_id: q.exclusivo_rol_id,
          texto: q.texto?.substring(0, 100) + '...'
        })));
      } else {
        console.warn('NO SE ENCONTRARON PREGUNTAS ESPECÍFICAS para exclusivo_rol_id:', exclusivoRolId);
        
        // Verificar si hay preguntas en la base de datos
        const { data: allQuestions, error: allError } = await supabase
          .from('preguntas')
          .select('id, codigo, section, bloque, exclusivo_rol_id, texto')
          .eq('section', 'Cuestionario')
          .limit(10);
        
        console.log('Preguntas disponibles en la base de datos:', allQuestions);
        console.log('Error al obtener todas las preguntas:', allError);
      }
      
      // Debug: Mostrar las primeras 3 preguntas encontradas
      if (specificQuestions && specificQuestions.length > 0) {
        console.log('Primeras 3 preguntas encontradas:', specificQuestions.slice(0, 3).map(q => ({
          id: q.id,
          codigo: q.codigo,
          section: q.section,
          bloque: q.bloque,
          exclusivo_rol_id: q.exclusivo_rol_id,
          texto: q.texto?.substring(0, 50) + '...'
        })));
      }

      if (specificError) {
        console.error('Error fetching specific questions:', specificError);
        questionsError = specificError;
      } else if (specificQuestions && specificQuestions.length > 0) {
        questions = specificQuestions;
        console.log('Usando preguntas específicas para el perfil:', questions.length);
      } else {
        // Si no hay preguntas específicas, buscar todas las preguntas del cuestionario
        console.log('No hay preguntas específicas, buscando todas las preguntas del cuestionario...');
        
        const { data: allQuestions, error: allError } = await supabase
          .from('preguntas')
          .select('*')
          .eq('section', 'Cuestionario')
          .order('bloque', { ascending: true })
          .order('codigo', { ascending: true });

        console.log('Todas las preguntas disponibles:', { allQuestions, allError });

        if (allError) {
          console.error('Error fetching all questions:', allError);
          questionsError = allError;
        } else if (allQuestions && allQuestions.length > 0) {
          questions = allQuestions;
          console.log('Usando todas las preguntas disponibles:', questions.length);
        } else {
          console.warn('No hay preguntas en la base de datos');
          setError('No hay preguntas disponibles en la base de datos. Contacta al administrador.');
          return;
        }
      }

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        setError(`Error al obtener las preguntas: ${questionsError.message}`);
        return;
      }

      if (!questions || questions.length === 0) {
        console.warn('No se encontraron preguntas');
        setError('No se encontraron preguntas disponibles.');
        return;
      }

      console.log('Preguntas cargadas:', questions.length);
      console.log('Primera pregunta (estructura):', questions[0]);
      
      // Agrupar preguntas por sección
      const questionsBySection = questions.reduce((acc, q) => {
        if (!acc[q.section]) {
          acc[q.section] = [];
        }
        acc[q.section].push(q);
        return acc;
      }, {});
      console.log('Preguntas por sección:', questionsBySection);
      
      // Agrupar preguntas por tipo
      const questionsByType = questions.reduce((acc, q) => {
        acc[q.tipo] = (acc[q.tipo] || 0) + 1;
        return acc;
      }, {});
      console.log('Preguntas por tipo:', questionsByType);
      
      console.log('Todas las preguntas:', questions);

      // Obtener respuestas existentes (con manejo de errores robusto)
      console.log('Buscando respuestas existentes para user_id:', user.id);
      
      let existingAnswers = [];
      let answersError = null;
      
      try {
        // Primero obtener el user_perfil_id del usuario
        const { data: userProfile, error: profileError } = await supabase
          .from('user_perfil')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.warn('No se encontró perfil de usuario, continuando sin respuestas existentes:', profileError);
          existingAnswers = [];
        } else {
          console.log('Perfil de usuario encontrado:', userProfile.id);
          
          const { data, error } = await supabase
            .from('respuestas')
            .select('pregunta_id, valor')
            .eq('user_perfil_id', userProfile.id);

          if (error) {
            console.warn('Error al obtener respuestas existentes (tabla puede no existir):', error);
            answersError = error;
            existingAnswers = []; // Continuar sin respuestas existentes
          } else {
            existingAnswers = data || [];
            console.log('Respuestas existentes encontradas:', existingAnswers.length);
          }
        }
      } catch (err) {
        console.warn('Error inesperado al obtener respuestas:', err);
        answersError = err;
        existingAnswers = []; // Continuar sin respuestas existentes
      }

      // Mapear respuestas existentes
      const answersMap = existingAnswers?.reduce((acc, answer) => {
        acc[answer.pregunta_id] = answer.valor;
        return acc;
      }, {} as Record<number, any>) || {};

      // Combinar preguntas con respuestas existentes
      const questionsWithAnswers = questions?.map(question => ({
        ...question,
        respuesta_existente: answersMap[question.id] || null
      })) || [];

      // Organizar preguntas por secciones como en el sistema anterior
      const sections: QuestionnaireSection[] = [];
      
      // Separar por BLOQUE, no por section (basado en genai-form.js)
      const adoptionQuestions = questionsWithAnswers.filter(q => 
        q.bloque === 'Adopción'
      );
      
      const knowledgeQuestions = questionsWithAnswers.filter(q => 
        q.bloque === 'Conocimiento'
      );
      
      console.log('Preguntas encontradas por bloque:', {
        adopcion: adoptionQuestions.length,
        conocimiento: knowledgeQuestions.length,
        total: questionsWithAnswers.length
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
        console.log('No se encontraron preguntas por bloque, creando sección general...');
        sections.push({
          name: 'Cuestionario',
          description: 'Preguntas generales',
          questions: questionsWithAnswers
        });
      }

      console.log('Secciones organizadas:', sections);
      console.log('Preguntas por sección:', {
        adopcion: adoptionQuestions.length,
        conocimiento: knowledgeQuestions.length,
        total: questionsWithAnswers.length
      });
      console.log('Ejemplo de pregunta de adopción:', adoptionQuestions[0]);
      console.log('Ejemplo de pregunta de conocimiento:', knowledgeQuestions[0]);
      
      // Debug: Ver todos los bloques únicos en las preguntas
      const uniqueBlocks = [...new Set(questionsWithAnswers.map(q => q.bloque))];
      console.log('Bloques únicos encontrados:', uniqueBlocks);
      console.log('Primeras 5 preguntas con sus bloques:', questionsWithAnswers.slice(0, 5).map(q => ({ id: q.id, section: q.section, bloque: q.bloque, tipo: q.tipo })));

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

    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Error al cargar las preguntas');
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
      
      console.log('=== INICIANDO GUARDADO DE RESPUESTA ===');
      console.log('Question ID:', questionId);
      console.log('Value:', value);
      console.log('User:', user?.id);
      
      if (!user) {
        console.error('No hay usuario autenticado');
        return;
      }
      
      // Usar el cliente de Supabase configurado
      const supabase = createClient();

      try {
        // Primero obtener el user_perfil_id del usuario
        console.log('Buscando perfil de usuario para user_id:', user.id);
        const { data: userProfile, error: profileError } = await supabase
          .from('user_perfil')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error al obtener perfil de usuario:', profileError);
          console.error('Datos del perfil:', userProfile);
          return;
        }

        console.log('Perfil de usuario encontrado:', userProfile.id);

        // Verificar si ya existe una respuesta
        console.log('Verificando si existe respuesta para pregunta:', questionId);
        const { data: existingAnswer, error: checkError } = await supabase
          .from('respuestas')
          .select('id')
          .eq('user_perfil_id', userProfile.id)
          .eq('pregunta_id', questionId)
          .single();

        console.log('Respuesta existente:', existingAnswer);
        console.log('Error al verificar:', checkError);

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es normal si no existe la respuesta
          console.warn('Error al verificar respuesta existente:', checkError);
          return;
        }

        if (existingAnswer) {
          // Actualizar respuesta existente
          console.log('Actualizando respuesta existente con ID:', existingAnswer.id);
          const { error: updateError } = await supabase
            .from('respuestas')
            .update({
              valor: value,
              respondido_en: new Date().toISOString()
            })
            .eq('id', existingAnswer.id);

          if (updateError) {
            console.error('Error al actualizar respuesta:', updateError);
          } else {
            console.log('✅ Respuesta actualizada correctamente para pregunta', questionId);
          }
        } else {
          // Crear nueva respuesta
          console.log('Creando nueva respuesta...');
          const insertData = {
            user_perfil_id: userProfile.id,
            pregunta_id: questionId,
            valor: value,
            respondido_en: new Date().toISOString()
          };
          
          console.log('Datos a insertar:', insertData);
          
          const { data: insertResult, error: insertError } = await supabase
            .from('respuestas')
            .insert(insertData)
            .select();

          if (insertError) {
            console.error('❌ Error al crear nueva respuesta:', insertError);
            console.error('Detalles del error:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });
          } else {
            console.log('✅ Nueva respuesta creada correctamente:', insertResult);
            console.log('✅ Respuesta guardada para pregunta', questionId);
          }
        }
      } catch (tableError) {
        console.error('❌ Error con la tabla respuestas:', tableError);
        // Continuar sin guardar - el cuestionario puede funcionar sin persistir respuestas
      }

    } catch (error) {
      console.error('❌ Error general en saveAnswer:', error);
    } finally {
      setSaving(false);
      console.log('=== FINALIZANDO GUARDADO DE RESPUESTA ===');
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
      console.log('Guardando todas las respuestas...');
      const savePromises = Object.entries(answers).map(async ([questionId, value]) => {
        try {
          await saveAnswer(parseInt(questionId), value);
          console.log(`Respuesta guardada para pregunta ${questionId}`);
        } catch (error) {
          console.warn(`Error al guardar respuesta ${questionId}:`, error);
        }
      });
      
      await Promise.allSettled(savePromises);
      
      console.log('Cuestionario completado!');
      console.log('Respuestas finales:', answers);
      
      // Redirigir a la página de estadísticas
      router.push('/statistics/results');
      
    } catch (error) {
      console.error('Error al finalizar cuestionario:', error);
      alert('Error al finalizar el cuestionario. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
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
          <p className="text-white text-lg">Cargando cuestionario...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/70 mb-6">{error || 'No se pudieron cargar las preguntas'}</p>
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
  
  console.log('Questionnaire state:', {
    currentSectionIndex,
    currentQuestionIndex,
    currentSection: currentSection.name,
    totalQuestions,
    currentQuestionNumber,
    currentQuestion,
    progress,
    answeredQuestions
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Compact Header - Todo en una línea */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border-b border-white/10 pt-24"
      >
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Botón Volver */}
            <button
              onClick={() => router.push('/statistics')}
              className="flex items-center text-white/70 hover:text-white transition-colors shrink-0"
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
                <h1 className="text-sm font-bold text-white truncate">{currentSection.name}</h1>
                <span className="text-white/40 text-xs shrink-0">•</span>
                <p className="text-white/50 text-xs truncate">{currentSection.description}</p>
                <span className="text-white/30 text-xs shrink-0">({currentSection.questions.length})</span>
              </div>
            </div>
            
            {/* Estadísticas */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center text-white/60 gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {currentQuestionNumber}/{totalQuestions}
                </span>
              </div>
              <div className="flex items-center text-white/60 gap-1">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">{answeredQuestions}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar ultra delgada */}
        <div className="w-full bg-white/5 h-px">
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
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
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
                  <p className="text-white/60 text-sm">
                    Pregunta {currentQuestion.codigo}
                  </p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white leading-relaxed">
                {currentQuestion.texto}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {console.log('Current question options:', currentQuestion.opciones)}
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
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      answers[currentQuestion.id] === opcion
                        ? 'border-primary bg-primary'
                        : 'border-white/40'
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
                  <p className="text-white/60 mb-4">No hay opciones disponibles para esta pregunta.</p>
                  <p className="text-sm text-white/40">Estructura de la pregunta:</p>
                  <pre className="text-xs text-white/40 mt-2 bg-black/20 p-2 rounded">
                    {JSON.stringify(currentQuestion, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                  currentQuestionIndex === 0
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Anterior
              </button>

              <div className="flex items-center space-x-4">
                {saving && (
                  <div className="flex items-center text-white/60">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full animate-spin mr-2"></div>
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
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
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
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
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
