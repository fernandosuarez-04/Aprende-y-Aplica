# Guía de Testing: Geolocalización en Jerarquía

**Fecha:** 9 de Enero, 2026  
**Objetivo:** Verificar que la funcionalidad de geolocalización automática funciona correctamente en Regiones, Zonas y Equipos.

---

## 📋 Pre-requisitos

1. ✅ Tener una organización con permisos de administrador
2. ✅ Tener al menos una Región, Zona o Equipo creada (o crear una nueva)
3. ✅ Conexión a internet (requiere acceso a OpenStreetMap Nominatim API)
4. ✅ Navegador moderno con JavaScript habilitado

---

## 🧪 Casos de Prueba

### **Caso 1: Probar Geolocalización en una Región**

#### Pasos:
1. **Navegar a la jerarquía:**
   - Ir a: `/{orgSlug}/business-panel/hierarchy`
   - Hacer clic en una Región existente (o crear una nueva)

2. **Abrir el formulario de edición:**
   - Hacer clic en el botón **"Editar"** (ícono de lápiz) en la tarjeta de la región

3. **Completar datos de ubicación:**
   - Expandir la sección **"📍 Ubicación"** si está colapsada
   - Llenar los campos:
     - **Dirección (Calle)**: `Av. Insurgentes Sur 1647`
     - **Ciudad**: `Ciudad de México`
     - **Estado**: `CDMX`
     - **País**: `México`
     - **Código Postal**: `03920` (opcional)

4. **Calcular coordenadas automáticamente:**
   - Hacer clic en el botón **"📍 Calcular coordenadas desde dirección"**
   - ⏳ Esperar 2-5 segundos (debería mostrar un spinner)
   - ✅ Verificar que los campos **Latitud** y **Longitud** se llenen automáticamente
   - Ejemplo esperado:
     - Latitud: `19.3556` (aproximadamente)
     - Longitud: `-99.1886` (aproximadamente)

5. **Guardar cambios:**
   - Hacer clic en **"Guardar"**
   - ✅ Verificar que se muestre un mensaje de éxito

6. **Verificar el mapa:**
   - Ir a la pestaña **"Estructura y Mapa"** (o "Estructura/Miembros")
   - ✅ Verificar que el mapa se muestre con un marcador en la ubicación
   - ✅ Verificar que el marcador esté en la posición correcta

#### Resultado Esperado:
- ✅ Las coordenadas se calculan automáticamente
- ✅ El mapa muestra la ubicación correcta
- ✅ No hay errores en la consola del navegador

---

### **Caso 2: Probar Geolocalización en una Zona**

#### Pasos:
1. **Navegar a una Zona:**
   - Desde la página de Región, hacer clic en una Zona
   - O ir directamente a: `/{orgSlug}/business-panel/hierarchy/zone/{zoneId}`

2. **Editar la zona:**
   - Hacer clic en **"Editar"**
   - Expandir la sección **"📍 Ubicación"**

3. **Probar con diferentes formatos de dirección:**
   
   **Prueba A - Dirección completa:**
   - Dirección: `Calle 5 de Mayo 123`
   - Ciudad: `Monterrey`
   - Estado: `Nuevo León`
   - País: `México`
   - Clic en "Calcular coordenadas"
   - ✅ Verificar que funcione

   **Prueba B - Solo ciudad y estado:**
   - Dirección: (dejar vacío)
   - Ciudad: `Guadalajara`
   - Estado: `Jalisco`
   - País: `México`
   - Clic en "Calcular coordenadas"
   - ✅ Verificar que funcione (debe calcular el centro de la ciudad)

4. **Verificar en el mapa:**
   - Guardar cambios
   - Ir a la pestaña **"Estructura y Mapa"**
   - ✅ Verificar que el mapa muestre la zona
   - ✅ Si hay equipos con coordenadas, deberían aparecer también

#### Resultado Esperado:
- ✅ Funciona con diferentes formatos de dirección
- ✅ Funciona incluso sin dirección específica (solo ciudad/estado)
- ✅ El mapa muestra todas las ubicaciones correctamente

---

### **Caso 3: Probar Geolocalización en un Equipo**

#### Pasos:
1. **Navegar a un Equipo:**
   - Desde la página de Zona, hacer clic en un Equipo
   - O ir directamente a: `/{orgSlug}/business-panel/hierarchy/team/{teamId}`

2. **Editar el equipo:**
   - Hacer clic en **"Editar"**
   - Expandir **"📍 Ubicación"**

3. **Probar con dirección internacional:**
   - Dirección: `1600 Amphitheatre Parkway`
   - Ciudad: `Mountain View`
   - Estado: `California`
   - País: `United States`
   - Código Postal: `94043`
   - Clic en "Calcular coordenadas"
   - ✅ Verificar que funcione con direcciones internacionales

4. **Verificar el mapa:**
   - Guardar y ver el mapa en la pestaña correspondiente
   - ✅ Verificar que el marcador aparezca

