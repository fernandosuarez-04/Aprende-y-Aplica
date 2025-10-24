# 📹 Guía para Subir Reels - Panel de Instructor/Administrador

## 📋 Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
- [Proceso de Subida de Videos](#proceso-de-subida-de-videos)
- [API Endpoints](#api-endpoints)
- [Campos Requeridos](#campos-requeridos)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Validaciones](#validaciones)
- [Troubleshooting](#troubleshooting)

## 🔧 Requisitos Previos

### 1. Configuración de Supabase
- ✅ **Bucket configurado** para videos de reels
- ✅ **Tablas creadas** (ejecutar `docs/database/reels_tables.sql`)
- ✅ **Políticas RLS** configuradas
- ✅ **Variables de entorno** configuradas

### 2. Permisos de Usuario
- ✅ **Usuario autenticado** en el sistema
- ✅ **Rol de Instructor** o **Administrador**
- ✅ **Permisos de escritura** en el bucket de Supabase

## 🗄️ Estructura de la Base de Datos

### Tabla Principal: `reels`
```sql
CREATE TABLE reels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                    -- Título del reel
    description TEXT,                               -- Descripción opcional
    video_url TEXT NOT NULL,                       -- URL del video en Supabase Storage
    thumbnail_url TEXT,                            -- URL del thumbnail (opcional)
    duration_seconds INTEGER,                      -- Duración en segundos
    category VARCHAR(100),                         -- Categoría del contenido
    language VARCHAR(10) DEFAULT 'es',            -- Idioma del contenido
    is_featured BOOLEAN DEFAULT FALSE,            -- Reel destacado
    is_active BOOLEAN DEFAULT TRUE,               -- Estado activo/inactivo
    view_count INTEGER DEFAULT 0,                 -- Contador de visualizaciones
    like_count INTEGER DEFAULT 0,                 -- Contador de likes
    share_count INTEGER DEFAULT 0,                -- Contador de compartidos
    comment_count INTEGER DEFAULT 0,              -- Contador de comentarios
    created_by UUID REFERENCES users(id),         -- Usuario que creó el reel
    created_at TIMESTAMPTZ DEFAULT NOW(),         -- Fecha de creación
    updated_at TIMESTAMPTZ DEFAULT NOW(),         -- Fecha de actualización
    published_at TIMESTAMPTZ                      -- Fecha de publicación
);
```

### Tablas Relacionadas
- `reel_hashtags` - Hashtags disponibles
- `reel_hashtag_relations` - Relación entre reels y hashtags
- `reel_likes` - Likes de usuarios
- `reel_comments` - Comentarios
- `reel_shares` - Compartidos
- `reel_views` - Visualizaciones (analytics)

## 📤 Proceso de Subida de Videos

### Paso 1: Subir Video a Supabase Storage
```javascript
// Ejemplo de subida de video
const uploadVideo = async (file) => {
  const { data, error } = await supabase.storage
    .from('reels-videos')  // Nombre del bucket
    .upload(`reels/${Date.now()}-${file.name}`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
};
```

### Paso 2: Generar Thumbnail (Opcional)
```javascript
// Generar thumbnail del video
const generateThumbnail = async (videoUrl) => {
  // Usar una librería como video-thumbnail-generator
  // o subir thumbnail manualmente
  return thumbnailUrl;
};
```

### Paso 3: Crear Reel en Base de Datos
```javascript
// Crear reel usando la API
const createReel = async (reelData) => {
  const response = await fetch('/api/reels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reelData)
  });
  
  return response.json();
};
```

## 🔌 API Endpoints

### POST `/api/reels`
Crear un nuevo reel

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Título del Reel",
  "description": "Descripción opcional del contenido",
  "video_url": "https://supabase.co/storage/v1/object/public/reels-videos/video.mp4",
  "thumbnail_url": "https://supabase.co/storage/v1/object/public/reels-thumbnails/thumb.jpg",
  "duration_seconds": 120,
  "category": "tecnologia",
  "language": "es",
  "hashtags": ["ia", "tecnologia", "innovacion"]
}
```

**Response:**
```json
{
  "reel": {
    "id": "uuid",
    "title": "Título del Reel",
    "video_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    // ... otros campos
  },
  "message": "Reel creado exitosamente"
}
```

### PUT `/api/reels/[id]`
Actualizar un reel existente

**Body:**
```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "category": "nueva-categoria",
  "hashtags": ["nuevo", "hashtag"]
}
```

### DELETE `/api/reels/[id]`
Eliminar un reel (marcar como inactivo)

## 📝 Campos Requeridos

### Obligatorios
- ✅ **`title`** - Título del reel (máx. 255 caracteres)
- ✅ **`video_url`** - URL del video en Supabase Storage

### Opcionales
- 📝 **`description`** - Descripción del contenido
- 🖼️ **`thumbnail_url`** - URL del thumbnail
- ⏱️ **`duration_seconds`** - Duración en segundos
- 🏷️ **`category`** - Categoría del contenido
- 🌐 **`language`** - Idioma (default: 'es')
- ⭐ **`is_featured`** - Reel destacado (default: false)
- #️⃣ **`hashtags`** - Array de hashtags

### Categorías Disponibles
```javascript
const categories = [
  'tecnologia',
  'educacion', 
  'trabajo',
  'emprendimiento',
  'seguridad',
  'programacion',
  'ia',
  'innovacion',
  'tutoriales',
  'noticias'
];
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Reel Básico
```javascript
const reelData = {
  title: "Introducción a React Hooks",
  description: "Aprende los conceptos básicos de React Hooks en este tutorial rápido",
  video_url: "https://supabase.co/storage/v1/object/public/reels-videos/react-hooks.mp4",
  duration_seconds: 180,
  category: "programacion",
  hashtags: ["react", "hooks", "javascript", "tutorial"]
};

const result = await createReel(reelData);
```

### Ejemplo 2: Reel Destacado
```javascript
const featuredReel = {
  title: "Nuevas tendencias en IA 2024",
  description: "Descubre las últimas innovaciones en inteligencia artificial",
  video_url: "https://supabase.co/storage/v1/object/public/reels-videos/ia-trends.mp4",
  thumbnail_url: "https://supabase.co/storage/v1/object/public/reels-thumbnails/ia-thumb.jpg",
  duration_seconds: 240,
  category: "tecnologia",
  is_featured: true,
  hashtags: ["ia", "tecnologia", "innovacion", "2024"]
};
```

### Ejemplo 3: Reel con Thumbnail Personalizado
```javascript
const reelWithThumbnail = {
  title: "Tutorial de CSS Grid",
  description: "Domina CSS Grid con ejemplos prácticos",
  video_url: "https://supabase.co/storage/v1/object/public/reels-videos/css-grid.mp4",
  thumbnail_url: "https://supabase.co/storage/v1/object/public/reels-thumbnails/css-grid-custom.jpg",
  duration_seconds: 300,
  category: "programacion",
  hashtags: ["css", "grid", "web", "diseño"]
};
```

## ✅ Validaciones

### Validaciones del Frontend
```javascript
const validateReel = (reelData) => {
  const errors = [];
  
  // Título requerido
  if (!reelData.title || reelData.title.trim().length === 0) {
    errors.push('El título es requerido');
  }
  
  // Título no muy largo
  if (reelData.title && reelData.title.length > 255) {
    errors.push('El título no puede exceder 255 caracteres');
  }
  
  // URL del video requerida
  if (!reelData.video_url) {
    errors.push('La URL del video es requerida');
  }
  
  // URL válida
  if (reelData.video_url && !isValidUrl(reelData.video_url)) {
    errors.push('La URL del video no es válida');
  }
  
  // Duración válida
  if (reelData.duration_seconds && reelData.duration_seconds < 0) {
    errors.push('La duración debe ser un número positivo');
  }
  
  // Categoría válida
  if (reelData.category && !categories.includes(reelData.category)) {
    errors.push('La categoría no es válida');
  }
  
  return errors;
};
```

### Validaciones del Backend
- ✅ **Autenticación** - Usuario debe estar autenticado
- ✅ **Autorización** - Usuario debe tener permisos de instructor/admin
- ✅ **Título** - Requerido, máximo 255 caracteres
- ✅ **Video URL** - Requerido, debe ser URL válida
- ✅ **Categoría** - Debe existir en la lista de categorías
- ✅ **Hashtags** - Máximo 10 hashtags por reel

## 🔧 Configuración del Panel de Administración

### Componente de Subida de Reels
```jsx
// components/ReelUploadForm.jsx
import { useState } from 'react';
import { uploadVideo, createReel } from '../services/reelService';

const ReelUploadForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    hashtags: [],
    is_featured: false
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      // 1. Subir video
      const videoData = await uploadVideo(videoFile);
      
      // 2. Subir thumbnail (opcional)
      let thumbnailData = null;
      if (thumbnailFile) {
        thumbnailData = await uploadThumbnail(thumbnailFile);
      }
      
      // 3. Crear reel
      const reelData = {
        ...formData,
        video_url: videoData.path,
        thumbnail_url: thumbnailData?.path || null,
        duration_seconds: await getVideoDuration(videoFile)
      };
      
      const result = await createReel(reelData);
      
      // 4. Mostrar éxito
      showSuccess('Reel creado exitosamente');
      
    } catch (error) {
      showError('Error al crear el reel: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
};
```

### Servicio de Reels
```javascript
// services/reelService.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const uploadVideo = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('reels-videos')
    .upload(fileName, file);
    
  if (error) throw error;
  return data;
};

export const uploadThumbnail = async (file) => {
  const fileName = `thumb-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('reels-thumbnails')
    .upload(fileName, file);
    
  if (error) throw error;
  return data;
};

export const createReel = async (reelData) => {
  const response = await fetch('/api/reels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reelData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

## 🚨 Troubleshooting

### Errores Comunes

#### 1. Error 401 - No autorizado
```
Solución: Verificar que el usuario esté autenticado y tenga permisos de instructor/admin
```

#### 2. Error 500 - Error interno del servidor
```
Solución: Verificar que las tablas de reels existan en la base de datos
```

#### 3. Error de subida de video
```
Solución: Verificar configuración del bucket de Supabase y permisos RLS
```

#### 4. Video no se reproduce
```
Solución: Verificar que la URL del video sea pública y accesible
```

### Checklist de Verificación
- ✅ **Tablas creadas** en Supabase
- ✅ **Bucket configurado** para videos
- ✅ **Políticas RLS** configuradas
- ✅ **Usuario autenticado** con permisos
- ✅ **URLs válidas** de videos
- ✅ **Categorías válidas** en la lista
- ✅ **Hashtags** en formato correcto

## 📊 Monitoreo y Analytics

### Métricas Disponibles
- 📈 **Visualizaciones** - Contador automático
- ❤️ **Likes** - Sistema de likes
- 💬 **Comentarios** - Sistema de comentarios
- 📤 **Compartidos** - Contador de shares
- ⏱️ **Tiempo de visualización** - Analytics detallados

### Dashboard de Administración
```javascript
// Obtener estadísticas de reels
const getReelStats = async () => {
  const response = await fetch('/api/reels/stats');
  return response.json();
};

// Respuesta esperada
{
  "totalReels": 150,
  "totalViews": 125000,
  "totalLikes": 8500,
  "totalComments": 1200,
  "topCategories": [
    { "category": "tecnologia", "count": 45 },
    { "category": "educacion", "count": 38 }
  ],
  "recentReels": [
    // Array de reels recientes
  ]
}
```

## 🔐 Seguridad

### Políticas RLS (Row Level Security)
```sql
-- Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow read access to reels" ON reels
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción solo a instructores y administradores
CREATE POLICY "Allow insert to instructors and admins" ON reels
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE cargo_rol IN ('instructor', 'administrador')
    )
  );

-- Permitir actualización solo al creador o administradores
CREATE POLICY "Allow update to creator or admins" ON reels
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    auth.uid() IN (
      SELECT id FROM users WHERE cargo_rol = 'administrador'
    )
  );
```

### Validación de Archivos
```javascript
const validateVideoFile = (file) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (file.size > maxSize) {
    throw new Error('El archivo es demasiado grande (máx. 100MB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }
  
  return true;
};
```

---

## 📞 Soporte

Para dudas o problemas con la implementación de reels, contactar al equipo de desarrollo o revisar la documentación técnica en `docs/database/reels_tables.sql`.

**Última actualización:** Diciembre 2024  
**Versión:** 1.0
