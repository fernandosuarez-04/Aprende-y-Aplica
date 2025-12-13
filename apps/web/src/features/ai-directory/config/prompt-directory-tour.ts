import { VoiceGuideStep } from '../../../core/components/ContextualVoiceGuide';

export const PROMPT_DIRECTORY_TOUR_STEPS: VoiceGuideStep[] = [
  {
    id: 1,
    title: '¡Bienvenido al Directorio de Prompts!',
    description: 'Este es tu centro de recursos para descubrir, crear y compartir prompts profesionales de inteligencia artificial.',
    speech: 'Bienvenido al Directorio de Prompts. Este es tu centro de recursos para descubrir, crear y compartir prompts profesionales de inteligencia artificial.'
  },
  {
    id: 2,
    title: 'Explora prompts destacados',
    description: 'Aquí encontrarás una colección curada de prompts profesionales creados por expertos. Puedes filtrar por categoría, buscar por palabras clave y marcar tus favoritos.',
    speech: 'Aquí encontrarás una colección curada de prompts profesionales. Puedes filtrar por categoría, buscar por palabras clave y marcar tus favoritos.'
  },
  {
    id: 3,
    title: 'Busca lo que necesitas',
    description: 'Usa la barra de búsqueda para encontrar prompts específicos. También puedes filtrar por prompts destacados o ver solo tus favoritos.',
    speech: 'Usa la barra de búsqueda para encontrar prompts específicos. También puedes filtrar por prompts destacados o ver solo tus favoritos.'
  },
  {
    id: 4,
    title: 'Crea tus propios prompts',
    description: 'Haz clic en "Crear Prompt" para acceder al Prompt Maker, una herramienta avanzada que te ayuda a diseñar prompts profesionales con IA.',
    speech: 'Haz clic en Crear Prompt para acceder al Prompt Maker, una herramienta avanzada que te ayuda a diseñar prompts profesionales con inteligencia artificial.',
    action: {
      label: 'Ir a Prompt Maker',
      path: '/prompt-directory/create'
    }
  },
  {
    id: 5,
    title: 'Guarda tus favoritos',
    description: 'Marca los prompts que te gusten como favoritos para acceder a ellos rápidamente. Tus favoritos se sincronizan en todos tus dispositivos.',
    speech: 'Marca los prompts que te gusten como favoritos para acceder a ellos rápidamente. Tus favoritos se sincronizan en todos tus dispositivos.'
  },
  {
    id: 6,
    title: 'Pregúntame lo que necesites',
    description: 'Si tienes alguna duda sobre cómo usar el directorio de prompts o necesitas ayuda, puedo responderte por voz. Haz clic en el micrófono y háblame.',
    speech: 'Si tienes alguna duda sobre cómo usar el directorio de prompts, haz clic en el micrófono y háblame. Te responderé por voz.'
  },
  {
    id: 7,
    title: '¡Listo para crear!',
    description: 'Ahora tienes todo lo necesario para aprovechar al máximo el directorio de prompts. Recuerda, LIA está disponible si necesitas ayuda.',
    speech: 'Ahora tienes todo lo necesario para aprovechar al máximo el directorio de prompts. Recuerda, LIA está disponible si necesitas ayuda.',
    action: {
      label: 'Explorar Prompts',
      path: '/prompt-directory'
    }
  }
];