#### Resultado Esperado:
- ✅ Funciona con direcciones internacionales
- ✅ El mapa se actualiza correctamente

---

### **Caso 4: Pruebas de Errores y Casos Límite**

#### 4.1 Dirección no encontrada:
- **Prueba:**
  - Dirección: `Dirección Inexistente 999`
  - Ciudad: `Ciudad Falsa`
  - Estado: `Estado Inexistente`
  - Clic en "Calcular coordenadas"
  
- **Resultado Esperado:**
  - ⚠️ Los campos de latitud/longitud NO se llenan
  - ⚠️ No debe mostrar error visible (falla silenciosamente)
  - ✅ El botón vuelve a su estado normal

#### 4.2 Campos vacíos:
- **Prueba:**
  - Dejar todos los campos de ubicación vacíos
  - Clic en "Calcular coordenadas"
  
- **Resultado Esperado:**
  - ⚠️ El botón debe estar deshabilitado (disabled)
  - ✅ No debe hacer ninguna petición

#### 4.3 Edición manual de coordenadas:
- **Prueba:**
  - Llenar latitud y longitud manualmente
  - Ejemplo: `19.4326` y `-99.1332`
  - Guardar
  
- **Resultado Esperado:**
  - ✅ Debe guardar las coordenadas manuales
  - ✅ El mapa debe mostrar la ubicación manual

---

## 🔍 Verificaciones Adicionales

### **En la Consola del Navegador:**
1. Abrir DevTools (F12)
2. Ir a la pestaña **Console**
3. Al hacer clic en "Calcular coordenadas", verificar:
   - ✅ No hay errores en rojo
   - ✅ Puede haber logs informativos (no críticos)

### **En la Pestaña Network:**
1. Abrir DevTools → **Network**
2. Hacer clic en "Calcular coordenadas"
3. Verificar:
   - ✅ Se hace una petición a `nominatim.openstreetmap.org`
   - ✅ La petición retorna status 200
   - ✅ La respuesta contiene `lat` y `lon`

### **Verificación Visual del Mapa:**
1. El mapa debe:
   - ✅ Mostrarse con estilo oscuro ("Dark Matter")
   - ✅ Tener marcadores personalizados
   - ✅ Mostrar tooltips al hacer hover sobre marcadores
   - ✅ Permitir zoom y pan
   - ✅ Centrarse en las ubicaciones correctas

---

## 📝 Checklist de Testing

Usa este checklist para asegurarte de probar todo:

- [ ] **Región - Geolocalización básica funciona**
- [ ] **Región - Mapa se muestra correctamente**
- [ ] **Zona - Geolocalización con diferentes formatos**
- [ ] **Zona - Mapa muestra múltiples equipos**
- [ ] **Equipo - Geolocalización funciona**
- [ ] **Equipo - Mapa se muestra correctamente**
- [ ] **Direcciones internacionales funcionan**
- [ ] **Manejo de errores (dirección no encontrada)**
- [ ] **Botón deshabilitado cuando no hay datos**
- [ ] **Coordenadas manuales funcionan**
- [ ] **No hay errores en consola**
- [ ] **Peticiones a API funcionan correctamente**
- [ ] **Mapa tiene estilo oscuro**
- [ ] **Marcadores son interactivos**

---

## 🐛 Problemas Conocidos y Soluciones

### **Problema: "El botón no hace nada"**
- **Causa:** Falta conexión a internet o bloqueo de CORS
- **Solución:** Verificar conexión y que OpenStreetMap Nominatim esté accesible

### **Problema: "Las coordenadas no se llenan"**
- **Causa:** La dirección no se encontró en OpenStreetMap
- **Solución:** Intentar con una dirección más específica o conocida

### **Problema: "El mapa no se muestra"**
- **Causa:** Las dependencias de leaflet no están instaladas
- **Solución:** Ejecutar `npm install leaflet react-leaflet @types/leaflet`

### **Problema: "Error de CORS"**
- **Causa:** OpenStreetMap puede tener límites de rate
- **Solución:** Esperar unos segundos y reintentar

---

## ✅ Criterios de Aceptación

El testing se considera **EXITOSO** si:

1. ✅ La geolocalización automática funciona en los 3 niveles (Región, Zona, Equipo)
2. ✅ El mapa se muestra correctamente cuando hay coordenadas
3. ✅ No hay errores críticos en la consola
4. ✅ Los casos límite se manejan correctamente (sin crashes)
5. ✅ Las coordenadas manuales también funcionan

---

## 📸 Evidencia de Testing

**Recomendación:** Tomar screenshots de:
- El formulario con coordenadas calculadas
- El mapa mostrando las ubicaciones
- La consola sin errores

---

**Nota:** Esta funcionalidad usa la API pública de OpenStreetMap Nominatim, que tiene límites de uso. Para producción, considera implementar un servicio proxy o usar una API comercial si el volumen es alto.









