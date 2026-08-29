import { useState } from 'react'
import './App.css'
import MapView from './components/MapView'
import AddressSearch from './components/AddressSearch'
import CoordinateSystemSelector from './components/CoordinateSystemSelector'
import ManualPointInput from './components/ManualPointInput'
import DataFetchControl from './components/DataFetchControl'
import PointsTable from './components/PointsTable'
import InfoButton from './components/InfoButton'
import { toLocalMeters, calculateArea, calculatePerimeter, fromManualInput, toUTM32N } from './utils/coordinates'
import { fetchSkelpunkter as fetchSkelpunkterData, fetchMatrikelskel } from './utils/skelApi'

// Husk at opdatere denne, når der laves ændringer — se læremateriale/deployment-dokumenterne
// for retningslinjer: MAJOR.MINOR.PATCH (ny funktion = MINOR, rettelse/justering = PATCH)
const APP_VERSION = 'v0.18.1'

// Hvor tæt (i meter) et trukket punkt skal lande på et skelpunkt, for at det "snapper" til det
const SNAP_RADIUS_METERS = 2

// Faktisk afstand mellem to lat/lng-punkter i meter, via UTM32N (som allerede er i meter)
function distanceMeters(a, b) {
  const pa = toUTM32N(a.lat, a.lng)
  const pb = toUTM32N(b.lat, b.lng)
  const dx = pa.easting - pb.easting
  const dy = pa.northing - pb.northing
  return Math.sqrt(dx * dx + dy * dy)
}

