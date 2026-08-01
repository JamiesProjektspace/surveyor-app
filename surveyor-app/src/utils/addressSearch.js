// DAWA (Danmarks Adressers Web API) — gratis, offentlig adressesøgning, ingen nøgle påkrævet.
// Se https://dawadocs.dataforsyningen.dk/dok/api/adresse

// Henter forslag mens brugeren skriver (autocomplete)
export async function searchAddresses(query) {
  if (!query || query.trim().length < 2) return []

  const res = await fetch(
    `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=8`
  )
  if (!res.ok) throw new Error(`Adressesøgning fejlede (${res.status})`)

  const data = await res.json()
  return data.map((item) => ({
    id: item.adresse?.id || item.id,
    tekst: item.tekst,
  }))
}

// Henter koordinater for en valgt adresse ud fra dens id
export async function getAddressCoordinates(id) {
  const res = await fetch(`https://api.dataforsyningen.dk/adresser/${id}`)
  if (!res.ok) throw new Error(`Kunne ikke hente adresse (${res.status})`)

  const data = await res.json()
  const [lng, lat] = data.adgangsadresse.adgangspunkt.koordinater // WGS84 som [lng, lat]
  return { lat, lng, tekst: data.adressebetegnelse }
}