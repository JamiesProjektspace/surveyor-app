import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

// Lytter efter klik og højreklik på kortet, og rapporterer dem videre til App
export function ClickHandler({ onMapClick, onReset }) {
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

// Panorerer/zoomer kortet til et givet lat/lng, når det ændrer sig (bruges ved manuel indtastning og adressesøgning)
export function FlyToPoint({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom ?? map.getZoom())
    }
  }, [target, map])
  return null
}

// Fanger Leaflet map-instansen, så vi kan læse dens aktuelle bounds uden for MapContainer
export function MapRefSetter({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])
  return null
}

// Leaflet måler sin egen beholders størrelse, når kortet FØRST tegnes — sker det, mens
// et flex/grid-layout endnu ikke har "sat sig" (fx mens skrifttyper stadig indlæses),
// kan Leaflet "fastfryse" sig selv til en forkert (ofte for smal) bredde. Denne komponent
// beder eksplicit Leaflet om at genmåle: én gang lige efter kortet er klar, og løbende
// fremover, hver gang selve beholderen ændrer størrelse (fx ved at vinduet resizes).
export function MapResizeHandler() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()

    const container = map.getContainer()
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [map])
  return null
}