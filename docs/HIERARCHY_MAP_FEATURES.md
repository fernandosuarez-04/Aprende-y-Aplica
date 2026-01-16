# Funcionalidades del Mapa de Jerarquía

## 📍 Funcionalidades Actuales

### Funciones Básicas Implementadas

1. **Zoom con Botones (+/-)**
   - ✅ Controles de zoom por defecto de Leaflet
   - Ubicación: Esquina superior izquierda del mapa
   - Funcionalidad: Acercar y alejar con botones + y -

2. **Desplazamiento (Pan)**
   - ✅ Arrastrar el mapa para mover la vista
   - Funcionalidad: Click y arrastrar con el mouse

3. **Marcadores Interactivos**
   - ✅ Marcadores azules para equipos/zonas estándar
   - ✅ Marcadores dorados para Top Performers
   - ✅ Popups informativos al hacer click en marcadores
   - ✅ Información mostrada en popups:
     - Nombre de la entidad
     - Badge de "Top Performer" si aplica
     - Estadísticas (valor y etiqueta)

4. **Cálculo Automático del Centro**
   - ✅ El mapa se centra automáticamente en el promedio de las coordenadas de los puntos
   - ✅ Si no hay puntos, usa un centro por defecto (México)

5. **Zoom con Rueda del Mouse** (Toggle) 🆕
   - ✅ Checkbox en la esquina inferior derecha para habilitar/deshabilitar
   - ✅ Por defecto deshabilitado para evitar zoom accidental
   - ✅ El usuario puede activarlo cuando lo necesite

6. **Control de Escala** 🆕
   - ✅ Muestra la escala del mapa en metros/kilómetros
   - ✅ Ubicación: Esquina inferior izquierda
   - ✅ Útil para entender distancias reales

7. **Control de Pantalla Completa** 🆕
   - ✅ Botón en la esquina superior derecha
   - ✅ Permite ver el mapa en pantalla completa
   - ✅ Ajusta automáticamente el tamaño del mapa al entrar/salir

8. **Tema Oscuro "Dark Matter"**
   - ✅ Estilo de mapa oscuro de CARTO
   - ✅ Compatible con el tema oscuro de la aplicación

### Limitaciones Actuales

1. **Controles Adicionales**
   - ❌ No hay selector de capas base
   - ❌ No hay geocodificador/búsqueda de ubicaciones
   - ❌ No hay herramienta de medición de distancias

---

## 🚀 Funcionalidades Adicionales Disponibles en Leaflet

### Controles que se Pueden Agregar

#### 1. **ScaleControl** (Control de Escala)
```typescript
import { ScaleControl } from 'react-leaflet'

<ScaleControl 
  imperial={false}  // Solo métrico
  position="bottomleft"
/>
```
- Muestra la escala del mapa en metros/kilómetros
- Útil para entender distancias reales

#### 2. **FullscreenControl** (Pantalla Completa)
```typescript
import { FullscreenControl } from 'react-leaflet'
// Requiere: npm install react-leaflet-fullscreen

<FullscreenControl position="topright" />
```
- Permite ver el mapa en pantalla completa
- Mejora la experiencia de visualización

#### 3. **LayersControl** (Selector de Capas)
```typescript
import { LayersControl } from 'react-leaflet'

<LayersControl position="topright">
  <LayersControl.BaseLayer checked name="Dark Matter">
    <TileLayer url="..." />
  </LayersControl.BaseLayer>
  <LayersControl.BaseLayer name="Satellite">
    <TileLayer url="..." />
  </LayersControl.BaseLayer>
</LayersControl>
```
- Permite cambiar entre diferentes estilos de mapa
- Opciones: Dark Matter, Satelital, Callejero, etc.

#### 4. **Geocoder** (Búsqueda de Ubicaciones)
```typescript
import { Geocoder } from 'react-leaflet-geosearch'
// Requiere: npm install react-leaflet-geosearch

<Geocoder 
  position="topleft"
  placeholder="Buscar ubicación..."
/>
```
- Buscar lugares por nombre o dirección
- Centrar el mapa en la ubicación encontrada

#### 5. **Medición de Distancias**
```typescript
// Requiere plugin adicional: leaflet-measure
import 'leaflet-measure'
```
- Medir distancias entre puntos
- Medir áreas de polígonos
- Útil para análisis de cobertura

#### 6. **ZoomControl Personalizado**
```typescript
// Ya está incluido por defecto, pero se puede personalizar
<ZoomControl 
  position="topleft"
  zoomInText="+"
  zoomOutText="-"
/>
```

#### 7. **AttributionControl** (Atribución)
```typescript
// Ya está incluido por defecto, pero se puede personalizar
<AttributionControl 
  position="bottomright"
  prefix=""
/>
```

### Funcionalidades Avanzadas