function App() {
  const [points, setPoints] = useState([])
  const [coordSystem, setCoordSystem] = useState('dktm3') // Standard er DKTM3
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)

  const [skelPoints, setSkelPoints] = useState([])
  const [skelPointsLoading, setSkelPointsLoading] = useState(false)
  const [skelPointsError, setSkelPointsError] = useState(null)
  const [skelPointsLimitReached, setSkelPointsLimitReached] = useState(false)

  const [skelLines, setSkelLines] = useState([])
  const [skelLinesLoading, setSkelLinesLoading] = useState(false)
  const [skelLinesError, setSkelLinesError] = useState(null)
  const [skelLinesLimitReached, setSkelLinesLimitReached] = useState(false)

  // latlng kan enten være et almindeligt Leaflet-klik ({lat, lng}) eller et objekt
  // med en 'kilde'-markør (fx {lat, lng, kilde: 'skelpunkt'}) — den bevares, hvis den findes.
  const addPoint = (latlng) => {
    setPoints([
      ...points,
      { lat: latlng.lat, lng: latlng.lng, kilde: latlng.kilde || 'manuel', punktKlasse: latlng.punktKlasse },
    ])
  }

  const addManualPoint = () => {
    const a = parseFloat(inputA)
    const b = parseFloat(inputB)
    if (isNaN(a) || isNaN(b)) return

    const newPoint = fromManualInput(a, b, coordSystem)
    if (!newPoint) return

    setPoints([...points, { ...newPoint, kilde: 'manuel' }])
    setFlyToTarget(newPoint)
    setInputA('')
    setInputB('')
  }

  const removePoint = (index) => {
    setPoints(points.filter((_, i) => i !== index))
  }

  // Opdaterer et punkts koordinater ud fra manuelt indtastede a/b-værdier i tabellen
  // (samme princip som addManualPoint, men retter et eksisterende punkt i stedet for at tilføje et nyt)
  const updatePointCoordinates = (index, a, b) => {
    const parsedA = parseFloat(a)
    const parsedB = parseFloat(b)
    if (isNaN(parsedA) || isNaN(parsedB)) return

    const newCoords = fromManualInput(parsedA, parsedB, coordSystem)
    if (!newCoords) return

    setPoints(points.map((p, i) => (i === index ? { ...p, lat: newCoords.lat, lng: newCoords.lng } : p)))
  }

  const updatePoint = (index, latlng) => {
    const dropped = { lat: latlng.lat, lng: latlng.lng }

    // Find det nærmeste skelpunkt (hvis nogen er hentet) og se om det er tæt nok på til at snappe
    let nearest = null
    let nearestDist = Infinity
    for (const sp of skelPoints) {
      const d = distanceMeters(dropped, sp)
      if (d < nearestDist) {
        nearestDist = d
        nearest = sp
      }
    }
    const snapped = nearest && nearestDist <= SNAP_RADIUS_METERS

    setPoints(
      points.map((p, i) =>
        i === index
          ? {
              ...p,
              lat: snapped ? nearest.lat : dropped.lat,
              lng: snapped ? nearest.lng : dropped.lng,
              kilde: snapped ? 'skelpunkt' : 'manuel',
              punktKlasse: snapped ? nearest.punktKlasse : undefined,
            }
          : p
      )
    )
  }

  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  // Henter skelpunkter fra Dataforsyningen for det kortudsnit, brugeren ser lige nu
  const handleFetchSkelpunkter = async () => {
    if (!mapInstance) return
    setSkelPointsLoading(true)
    setSkelPointsError(null)
    setSkelPoints([])
    setSkelPointsLimitReached(false)
    try {
      const { points: fetchedPoints, limitReached } = await fetchSkelpunkterData(mapInstance.getBounds())
      setSkelPoints(fetchedPoints)
      setSkelPointsLimitReached(limitReached)
    } catch (err) {
      setSkelPointsError(err.message)
    } finally {
      setSkelPointsLoading(false)
    }
  }

  // Henter matrikelskel (skellinjer) fra Dataforsyningen for det kortudsnit, brugeren ser lige nu
  const handleFetchMatrikelskel = async () => {
    if (!mapInstance) return
    setSkelLinesLoading(true)
    setSkelLinesError(null)
    setSkelLines([])
    setSkelLinesLimitReached(false)
    try {
      const { lines: fetchedLines, limitReached } = await fetchMatrikelskel(mapInstance.getBounds())
      setSkelLines(fetchedLines)
      setSkelLinesLimitReached(limitReached)
    } catch (err) {
      setSkelLinesError(err.message)
    } finally {
      setSkelLinesLoading(false)
    }
  }

  const localPoints = toLocalMeters(points)
  const area = calculateArea(localPoints)
  const perimeter = points.length > 2 ? calculatePerimeter(localPoints) : 0

  return (
    <div className="app">
      <div style={{ fontSize: '12px', color: '#aaaaaa', textAlign: 'left' }}>{APP_VERSION}</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1 style={{ margin: 0 }}>Skelpunktsfinder</h1>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '100%',
              transform: 'translateY(-50%)',
              marginLeft: '6px',
            }}
          >
            <InfoButton text='Klik på kortet for at placere målepunkter. Træk eksisterende punkter for at justere dem. Brug knappen "Fortryd sidste punkt" (eller højreklik på computer) for at fjerne det seneste punkt. Klik på et skelpunkt for at tilføje det til listen.' />
          </div>
        </div>
      </div>

      <AddressSearch onLocationFound={setFlyToTarget} />

      <CoordinateSystemSelector coordSystem={coordSystem} onChange={setCoordSystem} />

      <ManualPointInput
        coordSystem={coordSystem}
        inputA={inputA}
        inputB={inputB}
        onChangeA={setInputA}
        onChangeB={setInputB}
        onAdd={addManualPoint}
      />

      <DataFetchControl
        label="Hent skelpunkter for kortudsnit"
        loadingLabel="Henter skelpunkter…"
        onFetch={handleFetchSkelpunkter}
        loading={skelPointsLoading}
        limitReached={skelPointsLimitReached}
        error={skelPointsError}
        infoText="Koordinaterne er Dataforsyningens officielt registrerede skelpunkter — brug koordinaterne til at lokalisere punktet i marken, men verificér selv, hvis nøjagtigheden er afgørende."
      />

      <DataFetchControl
        label="Hent skellinjer for kortudsnit"
        loadingLabel="Henter skellinjer…"
        onFetch={handleFetchMatrikelskel}
        loading={skelLinesLoading}
        limitReached={skelLinesLimitReached}
        error={skelLinesError}
      />

      {points.length > 0 && (
        <div className="undo-point-wrapper">
          <button onClick={removeLastPoint}>Fortryd sidste punkt</button>
        </div>
      )}

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

      <PointsTable points={points} coordSystem={coordSystem} onRemove={removePoint} onUpdateCoordinates={updatePointCoordinates} />
    </div>
  )
}

export default App