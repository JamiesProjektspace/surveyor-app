import { MapContainer, TileLayer, Marker, Polygon, Polyline, LayersControl, Tooltip, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ClickHandler, FlyToPoint, MapRefSetter } from './MapHelpers'

// Fix for default marker icons not showing in Vite/bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Se skelApi.js for forklaring — tom lokalt (bruger Vites proxy), sat i .env.production ved deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export default function MapView({
  points,
  onMapClick,
  onRemoveLastPoint,
  onUpdatePoint,
  onAddPoint,
  flyToTarget,
  onMapReady,
  skelPoints,
  skelLines,
}) {
  const polygonPositions = points.map((p) => [p.lat, p.lng])

  return (
    <div className="map-wrapper">
      <MapContainer center={[55.6761, 12.5683]} zoom={15} style={{ height: '500px', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Gader">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Ortofoto">
            <TileLayer
              url={`${API_BASE_URL}/api/ortofoto?z={z}&x={x}&y={y}`}
              attribution='&copy; SDFI / GeoDanmark'
              maxZoom={21}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terræn">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ClickHandler onMapClick={onMapClick} onReset={onRemoveLastPoint} />
        <FlyToPoint target={flyToTarget} />
        <MapRefSetter onMapReady={onMapReady} />

        {skelLines.map((line) => (
          <Polyline key={line.id} positions={line.positions} pathOptions={{ color: '#ff7f0e', weight: 3 }}>
            <Tooltip direction="top">
              <div>
                <strong>Skeltype:</strong> {line.skeltype || '–'}<br />
                <strong>Status:</strong> {line.status || '–'}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {skelPoints.map((sp) => (
          <CircleMarker
            key={sp.id}
            center={[sp.lat, sp.lng]}
            radius={5}
            pathOptions={{ color: '#d62728', fillColor: '#d62728', fillOpacity: 0.8 }}
            eventHandlers={{
              click: () => onAddPoint({ lat: sp.lat, lng: sp.lng, kilde: 'skelpunkt' }),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div>
                <strong>Punktklasse:</strong> {sp.punktKlasse || '–'}<br />
                <strong>Status:</strong> {sp.status || '–'}<br />
                <strong>Indlægningstype:</strong> {sp.indlaegningstype || '–'}<br />
                <em>Klik for at tilføje til listen</em>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {points.map((p, i) => (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            draggable={true}
            eventHandlers={{
              dragend: (e) => onUpdatePoint(i, e.target.getLatLng()),
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              P{i + 1}
            </Tooltip>
          </Marker>
        ))}

        {points.length > 2 && <Polygon positions={polygonPositions} />}
      </MapContainer>
    </div>
  )
}