#### 8. **Clustering de Marcadores**
```typescript
import MarkerClusterGroup from 'react-leaflet-cluster'
// Requiere: npm install react-leaflet-cluster

<MarkerClusterGroup>
  {/* Marcadores */}
</MarkerClusterGroup>
```
- Agrupa marcadores cercanos cuando hay muchos puntos
- Mejora el rendimiento y la legibilidad

#### 9. **Dibujar Rutas/Polígonos**
```typescript
// Requiere: react-leaflet-draw
import { FeatureGroup } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
```
- Dibujar rutas entre puntos
- Dibujar áreas de cobertura
- Exportar coordenadas

#### 10. **Filtros de Marcadores**
- Filtrar marcadores por criterios (activos, inactivos, top performers)
- Mostrar/ocultar grupos de marcadores

#### 11. **Exportar Mapa como Imagen**
```typescript
import { toPng } from 'html-to-image'
```
- Capturar el mapa como imagen
- Útil para reportes y presentaciones

#### 12. **Vista de Satélite 3D**
- Integración con Mapbox o Google Maps para vista 3D
- Requiere APIs adicionales

---

## 📋 Recomendaciones de Implementación

### Prioridad Alta (Mejoras Inmediatas) ✅ COMPLETADO

1. ✅ **Habilitar Zoom con Rueda del Mouse** (Opcional)
   - ✅ Toggle implementado en la esquina inferior derecha
   - ✅ Por defecto deshabilitado, el usuario puede activarlo

2. ✅ **Control de Escala**
   - ✅ Implementado en la esquina inferior izquierda
   - ✅ Muestra escala en metros/kilómetros

3. ✅ **Control de Pantalla Completa**
   - ✅ Implementado en la esquina superior derecha
   - ✅ Usa la API nativa de Fullscreen del navegador

### Prioridad Media

4. **Selector de Capas Base**
   - Dark Matter (actual)
   - Satelital
   - Callejero
   - Terreno

5. **Geocodificador/Búsqueda**
   - Buscar ubicaciones por nombre
   - Útil para navegación rápida

6. **Clustering de Marcadores**
   - Necesario cuando hay muchos puntos (>20)
   - Mejora rendimiento y legibilidad

### Prioridad Baja

7. **Medición de Distancias**
   - Útil para análisis de cobertura
   - Requiere plugin adicional

8. **Dibujar Rutas/Áreas**
   - Funcionalidad avanzada
   - Requiere más desarrollo

9. **Exportar Mapa**
   - Útil para reportes
   - Implementación relativamente simple

---

## 🔧 Configuración Actual del Mapa

```typescript
<MapContainer 
  center={derivedCenter} 
  zoom={zoom} 
  style={{ height: '100%', width: '100%' }}
  scrollWheelZoom={false}  // ⚠️ Zoom con rueda deshabilitado
>
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  />
  <MapMarkers points={points} />
</MapContainer>
```

### Controles por Defecto de Leaflet

Leaflet incluye automáticamente estos controles (a menos que se deshabiliten):

- ✅ **ZoomControl**: Botones + y - (esquina superior izquierda)
- ✅ **AttributionControl**: Atribución de mapas (esquina inferior derecha)

### Controles que NO están Habilitados

- ❌ **ScaleControl**: Control de escala
- ❌ **FullscreenControl**: Pantalla completa
- ❌ **LayersControl**: Selector de capas

---

## 📦 Dependencias Necesarias para Nuevas Funcionalidades

```json
{
  "react-leaflet-fullscreen": "^2.0.0",  // Pantalla completa
  "react-leaflet-geosearch": "^3.0.0",  // Búsqueda de ubicaciones
  "react-leaflet-cluster": "^2.0.0",    // Clustering
  "react-leaflet-draw": "^0.20.4",      // Dibujar rutas/áreas
  "leaflet-measure": "^3.1.0"           // Medición de distancias
}
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Implementar Control de Escala** (5 minutos)
   - Agregar `<ScaleControl />` al componente
   - Sin dependencias adicionales

2. **Habilitar Zoom con Rueda** (Opcional) (2 minutos)
   - Cambiar `scrollWheelZoom={false}` a `scrollWheelZoom={true}`
   - O agregar toggle para habilitar/deshabilitar

3. **Agregar Control de Pantalla Completa** (15 minutos)
   - Instalar dependencia
   - Agregar componente al mapa

4. **Implementar Selector de Capas** (30 minutos)
   - Agregar diferentes estilos de mapa
   - Implementar `LayersControl`

---

## 📝 Notas Técnicas

- El mapa usa **React Leaflet** v4.x
- El estilo base es **CARTO Dark Matter**
- Los marcadores son personalizados (azul/dorado)
- El componente es **SSR-safe** (carga dinámica)
- El zoom con rueda está **deshabilitado** para evitar conflictos con scroll de página

---

*Última actualización: Enero 2025*

