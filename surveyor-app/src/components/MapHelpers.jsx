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