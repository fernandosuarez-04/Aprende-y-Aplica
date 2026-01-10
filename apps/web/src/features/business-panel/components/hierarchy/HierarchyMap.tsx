import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix for default Leaflet icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'

/* eslint-disable no-underscore-dangle */
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
})

// Custom Gold Icon for Top Performer
const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  isTopPerformer?: boolean
  stats?: {
    value: string | number
    label: string
  }
}

interface HierarchyMapProps {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function HierarchyMap({ points, center = [23.6345, -102.5528], zoom = 5 }: HierarchyMapProps) {
  // Calculate center if points exist
  const derivedCenter: [number, number] = points.length > 0 
    ? [points.reduce((acc, p) => acc + p.lat, 0) / points.length, points.reduce((acc, p) => acc + p.lng, 0) / points.length]
    : center

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
      <MapContainer 
        center={derivedCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <ChangeView center={derivedCenter} zoom={zoom} />
        
        {/* Dark Matter Layer for stylish look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {points.map((point) => (
          <Marker 
            key={point.id} 
            position={[point.lat, point.lng]}
            icon={point.isTopPerformer ? goldIcon : defaultIcon}
            zIndexOffset={point.isTopPerformer ? 1000 : 0}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-gray-900 mb-1">{point.name}</h3>
                {point.isTopPerformer && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full inline-block font-bold mb-2 border border-yellow-200">
                    🏆 Mejor Desempeño
                  </div>
                )}
                {point.stats && (
                  <p className="text-gray-600 text-sm">
                    {point.stats.label}: <strong>{point.stats.value}</strong>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
