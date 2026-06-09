import { parseICSFile, extractSubjectName, detecterTypeCours } from './icsParser'
import { getMatieres, getCours, saveCours, getMappingCours } from './storage'

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function normaliser(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

async function fetchAvecTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

async function fetchICS(url) {
  const httpUrl = url.replace(/^webcal:\/\//i, 'https://')

  // 1. Proxy Vercel côté serveur (pas de CORS, pas de blocage)
  try {
    const proxyUrl = `/api/proxy-ics?url=${encodeURIComponent(httpUrl)}`
    const res = await fetchAvecTimeout(proxyUrl)
    if (res.ok) {
      const texte = await res.text()
      if (texte.includes('BEGIN:VCALENDAR')) return texte
      // Le proxy a retourné une erreur JSON
      try {
        const json = JSON.parse(texte)
        if (json.error) throw new Error(json.error)
      } catch (_) {}
    } else {
      // Lire le message d'erreur du proxy
      try {
        const json = await res.json()
        if (json.error) throw new Error(json.error)
      } catch (_) {}
    }
  } catch (e) {
    // Si l'erreur vient du proxy (message métier), on la remonte directement
    if (e.message && !e.message.includes('fetch') && !e.message.includes('abort')) {
      throw e
    }
    // Sinon (proxy Vercel indisponible en dev local), on continue
  }

  // 2. Fetch direct (marche si pas de CORS, ex: dev local avec serveur permissif)
  try {
    const res = await fetchAvecTimeout(httpUrl)
    if (res.ok) {
      const texte = await res.text()
      if (texte.includes('BEGIN:VCALENDAR')) return texte
    }
  } catch (_) {}

  throw new Error(
    'Impossible de récupérer le calendrier. Vérifiez que le lien est correct et que votre emploi du temps est bien exportable.'
  )
}

/**
 * Synchronise les cours depuis une URL ICS (Hyperplanning, etc.).
 * Tous les événements sont traités comme des créneaux de l'emploi du temps.
 * Les cours précédemment synchronisés sont remplacés.
 */
export async function syncCalendarFromUrl(url) {
  const texte = await fetchICS(url)
  const rawEvents = parseICSFile(texte)
  const matieres = getMatieres()
  const mapping  = getMappingCours()   // associations manuelles sauvegardées

  // Lecture robuste du mapping (compat ancienne structure string)
  function lireEntree(key) {
    const val = mapping[key]
    if (!val) return { matiereId: null, categorie: null }
    if (typeof val === 'string') return { matiereId: val, categorie: null }
    return { matiereId: val.matiereId || null, categorie: val.categorie || null }
  }

  const nouveauxCours = rawEvents.map((e) => {
    const titreBrut   = e.titreBrut || e.titre
    const nomExtrait  = extractSubjectName(titreBrut)
    const normExtrait = normaliser(nomExtrait)

    // 1. Association manuelle sauvegardée (priorité absolue)
    const entree = lireEntree(normExtrait) || lireEntree(normaliser(titreBrut))
    let matiereId = entree.matiereId
    let categorie = entree.categorie

    // 2. Correspondance automatique par nom (si pas d'entrée manuelle)
    if (!matiereId && !categorie) {
      const match = matieres.find((m) => {
        const normNom = normaliser(m.nom)
        return normNom === normExtrait || normNom.includes(normExtrait) || normExtrait.includes(normNom)
      })
      if (match) matiereId = match.id
    }

    return {
      id: genId(),
      titre: nomExtrait,
      titreBrut,
      matiereId,
      categorie,
      type: detecterTypeCours(titreBrut),
      debut: e.debut,
      fin: e.fin,
      salle: e.lieu || '',
      uid: e.id,
      fromSync: true,
    }
  })

  // Conserver les cours importés manuellement, remplacer uniquement les cours synchronisés
  const coursExistants = getCours().filter((c) => !c.fromSync)
  saveCours([...coursExistants, ...nouveauxCours])

  return nouveauxCours.length
}
