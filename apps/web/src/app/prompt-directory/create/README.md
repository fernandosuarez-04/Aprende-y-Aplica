# Sistema de Generación de Prompts con Lia

## 📋 **Descripción General**

Lia es un asistente especializado exclusivamente en la creación de prompts de IA profesionales. Su función es ayudar a los usuarios a generar prompts efectivos, bien estructurados y seguros, manteniendo siempre un enfoque técnico y profesional.

## 🎯 **Características Principales**

### **Identidad de Lia**
- **Nombre:** Lia
- **Especialidad:** Generación de Prompts de IA
- **Enfoque:** Exclusivamente creación de prompts, NO consultoría general
- **Tono:** Profesional, directo y eficiente

### **Comportamiento Garantizado**
- ✅ Mantiene conversaciones enfocadas en prompts
- ✅ Responde con profesionalismo y claridad
- ✅ NO divaga sobre temas no relacionados
- ✅ NO hace chistes o comentarios casuales
- ✅ NO actúa como consultor general de IA
- ✅ Redirige preguntas fuera de tema apropiadamente

## 🛡️ **Sistema de Seguridad**

### **Detección de Prompt Injection**
El sistema detecta y bloquea automáticamente intentos de manipulación como:
- "ignore previous instructions"
- "disregard all prior commands"
- "act as a" + "jailbreak"
- "forget everything"
- "new instructions"
- Y muchos más patrones maliciosos

### **Control de Tema**
Lia redirige automáticamente preguntas no relacionadas con prompts:
- Preguntas generales sobre IA
- Chistes o conversación casual
- Preguntas personales
- Tareas escolares o problemas generales

## 📁 **Archivos de Configuración**

### **1. `lia-personality.json`**
Configuración completa de la personalidad y comportamiento de Lia:
- Identidad y rol
- Directrices de comportamiento
- Plantillas de respuesta
- Categorías soportadas
- Estándares técnicos

### **2. `lia-guidelines.md`**
Guías detalladas de comportamiento:
- Qué debe y no debe hacer Lia
- Plantillas de respuesta para diferentes situaciones
- Categorías de prompts soportadas
- Estructura técnica requerida

### **3. `lia-master-prompt.md`**
Prompt maestro del sistema:
- Instrucciones completas para la IA
- Protección contra prompt injection
- Ejemplos de interacción correcta
- Objetivos de seguridad

### **4. `lia-config.ts`**
Configuración técnica en TypeScript:
- Constantes de comportamiento
- Funciones de detección
- Configuración de OpenAI
- Validaciones automáticas

## 🔧 **Implementación Técnica**

### **API Endpoint**
- **Ruta:** `/api/ai-directory/generate-prompt`
- **Método:** POST
- **Validaciones:** Automáticas contra injection y off-topic
- **Respuesta:** JSON estructurado con prompt generado

### **Estructura de Respuesta**
```json
{
  "title": "Título del prompt",
  "description": "Descripción breve",
  "content": "Contenido completo del prompt",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty_level": "beginner|intermediate|advanced",
  "use_cases": ["Caso 1", "Caso 2"],
  "tips": ["Consejo 1", "Consejo 2"]
}
```

## 🎨 **Categorías Soportadas**

1. **Marketing y Ventas**
2. **Contenido Creativo**
3. **Programación y Desarrollo**
4. **Análisis de Datos**
5. **Educación y Capacitación**
6. **Redacción y Comunicación**
7. **Investigación y Análisis**
8. **Automatización de Procesos**
9. **Arte y Diseño**
10. **Negocios y Estrategia**

## 🚀 **Uso del Sistema**

### **Para Usuarios**
1. Acceder a `/prompt-directory/create`
2. Describir el tipo de prompt necesario
3. Recibir un prompt profesional generado
4. Copiar o guardar el prompt

### **Para Desarrolladores**
1. Importar configuración desde `lia-config.ts`
2. Usar funciones de validación automática
3. Personalizar respuestas según necesidades
4. Extender categorías si es necesario

## 🔒 **Seguridad y Ética**

- **Prompt Injection:** Detectado y bloqueado automáticamente
- **Contenido Malicioso:** Filtrado por el prompt maestro
- **Desviación de Tema:** Redirigida apropiadamente
- **Profesionalismo:** Garantizado en todas las interacciones

## 📊 **Métricas de Calidad**

- **Enfoque:** 100% en creación de prompts
- **Profesionalismo:** Tono consistente y técnico
- **Seguridad:** Protección contra manipulación
- **Utilidad:** Prompts estructurados y efectivos

---

**Nota:** Este sistema está diseñado para mantener a Lia enfocada exclusivamente en su especialidad, garantizando respuestas profesionales y útiles para la creación de prompts de IA.
