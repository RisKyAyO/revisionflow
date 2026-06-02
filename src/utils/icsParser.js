import ICAL from 'ical.js'

const MOTS_EXAMEN = [
  'examen', 'exam', 'partiel', 'final', 'contrôle', 'controle',
  'évaluation', 'evaluation', 'assessment', ' ds ', 'ds:', ' cc ', 'cc:',
  'écrit', 'écrite', 'rattrapage', 'oral ', 'soutenance',
]

const MOTS_DEVOIR = [
  'devoir', 'dm ', 'dm:', ' tp ', 'tp:', 'projet', 'rendu',
  'rapport', 'dossier', 'exposé', 'expose', 'quiz',
]

const MOTS_COURS = [
  'cours', ' cm ', 'cm:', ' td ', 'td:', 'amphi', 'amphithéâtre',
  'séance', 'seance', 'travaux dirigés', 'travaux pratiques', 'lecture',
]

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function detectEventType(titre, description) {
  const texte = (' ' + (titre || '') + ' ' + (description || '') + ' ').toLowerCase()
  for (const mot of MOTS_EXAMEN) {
    if (texte.includes(mot)) return 'examen'
  }
  for (const mot of MOTS_DEVOIR) {
    if (texte.includes(mot)) return 'devoir'
  }
  for (const mot of MOTS_COURS) {
    if (texte.includes(mot)) return 'cours'
  }
  return 'autre'
}

export function parseICSFile(texte) {
  const donneesParsees = ICAL.parse(texte)
  const composant = new ICAL.Component(donneesParsees)
  const vevents = composant.getAllSubcomponents('vevent')

  const evenements = []

  for (const vevent of vevents) {
    try {
      const evt = new ICAL.Event(vevent)

      const titre = evt.summary || 'Sans titre'
      const description = evt.description || ''
      const lieu = evt.location || ''
      const uid = evt.uid || genId()

      if (!evt.startDate) continue

      const dateDebut = evt.startDate.toJSDate()
      const dateFin = evt.endDate
        ? evt.endDate.toJSDate()
        : new Date(dateDebut.getTime() + 60 * 60 * 1000)

      evenements.push({
        id: uid,
        titre: titre.replace(/\\n/g, ' ').trim(),
        debut: dateDebut.toISOString(),
        fin: dateFin.toISOString(),
        description: description.replace(/\\n/g, '\n').trim(),
        lieu: lieu.trim(),
        type: detectEventType(titre, description),
        inclus: true,
        matiereId: null,
      })
    } catch (e) {
      continue
    }
  }

  return evenements.sort((a, b) => new Date(a.debut) - new Date(b.debut))
}

export function associerMatieres(evenements, matieres) {
  return evenements.map((evt) => {
    const titreLower = evt.titre.toLowerCase()
    const matiereMatch = matieres.find((m) => {
      const nomLower = m.nom.toLowerCase()
      const premierMot = nomLower.split(' ')[0]
      return titreLower.includes(nomLower) || (premierMot.length > 3 && titreLower.includes(premierMot))
    })
    return { ...evt, matiereId: matiereMatch ? matiereMatch.id : null }
  })
}
