import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, LayersControl, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix for default marker icons not showing in Vite/bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const EARTH_RADIUS = 6371000 // meters

// Convert lat/lng points to local flat X,Y meters relative to the first point
function toLocalMeters(points) {
  if (points.length === 0) return []
  const originLat = (points[0].lat * Math.PI) / 180

  return points.map((p) => {
    const dLat = ((p.lat - points[0].lat) * Math.PI) / 180
    const dLng = ((p.lng - points[0].lng) * Math.PI) / 180
    const x = dLng * Math.cos(originLat) * EARTH_RADIUS
    const y = dLat * EARTH_RADIUS
    return { x, y }
  })
}

// Shoelace formula for polygon area (in square meters)
function calculateArea(localPoints) {
  if (localPoints.length < 3) return 0
  let sum = 0
  for (let i = 0; i < localPoints.length; i++) {
    const j = (i + 1) % localPoints.length
    sum += localPoints[i].x * localPoints[j].y
    sum -= localPoints[j].x * localPoints[i].y
  }
  return Math.abs(sum / 2)
}

// Perimeter: sum of distances between consecutive points (closing the loop)
function calculatePerimeter(localPoints) {
  if (localPoints.length < 2) return 0
  let total = 0
  for (let i = 0; i < localPoints.length; i++) {
    const j = (i + 1) % localPoints.length
    const dx = localPoints[j].x - localPoints[i].x
    const dy = localPoints[j].y - localPoints[i].y
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total
}

// This component listens for map clicks and reports them up to App
function ClickHandler({ onMapClick, onReset }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
    contextmenu(e) {
      onReset()
    },
  })
  return null
}

function App() {
  const [points, setPoints] = useState([])

  const addPoint = (latlng) => {
    setPoints([...points, { lat: latlng.lat, lng: latlng.lng }])
  }

  const removePoint = (index) => {
    setPoints(points.filter((_, i) => i !== index))
  }

  const updatePoint = (index, latlng) => {
    setPoints(points.map((p, i) => (i === index ? { lat: latlng.lat, lng: latlng.lng } : p)))
  }

  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  // Convert points to the [lat, lng] pairs Leaflet expects
  const polygonPositions = points.map((p) => [p.lat, p.lng])

  const localPoints = toLocalMeters(points)
  const area = calculateArea(localPoints)
  const perimeter = points.length > 2 ? calculatePerimeter(localPoints) : 0

  return (
    <div className="app">
      <h1>Land Survey Calculator</h1>
      <p>Click on the map to place survey points. Drag existing points to adjust them. Right-click to remove the last point.</p>

      <div className="map-wrapper">
        <MapContainer center={[55.6761, 12.5683]} zoom={15} style={{ height: '500px', width: '100%' }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Streets">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickHandler onMapClick={addPoint} onReset={removeLastPoint} />
          {points.map((p, i) => (
            <Marker
              key={i}
              position={[p.lat, p.lng]}
              draggable={true}
              eventHandlers={{
                dragend: (e) => updatePoint(i, e.target.getLatLng()),
              }}
            />
          ))}
          {points.length > 2 && <Polygon positions={polygonPositions} />}
        </MapContainer>
      </div>

      {points.length > 2 && (
        <div className="results">
          <p><strong>Area:</strong> {area.toFixed(2)} m² ({(area / 10000).toFixed(4)} hectares)</p>
          <p><strong>Perimeter:</strong> {perimeter.toFixed(2)} m</p>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{p.lat.toFixed(6)}</td>
              <td>{p.lng.toFixed(6)}</td>
              <td>
                <button onClick={() => removePoint(i)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App