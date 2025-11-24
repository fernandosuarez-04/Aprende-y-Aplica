'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useQuestionnaireValidation } from '../../features/auth/hooks/useQuestionnaireValidation';
import { SelectField, type SelectOption } from '@/core/components/SelectField/SelectField';
import { PAISES_WITH_FLAGS } from '@/core/components/SelectField/country-flags';

interface ProfileData {
  cargo_titulo: string;
  rol_id: number;
  nivel_id: number;
  area_id: number;
  relacion_id: number;
  tamano_id: number;
  sector_id: number;
  pais: string;
}

interface ReferenceData {
  niveles: Array<{ id: number; nombre: string; slug: string }>;
  roles: Array<{ id: number; nombre: string; slug: string; area_id: number }>;
  areas: Array<{ id: number; nombre: string; slug: string }>;
  relaciones: Array<{ id: number; nombre: string; slug: string }>;
  tamanos_empresa: Array<{ id: number; nombre: string; min_empleados: number; max_empleados: number }>;
  sectores: Array<{ id: number; nombre: string; slug: string }>;
}

// Lista de países ya está en PAISES_WITH_FLAGS

export default function StatisticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileConfirmation, setShowProfileConfirmation] = useState(false);
  const [recommendedProfile, setRecommendedProfile] = useState<any>(null);
  
  // Validar cuestionario
  const { status } = useQuestionnaireValidation(user?.id);
  const isOAuthUser = status?.isGoogleOAuth || false;

  // Form data
  const [formData, setFormData] = useState<ProfileData>({
    cargo_titulo: '',
    rol_id: 0,
    nivel_id: 0,
    area_id: 0,
    relacion_id: 0,
    tamano_id: 0,
    sector_id: 0,
    pais: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      checkUserDataAndRedirect();
    } else if (!authLoading && !user) {
      router.push('/auth');
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
        // console.log('🔍 Usuario sin perfil, mostrando formulario de personalización');
        loadData();
        return;
      }

      // Verificar si el usuario tiene respuestas
      const { data: responses, error: responsesError } = await supabase
        .from('respuestas')
        .select('id')
        .eq('user_perfil_id', userProfile.id)
        .limit(1);

      if (responsesError || !responses || responses.length === 0) {
        // console.log('🔍 Usuario sin respuestas, mostrando formulario de personalización');
        loadData();
        return;
      }

      // console.log('🔍 Usuario tiene datos, redirigiendo a resultados');
      // Si tiene datos, redirigir a los resultados
      router.push('/statistics/results');
    } catch (error) {
      // console.error('Error verificando datos del usuario:', error);
      loadData();
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de referencia
      const referenceRes = await fetch('/api/statistics/reference-data');
      if (referenceRes.ok) {
        const reference = await referenceRes.json();
        setReferenceData(reference);
      }
    } catch (error) {
      // console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para mapear cargo_titulo a rol_id
  const mapCargoToRolId = (cargo: string): number => {
    const cargoLower = cargo.toLowerCase();
    
    // Mapeo basado en el análisis completo de perfiles y diferenciación jerárquica
    if (cargoLower.includes('ceo') || cargoLower.includes('director general') || cargoLower.includes('presidente')) {
      return 1; // CEO
    } else if (cargoLower.includes('cto') || cargoLower.includes('cio') || cargoLower.includes('director de tecnología') || cargoLower.includes('gerente de ti') || cargoLower.includes('analista de ti') || cargoLower.includes('especialista ti') || cargoLower.includes('desarrollador') || cargoLower.includes('programador')) {
      return 2; // CTO / Director(a) de Tecnología y roles técnicos
    } else if (cargoLower.includes('cmo') || cargoLower.includes('director de marketing') || cargoLower.includes('gerente de marketing')) {
      return 3; // CMO / Director(a) de Marketing
    } else if (cargoLower.includes('dirección de ventas') || cargoLower.includes('director de ventas')) {
      return 11; // Dirección de Ventas (estratégico)
    } else if (cargoLower.includes('líder de ventas') || cargoLower.includes('gerente de ventas') || cargoLower.includes('miembros de ventas') || cargoLower.includes('cso') || cargoLower.includes('director comercial')) {
      return 17; // Miembros de Ventas (operativo)
    } else if (cargoLower.includes('educación') || cargoLower.includes('docentes') || cargoLower.includes('profesor')) {
      return 9; // Educación/Docentes
    } else if (cargoLower.includes('cfo') || cargoLower.includes('director financiero') || cargoLower.includes('gerente de finanzas') || cargoLower.includes('contabilidad') || cargoLower.includes('rrhh') || cargoLower.includes('operaciones') || cargoLower.includes('compras') || cargoLower.includes('gerencia media') || cargoLower.includes('academia') || cargoLower.includes('investigación') || cargoLower.includes('investigador') || cargoLower.includes('diseño') || cargoLower.includes('industrias creativas') || cargoLower.includes('creativo') || cargoLower.includes('freelancer') || cargoLower.includes('consultor')) {
      return 1; // Roles estratégicos y especializados usan preguntas de CEO
    }
    
    return 0; // Sin rol específico
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validar que los campos requeridos estén llenos
      if (!formData.cargo_titulo || !formData.nivel_id || !formData.area_id || !formData.relacion_id) {
        alert('Por favor completa todos los campos requeridos (marcados con *)');
        return;
      }

      // Mapear cargo_titulo a rol_id
      const rol_id = mapCargoToRolId(formData.cargo_titulo);
      
      // Preparar datos para envío
      const profileData = {
        ...formData,
        rol_id: rol_id
      };

      // console.log('Enviando datos:', profileData);
      
      const response = await fetch('/api/statistics/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      // console.log('Respuesta de la API:', result);

      if (response.ok) {
        // Generar perfil recomendado basado en los datos
        const profile = generateRecommendedProfile(formData, referenceData);
        setRecommendedProfile(profile);
        setShowProfileConfirmation(true);
      } else {
        // console.error('Error en la API:', result.error);
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      // console.error('Error saving profile:', error);
      alert('Error al guardar el perfil. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const generateRecommendedProfile = (data: ProfileData, refData: ReferenceData | null) => {
    if (!refData) return null;

    const nivel = refData.niveles.find(n => n.id === data.nivel_id);
    const area = refData.areas.find(a => a.id === data.area_id);
    const relacion = refData.relaciones.find(r => r.id === data.relacion_id);
    const tamano = refData.tamanos_empresa.find(t => t.id === data.tamano_id);
    const sector = refData.sectores.find(s => s.id === data.sector_id);

    return {
      cargo: data.cargo_titulo,
      area: area?.nombre || '',
      nivel: nivel?.nombre || '',
      relacion: relacion?.nombre || '',
      sector: sector?.nombre || '', // Usar sector_id, no pais
      tamano: tamano?.nombre || '',
      pais: data.pais || '', // País por separado
      description: generateProfileDescription(data.cargo_titulo, area?.nombre)
    };
  };

  const generateProfileDescription = (cargo: string, area: string) => {
    if (cargo.toLowerCase().includes('cto') || cargo.toLowerCase().includes('cio')) {
      return 'Cuestionario especializado en tecnología y transformación digital';
    } else if (cargo.toLowerCase().includes('ceo') || cargo.toLowerCase().includes('director')) {
      return 'Cuestionario especializado en liderazgo estratégico y gestión empresarial';
    } else if (area.toLowerCase().includes('marketing')) {
      return 'Cuestionario especializado en marketing digital y estrategias de crecimiento';
    } else if (area.toLowerCase().includes('ventas')) {
      return 'Cuestionario especializado en técnicas de ventas y desarrollo comercial';
    } else if (area.toLowerCase().includes('finanzas')) {
      return 'Cuestionario especializado en gestión financiera y análisis de datos';
    } else if (area.toLowerCase().includes('rrhh')) {
      return 'Cuestionario especializado en gestión de talento y desarrollo organizacional';
    } else {
      return 'Cuestionario personalizado basado en tu perfil profesional';
    }
  };

  const handleStartQuestionnaire = () => {
    router.push('/questionnaire/direct');
  };

  const handleModifyInformation = () => {
    setShowProfileConfirmation(false);
    setRecommendedProfile(null);
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-white/70 text-lg">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {!showProfileConfirmation ? (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-10 sm:mb-12"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-color-contrast mb-3 sm:mb-4 tracking-tight">
                  Personaliza tu experiencia de aprendizaje
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary opacity-70 font-normal max-w-2xl mx-auto">
                  Compártenos algunos datos sobre tu perfil profesional para personalizar tu experiencia de aprendizaje.
                </p>
                {isOAuthUser && (
                  <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Importante:</strong> Como usuario registrado con Google, este cuestionario es obligatorio para acceder a todas las funcionalidades de la plataforma.
                    </p>
                  </div>
                )}
              </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-slate-700/50 shadow-xl max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Cargo / Título */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 text-text-secondary transition-all duration-200">
                    Cargo / Título <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <motion.input
                    type="text"
                    value={formData.cargo_titulo}
                    onChange={(e) => handleInputChange('cargo_titulo', e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    className="w-full px-4 py-3 bg-transparent border border-gray-200/50 dark:border-slate-600/50 rounded-xl text-color-contrast placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all duration-300 text-sm font-normal"
                    placeholder="Ej: Gerente de Marketing, CEO, Desarrollador..."
                  />
                </motion.div>

                {/* Nivel Organizacional */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <SelectField
                    value={formData.nivel_id}
                    onChange={(val) => handleInputChange('nivel_id', Number(val))}
                    options={[
                      { value: 0, label: 'Selecciona tu nivel' },
                      ...(referenceData?.niveles.map(nivel => ({
                        value: nivel.id,
                        label: nivel.nombre
                      })) || [])
                    ]}
                    label="Nivel Organizacional"
                    required
                    placeholder="Selecciona tu nivel"
                    searchable
                  />
                </motion.div>

                {/* Sector */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <SelectField
                    value={formData.sector_id}
                    onChange={(val) => handleInputChange('sector_id', Number(val))}
                    options={[
                      { value: 0, label: 'Selecciona tu sector' },
                      ...(referenceData?.sectores.map(sector => ({
                        value: sector.id,
                        label: sector.nombre
                      })) || [])
                    ]}
                    label="Sector (Opcional)"
                    placeholder="Selecciona tu sector"
                    searchable
                  />
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Área Funcional */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <SelectField
                    value={formData.area_id}
                    onChange={(val) => handleInputChange('area_id', Number(val))}
                    options={[
                      { value: 0, label: 'Selecciona tu área' },
                      ...(referenceData?.areas.map(area => ({
                        value: area.id,
                        label: area.nombre
                      })) || [])
                    ]}
                    label="Área Funcional"
                    required
                    placeholder="Selecciona tu área"
                    searchable
                  />
                </motion.div>

                {/* Tipo de Relación */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <SelectField
                    value={formData.relacion_id}
                    onChange={(val) => handleInputChange('relacion_id', Number(val))}
                    options={[
                      { value: 0, label: 'Selecciona tu relación' },
                      ...(referenceData?.relaciones.map(relacion => ({
                        value: relacion.id,
                        label: relacion.nombre
                      })) || [])
                    ]}
                    label="Tipo de Relación"
                    required
                    placeholder="Selecciona tu relación"
                    searchable
                  />
                </motion.div>

                {/* Tamaño de Empresa */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <SelectField
                    value={formData.tamano_id}
                    onChange={(val) => handleInputChange('tamano_id', Number(val))}
                    options={[
                      { value: 0, label: 'Selecciona el tamaño' },
                      ...(referenceData?.tamanos_empresa.map(tamano => ({
                        value: tamano.id,
                        label: tamano.nombre
                      })) || [])
                    ]}
                    label="Tamaño de Empresa (Opcional)"
                    placeholder="Selecciona el tamaño"
                    searchable
                  />
                </motion.div>

                {/* País */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <SelectField
                    value={formData.pais}
                    onChange={(val) => handleInputChange('pais', String(val))}
                    options={[
                      { value: '', label: 'Selecciona tu país' },
                      ...PAISES_WITH_FLAGS.map(pais => ({
                        value: pais.value,
                        label: pais.label,
                        flag: pais.flag
                      }))
                    ]}
                    label="País (Opcional)"
                    placeholder="Selecciona tu país"
                    searchable
                  />
                </motion.div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex justify-center mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
                disabled={saving}
                className="relative overflow-hidden group rounded-xl py-3.5 px-8 font-semibold text-sm text-white transition-all duration-300 border-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 shadow-lg"
                style={{
                  backgroundImage: saving
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6))'
                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  backgroundSize: '200% 200%',
                  backgroundPosition: saving ? 'center' : '0% 50%',
                  borderColor: saving ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  boxShadow: saving 
                    ? '0 4px 14px 0 rgba(59, 130, 246, 0.3)' 
                    : '0 4px 14px 0 rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                }}
                animate={!saving ? {
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                } : {}}
                transition={!saving ? {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                } : {}}
              >
                {/* Shimmer effect */}
                {!saving && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
                
                {/* Content */}
                <span className="relative z-10 flex items-center space-x-2.5">
                  {saving ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Analizando Perfil...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                      <span>Analizar Perfil</span>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
            </>
          ) : (
            <ProfileConfirmationSection 
              profile={recommendedProfile}
              onStartQuestionnaire={handleStartQuestionnaire}
              onModifyInformation={handleModifyInformation}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Confirmación de Perfil
function ProfileConfirmationSection({ 
  profile, 
  onStartQuestionnaire, 
  onModifyInformation 
}: { 
  profile: any; 
  onStartQuestionnaire: () => void; 
  onModifyInformation: () => void; 
}) {
  const router = useRouter();
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(profile);

  const manualProfiles = [
    'CEO (personal)', 'CTO/CIO', 'Dirección de Ventas', 'Miembros de Ventas',
    'Dirección de Marketing', 'Miembros de Marketing', 'Dirección de Operaciones', 'Miembros de Operaciones',
    'Dirección de Finanzas (CFO)', 'Miembros de Finanzas', 'Dirección de RRHH', 'Miembros de RRHH',
    'Dirección/Jefatura de Contabilidad', 'Miembros de Contabilidad', 'Dirección de Compras / Supply', 'Miembros de Compras',
    'Gerencia Media', 'Freelancer', 'Consultor'
  ];

  const handleManualProfileSelect = (profileName: string) => {
    const newProfile = generateManualProfile(profileName);
    setSelectedProfile(newProfile);
  };

  const generateManualProfile = (profileName: string) => {
    // Mapear nombres de perfiles a descripciones específicas
    const profileDescriptions: { [key: string]: string } = {
      'CEO (personal)': 'Cuestionario especializado en liderazgo estratégico y gestión empresarial',
      'CTO/CIO': 'Cuestionario especializado en tecnología y transformación digital',
      'Dirección de Ventas': 'Cuestionario especializado en estrategias de ventas y desarrollo comercial',
      'Miembros de Ventas': 'Cuestionario especializado en técnicas de ventas y cierre de negocios',
      'Dirección de Marketing': 'Cuestionario especializado en marketing estratégico y branding',
      'Miembros de Marketing': 'Cuestionario especializado en marketing digital y campañas',
      'Dirección de Operaciones': 'Cuestionario especializado en optimización de procesos y eficiencia',
      'Miembros de Operaciones': 'Cuestionario especializado en gestión operativa y productividad',
      'Dirección de Finanzas (CFO)': 'Cuestionario especializado en gestión financiera y análisis estratégico',
      'Miembros de Finanzas': 'Cuestionario especializado en análisis financiero y contabilidad',
      'Dirección de RRHH': 'Cuestionario especializado en gestión de talento y desarrollo organizacional',
      'Miembros de RRHH': 'Cuestionario especializado en recursos humanos y reclutamiento',
      'Dirección/Jefatura de Contabilidad': 'Cuestionario especializado en contabilidad gerencial y auditoría',
      'Miembros de Contabilidad': 'Cuestionario especializado en contabilidad y reportes financieros',
      'Dirección de Compras / Supply': 'Cuestionario especializado en gestión de compras y cadena de suministro',
      'Miembros de Compras': 'Cuestionario especializado en procesos de compras y negociación',
      'Gerencia Media': 'Cuestionario especializado en liderazgo de equipos y gestión intermedia',
      'Freelancer': 'Cuestionario especializado en emprendimiento y gestión de proyectos independientes',
      'Consultor': 'Cuestionario especializado en consultoría estratégica y análisis de negocios'
    };

    return {
      cargo: profileName,
      area: getAreaFromProfile(profileName),
      nivel: getNivelFromProfile(profileName),
      relacion: 'Empleado(a)',
      sector: 'Tecnología',
      tamano: 'Startup (1-10 empleados)',
      description: profileDescriptions[profileName] || 'Cuestionario personalizado basado en tu perfil profesional'
    };
  };

  const getAreaFromProfile = (profileName: string) => {
    if (profileName.includes('Ventas')) return 'Ventas';
    if (profileName.includes('Marketing')) return 'Marketing';
    if (profileName.includes('Finanzas') || profileName.includes('Contabilidad')) return 'Finanzas';
    if (profileName.includes('RRHH')) return 'Recursos Humanos';
    if (profileName.includes('Operaciones')) return 'Operaciones';
    if (profileName.includes('Compras')) return 'Compras';
    if (profileName.includes('CEO') || profileName.includes('CTO') || profileName.includes('CIO')) return 'Tecnología/TI';
    return 'General';
  };

  const getNivelFromProfile = (profileName: string) => {
    if (profileName.includes('Dirección') || profileName.includes('CEO') || profileName.includes('CTO') || profileName.includes('CIO')) {
      return 'Dirección de Área';
    }
    if (profileName.includes('Jefatura') || profileName.includes('Gerencia')) {
      return 'Gerencia Media';
    }
    return 'Miembro del Equipo';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-10 sm:mb-12"
      >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-color-contrast mb-3 sm:mb-4 tracking-tight">
                  Perfil Recomendado
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary opacity-70 font-normal max-w-2xl mx-auto">
                  Basado en la información proporcionada, este es el cuestionario que mejor se adapta a tu perfil:
                </p>
      </motion.div>

      {/* Recommended Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-slate-700/50 shadow-xl mb-8"
      >
        <div className="flex items-start space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
            className="p-3 bg-primary/20 rounded-lg"
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
          
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-lg sm:text-xl lg:text-2xl font-semibold text-color-contrast mb-2 tracking-tight"
            >
              {selectedProfile?.cargo}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-xs text-text-secondary opacity-70 font-normal mb-6"
            >
              {selectedProfile?.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Cargo:</span>
                  <span className="text-sm text-color-contrast font-normal">{selectedProfile?.cargo}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Área:</span>
                  <span className="text-sm text-color-contrast font-normal">{selectedProfile?.area}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Nivel:</span>
                  <span className="text-sm text-color-contrast font-normal">{selectedProfile?.nivel}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Relación:</span>
                  <span className="text-sm text-color-contrast font-normal">{selectedProfile?.relacion}</span>
                </div>
                {selectedProfile?.sector && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Sector:</span>
                    <span className="text-sm text-color-contrast font-normal">{selectedProfile.sector}</span>
                  </div>
                )}
                {selectedProfile?.tamano && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-text-secondary opacity-70 font-medium uppercase tracking-wider">Empresa:</span>
                    <span className="text-sm text-color-contrast font-normal">{selectedProfile.tamano}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Manual Selection Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-center mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowManualOptions(!showManualOptions)}
          className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium text-sm sm:text-base"
        >
          {showManualOptions ? 'Ocultar opciones manuales' : '¿No es tu perfil? Selecciona manualmente'}
        </motion.button>
      </motion.div>

      {/* Manual Profile Selection */}
      {showManualOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center"
          >
            Selecciona tu perfil manualmente:
          </motion.h3>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {manualProfiles.map((profileName, index) => (
              <motion.button
                key={profileName}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleManualProfileSelect(profileName)}
                className={`p-3 border rounded-lg text-sm transition-all duration-200 ${
                  selectedProfile?.cargo === profileName
                    ? 'bg-primary/30 dark:bg-primary/30 border-primary dark:border-primary text-gray-900 dark:text-white'
                    : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white hover:bg-primary/20 dark:hover:bg-primary/20 hover:border-primary/50 dark:hover:border-primary/50'
                }`}
              >
                {profileName}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartQuestionnaire}
          className="relative overflow-hidden group rounded-xl py-3.5 px-8 font-semibold text-sm text-white transition-all duration-300 border-2 flex items-center justify-center space-x-2.5 shadow-lg"
          style={{
            backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            backgroundSize: '200% 200%',
            backgroundPosition: '0% 50%',
            borderColor: 'transparent',
            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          <span className="relative z-10 flex items-center space-x-2.5">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <span>Comenzar Cuestionario</span>
          </span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onModifyInformation}
          className="rounded-xl py-3.5 px-8 font-medium text-sm text-text-secondary border border-gray-200/50 dark:border-slate-600/50 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          Modificar Información
        </motion.button>
      </motion.div>
    </motion.div>
  );
}