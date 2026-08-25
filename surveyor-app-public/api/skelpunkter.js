// Vercel serverless function. Modtager POST-kald fra appen, videresender til
// Dataforsyningens GraphQL-endpoint med API-nøglen tilføjet på serversiden —
// nøglen er derfor aldrig synlig i browseren.

export default async function handler(req, res) {
  // Tillad kald fra enhver origin (dataen er offentlig/åben, ingen grund til at låse det ned)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Kun POST er tilladt' })
    return
  }

  const apiKey = process.env.DATAFORDELER_APIKEY
  if (!apiKey) {
    res.status(500).json({ error: 'DATAFORDELER_APIKEY er ikke sat på serveren' })
    return
  }

  try {
    const upstreamRes = await fetch(`https://graphql.datafordeler.dk/MAT/v2?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await upstreamRes.json()
    res.status(upstreamRes.status).json(data)
  } catch (err) {
    res.status(502).json({ error: 'Kunne ikke kontakte Dataforsyningen', detail: err.message })
  }
}
