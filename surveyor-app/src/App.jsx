import { useState } from 'react'
import './App.css'
import MapView from './components/MapView'
import CoordinateSystemSelector from './components/CoordinateSystemSelector'
import ManualPointInput from './components/ManualPointInput'
import SkelpunktControls from './components/SkelpunktControls'
import PointsTable from './components/PointsTable'
import { toLocalMeters, calculateArea, calculatePerimeter, fromManualInput } from './utils/coordinates'
import { fetchSkelData } from './utils/skelApi'

function App() {
  const [points, setPoints] = useState([])
  const [coordSystem, setCoordSystem] = useState('dktm3') // Standard er DKTM3
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [skelPoints, setSkelPoints] = useState([])
  const [skelLines, setSkelLines] = useState([])
  const [skelLoading, setSkelLoading] = useState(false)
  const [skelError, setSkelError] = useState(null)
  const [skelLimitReached, setSkelLimitReached] = useState(false)

  const addPoint = (latlng) => {
    setPoints([...points, { lat: latlng.lat, lng: latlng.lng }])
  }

  const addManualPoint = () => {
    const a = parseFloat(inputA)
    const b = parseFloat(inputB)
    if (isNaN(a) || isNaN(b)) return

    const newPoint = fromManualInput(a, b, coordSystem)
    if (!newPoint) return

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

  // Henter skelpunkter og matrikelskel fra Dataforsyningen for det kortudsnit, brugeren ser lige nu
  const fetchSkelpunkter = async () => {
    if (!mapInstance) return
    setSkelLoading(true)
    setSkelError(null)
    setSkelPoints([]) // Ryd gamle skelpunkter med det samme, så de ikke bliver stående mens vi henter nye
    setSkelLines([])
    setSkelLimitReached(false)
    try {
      const { points: fetchedPoints, lines: fetchedLines, limitReached } = await fetchSkelData(mapInstance.getBounds())
      setSkelPoints(fetchedPoints)
      setSkelLines(fetchedLines)
      setSkelLimitReached(limitReached)
    } catch (err) {
      setSkelError(err.message)
    } finally {
      setSkelLoading(false)
    }
  }

  const localPoints = toLocalMeters(points)
  const area = calculateArea(localPoints)
  const perimeter = points.length > 2 ? calculatePerimeter(localPoints) : 0

  return (
    <div className="app">
      <h1>Landmålerberegner</h1>
      <p>Klik på kortet for at placere målepunkter. Træk eksisterende punkter for at justere dem. Højreklik for at fjerne det sidste punkt.</p>

      <CoordinateSystemSelector coordSystem={coordSystem} onChange={setCoordSystem} />

      <ManualPointInput
        coordSystem={coordSystem}
        inputA={inputA}
        inputB={inputB}
        onChangeA={setInputA}
        onChangeB={setInputB}
        onAdd={addManualPoint}
      />

      <SkelpunktControls
        onFetch={fetchSkelpunkter}
        loading={skelLoading}
        pointCount={skelPoints.length}
        lineCount={skelLines.length}
        limitReached={skelLimitReached}
        error={skelError}
      />

      <MapView
        points={points}
        onMapClick={addPoint}
        onRemoveLastPoint={removeLastPoint}
        onUpdatePoint={updatePoint}
        onAddPoint={addPoint}
        flyToTarget={flyToTarget}
        onMapReady={setMapInstance}
        skelPoints={skelPoints}
        skelLines={skelLines}
      />

      {points.length > 2 && (
        <div className="results">
          <p><strong>Areal:</strong> {area.toFixed(2)} m² ({(area / 10000).toFixed(4)} hektar)</p>
          <p><strong>Omkreds:</strong> {perimeter.toFixed(2)} m</p>
        </div>
      )}

      <PointsTable points={points} coordSystem={coordSystem} onRemove={removePoint} />
    </div>
  )
}

export default App