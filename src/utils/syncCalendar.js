import { parseICSFile, extractSubjectName, detecterTypeCours } from './icsParser'
import { getMatieres, getCours, saveCours } from './storage'

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function normaliser(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Proxies CORS utilisés en fallback si le fetch direct échoue
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

async function fetchAvecTimeout(url, timeoutMs = 12000) {
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

  // Tentative directe
  try {
    const res = await fetchAvecTimeout(httpUrl)
    if (res.ok) {
      const texte = await res.text()
      if (texte.includes('BEGIN:VCALENDAR')) return texte
    }
  } catch (_) {
    // Probablement une erreur CORS — on essaie les proxies
  }

  // Tentatives via proxies CORS
  for (const proxyFn of CORS_PROXIES) {
    try {
      const res = await fetchAvecTimeout(proxyFn(httpUrl), 15000)
      if (res.ok) {
        const texte = await res.text()
        if (texte.includes('BEGIN:VCALENDAR')) return texte
      }
    } catch (_) {
      continue
    }
  }

  throw new Error(
    'Impossible de récupérer le calendrier. Vérifiez le lien, ou que votre emploi du temps est bien public (non protégé par mot de passe).'
  )
}

/**
 * Synchronise les cours depuis une URL ICS (Hyperplanning, etc.).
 * Tous les événements du calendrier sont traités comme des créneaux (cours/TD/TP)
 * puisqu'il s'agit d'un emploi du temps.
 * Les cours précédemment synchronisés depuis une URL sont remplacés.
 */
export async function syncCalendarFromUrl(url) {
  const texte = await fetchICS(url)
  const rawEvents = parseICSFile(texte)
  const matieres = getMatieres()

  const nouveauxCours = rawEvents.map((e) => {
    const titreBrut = e.titreBrut || e.titre
    const nomExtrait = extractSubjectName(titreBrut)
    const normExtrait = normaliser(nomExtrait)

    const match = matieres.find((m) => {
      const normNom = normaliser(m.nom)
      return normNom === normExtrait || normNom.includes(normExtrait) || normExtrait.includes(normNom)
    })

    return {
      id: genId(),
      titre: nomExtrait,
      titreBrut,
      matiereId: match ? match.id : null,
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
