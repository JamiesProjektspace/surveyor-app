import { useState, useEffect, useRef } from 'react'
import { searchAddresses, getAddressCoordinates } from '../utils/addressSearch'

export default function AddressSearch({ onLocationFound }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    // "ignore" beskytter mod race conditions: hvis brugeren skriver videre og et nyt
    // debounce-kald starter, før et tidligere (langsommere) kald er landet, må det
    // gamle kald ikke overskrive resultaterne fra det nye, når det til sidst svarer.
    let ignore = false

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(query)
        if (!ignore) {
          setSuggestions(results)
          setError(null)
        }
      } catch (err) {
        if (!ignore) setError(err.message)
      }
    }, 300)

    return () => {
      ignore = true
      clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = async (suggestion) => {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setQuery(suggestion.tekst)
    try {
      const { lat, lng } = await getAddressCoordinates(suggestion.id)
      onLocationFound({ lat, lng, zoom: 18 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="address-search">
      <label>
        Adresse:{' '}
        <input
          type="text"
          placeholder="Søg efter en adresse..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {loading && <span className="address-search-status">Flyver dertil…</span>}
      {error && <p className="warning">⚠️ {error}</p>}
      {suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((s) => (
            <li key={s.id} onClick={() => handleSelect(s)}>
              {s.tekst}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}