import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, LayersControl, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import proj4 from 'proj4'
import 'leaflet/dist/leaflet.css'
import './App.css'

// ETRS89 / UTM zone 32N — standard projected coordinate system for Denmark
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')

// ETRS89 / DKTM3 — Danish national engineering/construction grid, zone 3 (Zealand & Lolland)
proj4.defs('EPSG:4095', '+proj=tmerc +lat_0=0 +lon_0=11.75 +k=0.99998 +x_0=600000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs')

// System 34 Sjælland (S34S) — APPROXIMATE reconstruction only.
// The official conversion uses a Danish grid-shift correction file (SDFI) that
// isn't supported by this browser library. This uses a generic historical datum
// shift instead, which can be off by several meters — NOT suitable for legal/cadastral use.
proj4.defs('S34S_APPROX', '+proj=tmerc +lat_0=0 +lon_0=10.37 +k=1 +x_0=-210327 +y_0=-6034310 +ellps=intl +towgs84=-89.5,-93.8,-123.1,0,0,0,0 +units=m +no_defs')

// Convert a WGS84 lat/lng point to UTM32N easting/northing
function toUTM32N(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat])
  return { easting, northing }
}

// Convert a WGS84 lat/lng point to DKTM3 easting/northing
function toDKTM3(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:4095', [lng, lat])
  return { easting, northing }
}

// Convert a WGS84 lat/lng point to S34S easting/northing (approximate)
function toS34SApprox(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'S34S_APPROX', [lng, lat])
  return { easting, northing }
}

// Inverse conversions: projected easting/northing back to WGS84 lat/lng
function fromUTM32N(easting, northing) {
  const [lng, lat] = proj4('EPSG:25832', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

function fromDKTM3(easting, northing) {
  const [lng, lat] = proj4('EPSG:4095', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

function fromS34SApprox(easting, northing) {
  const [lng, lat] = proj4('S34S_APPROX', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

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

// Pans/zooms the map to a given lat/lng whenever it changes (used for manually entered points)
function FlyToPoint({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], map.getZoom())
    }
  }, [target, map])
  return null
}

function App() {
  const [points, setPoints] = useState([])
  const [coordSystem, setCoordSystem] = useState('wgs84') // 'wgs84' or 'utm32n'
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [flyToTarget, setFlyToTarget] = useState(null)

  const addPoint = (latlng) => {
    setPoints([...points, { lat: latlng.lat, lng: latlng.lng }])
  }

  const addManualPoint = () => {
    const a = parseFloat(inputA)
    const b = parseFloat(inputB)
    if (isNaN(a) || isNaN(b)) return

    let newPoint
    if (coordSystem === 'wgs84') {
      if (a < -90 || a > 90 || b < -180 || b > 180) return
      newPoint = { lat: a, lng: b }
    } else if (coordSystem === 'utm32n') {
      newPoint = fromUTM32N(a, b)
    } else if (coordSystem === 'dktm3') {
      newPoint = fromDKTM3(a, b)
    } else if (coordSystem === 's34s') {
      newPoint = fromS34SApprox(a, b)
    }

    setPoints([...points, newPoint])
    setFlyToTarget(newPoint)
    setInputA('')
    setInputB('')
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

  // Labels og eksempel-placeholders for det manuelle inputfelt, afhængigt af valgt koordinatsystem
  const manualInputLabels = {
    wgs84: { labelA: 'Breddegrad', labelB: 'Længdegrad', placeholderA: 'f.eks. 55.6761', placeholderB: 'f.eks. 12.5683' },
    utm32n: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 725000', placeholderB: 'f.eks. 6175000' },
    dktm3: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 725000', placeholderB: 'f.eks. 6175000' },
    s34s: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 120000', placeholderB: 'f.eks. 60000' },
  }[coordSystem]

  return (
    <div className="app">
      <h1>Landmålerberegner</h1>
      <p>Klik på kortet for at placere målepunkter. Træk eksisterende punkter for at justere dem. Højreklik for at fjerne det sidste punkt.</p>

      <div className="coord-toggle">
        <label>
          Koordinatsystem:{' '}
          <select value={coordSystem} onChange={(e) => setCoordSystem(e.target.value)}>
            <option value="wgs84">WGS84 (Bredde-/Længdegrad)</option>
            <option value="utm32n">UTM Zone 32N (ETRS89)</option>
            <option value="dktm3">DKTM3 (ETRS89)</option>
            <option value="s34s">System 34 Sjælland (omtrentlig)</option>
          </select>
        </label>
        {coordSystem === 's34s' && (
          <p className="warning">
            ⚠️ Kun omtrentlig konvertering — ikke nøjagtig nok til juridisk eller matrikulær brug.
          </p>
        )}
      </div>

      <div className="manual-input">
        <label>
          {manualInputLabels.labelA}:{' '}
          <input
            type="number"
            step="any"
            placeholder={manualInputLabels.placeholderA}
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
          />
        </label>
        <label>
          {manualInputLabels.labelB}:{' '}
          <input
            type="number"
            step="any"
            placeholder={manualInputLabels.placeholderB}
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
          />
        </label>
        <button onClick={addManualPoint}>Tilføj punkt</button>
      </div>

      <div className="map-wrapper">
        <MapContainer center={[55.6761, 12.5683]} zoom={15} style={{ height: '500px', width: '100%' }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Gader">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellit">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terræn">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickHandler onMapClick={addPoint} onReset={removeLastPoint} />
          <FlyToPoint target={flyToTarget} />
          {points.map((p, i) => (
            <Marker
              key={i}
              position={[p.lat, p.lng]}
              draggable={true}
              eventHandlers={{
                dragend: (e) => updatePoint(i, e.target.getLatLng()),
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

      {points.length > 2 && (
        <div className="results">
          <p><strong>Areal:</strong> {area.toFixed(2)} m² ({(area / 10000).toFixed(4)} hektar)</p>
          <p><strong>Omkreds:</strong> {perimeter.toFixed(2)} m</p>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{coordSystem === 'wgs84' ? 'Breddegrad' : 'Øst (m)'}</th>
            <th>{coordSystem === 'wgs84' ? 'Længdegrad' : 'Nord (m)'}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => {
            let a, b
            if (coordSystem === 'wgs84') {
              a = p.lat.toFixed(6)
              b = p.lng.toFixed(6)
            } else if (coordSystem === 'utm32n') {
              const c = toUTM32N(p.lat, p.lng)
              a = c.easting.toFixed(4)
              b = c.northing.toFixed(4)
            } else if (coordSystem === 'dktm3') {
              const c = toDKTM3(p.lat, p.lng)
              a = c.easting.toFixed(4)
              b = c.northing.toFixed(4)
            } else if (coordSystem === 's34s') {
              const c = toS34SApprox(p.lat, p.lng)
              a = c.easting.toFixed(4)
              b = c.northing.toFixed(4)
            }
            return (
              <tr key={i}>
                <td>P{i + 1}</td>
                <td>{a}</td>
                <td>{b}</td>
                <td>
                  <button onClick={() => removePoint(i)}>Fjern</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default App