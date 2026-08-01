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

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(query)
        setSuggestions(results)
      } catch (err) {
        setError(err.message)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
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