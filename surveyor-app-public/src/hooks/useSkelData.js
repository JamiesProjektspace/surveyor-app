import { useState } from 'react'
import { fetchSkelpunkter as fetchSkelpunkterData, fetchMatrikelskel as fetchMatrikelskelData } from '../utils/skelApi'

// Samler al tilstand og logik for at hente skelpunkter og skellinjer fra Dataforsyningen.
// App.jsx behøver dermed kun ét kald til denne hook, i stedet for otte separate useState-kald
// og to store fetch-funktioner direkte i komponenten.
export function useSkelData(mapInstance) {
  const [skelPoints, setSkelPoints] = useState([])
  const [skelPointsLoading, setSkelPointsLoading] = useState(false)
  const [skelPointsError, setSkelPointsError] = useState(null)
  const [skelPointsLimitReached, setSkelPointsLimitReached] = useState(false)

  const [skelLines, setSkelLines] = useState([])
  const [skelLinesLoading, setSkelLinesLoading] = useState(false)
  const [skelLinesError, setSkelLinesError] = useState(null)
  const [skelLinesLimitReached, setSkelLinesLimitReached] = useState(false)

  // Henter skelpunkter fra Dataforsyningen for det kortudsnit, brugeren ser lige nu
  const fetchSkelpunkter = async () => {
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
  const fetchMatrikelskel = async () => {
    if (!mapInstance) return
    setSkelLinesLoading(true)
    setSkelLinesError(null)
    setSkelLines([])
    setSkelLinesLimitReached(false)
    try {
      const { lines: fetchedLines, limitReached } = await fetchMatrikelskelData(mapInstance.getBounds())
      setSkelLines(fetchedLines)
      setSkelLinesLimitReached(limitReached)
    } catch (err) {
      setSkelLinesError(err.message)
    } finally {
      setSkelLinesLoading(false)
    }
  }

  return {
    skelPoints,
    skelPointsLoading,
    skelPointsError,
    skelPointsLimitReached,
    fetchSkelpunkter,
    skelLines,
    skelLinesLoading,
    skelLinesError,
    skelLinesLimitReached,
    fetchMatrikelskel,
  }
}