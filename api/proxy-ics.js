export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Paramètre url manquant' })
  }

  const httpUrl = url.replace(/^webcal:\/\//i, 'https://')

  try {
    const response = await fetch(httpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RevisionFlow/1.0; +https://revisionflow.vercel.app)',
        Accept: 'text/calendar, application/ics, */*',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return res.status(502).json({
        error: `Le serveur de calendrier a répondu ${response.status}. Vérifiez que le lien est correct.`,
      })
    }

    const text = await response.text()

    if (!text.includes('BEGIN:VCALENDAR')) {
      return res.status(502).json({
        error: 'Le lien ne pointe pas vers un fichier calendrier ICS valide.',
      })
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).send(text)
  } catch (e) {
    return res.status(500).json({
      error: `Impossible de joindre le serveur : ${e.message}`,
    })
  }
}
