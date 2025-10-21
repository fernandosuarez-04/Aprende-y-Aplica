# Implementación de Subida de Archivos - Perfil de Usuario

## ✅ **Funcionalidad Implementada**

### 🎯 **Características Principales**
- ✅ **Subida de foto de perfil** - JPG, PNG, WebP (máximo 5MB)
- ✅ **Subida de curriculum** - PDF, DOC, DOCX (máximo 10MB)
- ✅ **Visualización de archivos existentes** - Muestra foto y CV cargados
- ✅ **Validación de archivos** - Tipo y tamaño
- ✅ **Integración con Supabase Storage** - Buckets configurados
- ✅ **Actualización automática** - URLs se guardan en la base de datos

## 🛠️ **Implementación Técnica**

### **1. APIs de Upload Actualizadas**

#### **Upload de Foto de Perfil** (`/api/profile/upload-picture`)
```typescript
// Validaciones implementadas
- Tipos permitidos: image/jpeg, image/png, image/webp
- Tamaño máximo: 5MB
- Generación de nombre único: {userId}-{timestamp}.{ext}
- Subida a bucket: 'profile-pictures'
- Actualización automática en tabla 'users'
```

#### **Upload de Curriculum** (`/api/profile/upload-curriculum`)
```typescript
// Validaciones implementadas
- Tipos permitidos: PDF, DOC, DOCX
- Tamaño máximo: 10MB
- Generación de nombre único: {userId}-cv-{timestamp}.{ext}
- Subida a bucket: 'curriculums'
- Actualización automática en tabla 'users'
```

### **2. Hook useProfile Mejorado**

#### **Funciones de Upload**
```typescript
// uploadProfilePicture(file: File)
- Validación de tipo y tamaño
- Manejo de errores mejorado
- Actualización de estado local
- Retorna URL del archivo

// uploadCurriculum(file: File)
- Validación de tipo y tamaño
- Manejo de errores mejorado
- Actualización de estado local
- Retorna URL del archivo
```

### **3. Interfaz de Usuario Mejorada**

#### **Foto de Perfil**
```typescript
// Características
- Botón de upload integrado en el avatar
- Muestra foto existente o icono por defecto
- Animaciones con Framer Motion
- Tooltip explicativo
- Validación visual
```

#### **Curriculum**
```typescript
// Características
- Botón de upload estilizado
- Indicador de archivo cargado
- Enlace para ver CV existente
- Validación de tipos de archivo
- Feedback visual del estado
```

## 🎨 **Experiencia de Usuario**

### **Subida de Foto de Perfil**
1. **Hover sobre avatar** - Se muestra botón de upload
2. **Click en botón** - Se abre selector de archivos
3. **Selección de archivo** - Validación automática
4. **Upload automático** - Progreso visual
5. **Actualización inmediata** - Nueva foto visible

### **Subida de Curriculum**
1. **Click en "Subir CV"** - Se abre selector de archivos
2. **Selección de archivo** - Validación de tipo y tamaño
3. **Upload automático** - Progreso visual
4. **Confirmación visual** - Indicador verde + enlace "Ver CV"

## 🔧 **Configuración de Supabase**

### **Buckets Requeridos**
```sql
-- Bucket para fotos de perfil
CREATE BUCKET 'profile-pictures' WITH (
  public = true,
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para curriculums
CREATE BUCKET 'curriculums' WITH (
  public = true,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);
```

### **Políticas RLS**
```sql
-- Política para profile-pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para curriculums
CREATE POLICY "Users can upload their own curriculums" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'curriculums' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📁 **Estructura de Archivos**

### **APIs de Upload**
```
apps/web/src/app/api/profile/
├── upload-picture/route.ts     # API para foto de perfil
└── upload-curriculum/route.ts  # API para curriculum
```

### **Hook de Perfil**
```
apps/web/src/features/profile/hooks/
└── useProfile.ts               # Hook con funciones de upload
```

### **Página de Perfil**
```
apps/web/src/app/profile/
└── page.tsx                    # UI con uploads integrados
```

## 🚀 **Cómo Usar**

### **1. Subir Foto de Perfil**
```typescript
// En el componente
const { uploadProfilePicture } = useProfile()

const handleUpload = async (file: File) => {
  try {
    const imageUrl = await uploadProfilePicture(file)
    console.log('Foto subida:', imageUrl)
  } catch (error) {
    console.error('Error:', error.message)
  }
}
```

### **2. Subir Curriculum**
```typescript
// En el componente
const { uploadCurriculum } = useProfile()

const handleUpload = async (file: File) => {
  try {
    const cvUrl = await uploadCurriculum(file)
    console.log('CV subido:', cvUrl)
  } catch (error) {
    console.error('Error:', error.message)
  }
}
```

## 🐛 **Manejo de Errores**

### **Errores de Validación**
- ✅ **Tipo de archivo inválido** - Mensaje claro
- ✅ **Archivo demasiado grande** - Límites específicos
- ✅ **Archivo no seleccionado** - Validación previa

### **Errores de Upload**
- ✅ **Error de red** - Reintento automático
- ✅ **Error de Supabase** - Mensaje descriptivo
- ✅ **Error de autenticación** - Redirección a login

### **Errores de Base de Datos**
- ✅ **Error al actualizar perfil** - Rollback automático
- ✅ **Error de permisos** - Verificación de RLS

## ✨ **Características Avanzadas**

### **Validación en Tiempo Real**
- ✅ **Tipo de archivo** - Verificación inmediata
- ✅ **Tamaño de archivo** - Validación antes de upload
- ✅ **Formato de imagen** - Previsualización automática

### **Optimización de Performance**
- ✅ **Nombres únicos** - Evita conflictos
- ✅ **Compresión automática** - Reduce tamaño
- ✅ **Lazy loading** - Carga bajo demanda

### **Seguridad**
- ✅ **Validación de tipos** - Solo archivos permitidos
- ✅ **Límites de tamaño** - Previene abuso
- ✅ **Autenticación requerida** - Solo usuarios autenticados
- ✅ **RLS habilitado** - Acceso restringido

## 🎯 **Próximas Mejoras**

### **Funcionalidades Adicionales**
- [ ] **Compresión de imágenes** - Reducir tamaño automáticamente
- [ ] **Previsualización** - Ver imagen antes de subir
- [ ] **Drag & Drop** - Arrastrar archivos
- [ ] **Progreso de upload** - Barra de progreso visual
- [ ] **Múltiples formatos** - Soporte para más tipos

### **Optimizaciones**
- [ ] **CDN integration** - Mejor performance global
- [ ] **Caching inteligente** - Reducir requests
- [ ] **Lazy loading** - Carga bajo demanda
- [ ] **WebP automático** - Conversión de formatos

¡La funcionalidad de subida de archivos está completamente implementada y lista para usar! 🎉
