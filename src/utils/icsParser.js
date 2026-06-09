import ICAL from 'ical.js'
import { getMatieres, saveMatieres } from './storage'

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

const PALETTE_COULEURS = [
  '#6C63FF', '#FF6584', '#43C6AC', '#F7971E', '#12c2e9',
  '#f64f59', '#c471ed', '#667eea', '#11998e', '#fc5c7d',
]

const EMOJIS_MATIERES = [
  { mots: ['math', 'mathematiques'], emoji: '🔢' },
  { mots: ['physique'], emoji: '⚗️' },
  { mots: ['chimie'], emoji: '🧪' },
  { mots: ['info', 'algo', 'prog', 'informatique'], emoji: '💻' },
  { mots: ['histoire'], emoji: '📜' },
  { mots: ['geo', 'geographie'], emoji: '🌍' },
  { mots: ['anglais', 'english', 'langue'], emoji: '🌐' },
  { mots: ['francais'], emoji: '📝' },
  { mots: ['eco', 'gestion', 'economie'], emoji: '📊' },
  { mots: ['droit'], emoji: '⚖️' },
  { mots: ['bio', 'biologie'], emoji: '🧬' },
]

const PREFIXES_A_SUPPRIMER = [
  'cm', 'td', 'tp', 'ds', 'cc', 'ct', 'cours', 'seance', 'amphi',
  'conference', 'examen', 'quiz', 'devoir', 'controle', 'interrogation',
  'partiel', 'eval', 'evaluation', 'rendu', 'remise', 'rapport',
]

const MOTS_SUFFIXE_A_SUPPRIMER = [
  'groupe', 'salle', 'amphi', 'mme', 'mr', 'prof', 'semestre',
  's1', 's2', 's3', 'b1', 'b2', 'b3', 'est du',
]

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function normaliser(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
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

export function detecterTypeCours(titreBrut) {
  const n = normaliser(titreBrut)
  const tokens = n.split(/[\s\-:]+/)
  const first = tokens[0]
  if (first === 'cm') return 'CM'
  if (first === 'td') return 'TD'
  if (first === 'tp') return 'TP'
  if (n.includes('amphi') || n.includes('cours magistral')) return 'CM'
  if (n.includes('travaux diriges')) return 'TD'
  if (n.includes('travaux pratiques')) return 'TP'
  return 'autre'
}

export function extractSubjectName(rawTitle) {
  let titre = rawTitle.replace(/\\n/g, ' ').trim()

  if (titre.includes(':')) {
    const colonIdx = titre.indexOf(':')
    const beforeColon = titre.substring(0, colonIdx).trim()
    const afterColon = titre.substring(colonIdx + 1).trim()
    const beforeNorm = normaliser(beforeColon)
    const isPrefixOnly = PREFIXES_A_SUPPRIMER.includes(beforeNorm)
    if (!isPrefixOnly && beforeColon.length >= 3) {
      titre = beforeColon
    } else {
      titre = afterColon || beforeColon
    }
  }

  const parts = titre.split(/\s+[-–—]\s+/)
  const candidateParts = []
  for (const part of parts) {
    const norm = normaliser(part)
    const isEntirelyPrefix = PREFIXES_A_SUPPRIMER.includes(norm)
    const isEntirelyShort = part.trim().length <= 2
    const isGroupCode = /^(groupe|grp|salle|amphi|g)[a-z0-9\s]*$/i.test(norm)
    const isSuffixStart = MOTS_SUFFIXE_A_SUPPRIMER.some(
      (s) => norm === s || norm.startsWith(s + ' ') || norm.startsWith(s + '-')
    )
    if (!isEntirelyPrefix && !isEntirelyShort && !isGroupCode && !isSuffixStart) {
      candidateParts.push(part.trim())
    }
  }

  let result = candidateParts.length > 0 ? candidateParts[0] : titre.trim()

  const tokens = result.split(/\s+/)
  let start = 0
  while (start < tokens.length - 1) {
    const tokenNorm = normaliser(tokens[start])
    if (PREFIXES_A_SUPPRIMER.includes(tokenNorm)) {
      start++
    } else {
      break
    }
  }
  result = tokens.slice(start).join(' ')

  result = result.replace(/\s+[SsBbEe]\d+$/i, '').trim()
  result = result.replace(/\s+\d+$/, '').trim()

  for (const mot of MOTS_SUFFIXE_A_SUPPRIMER) {
    const escaped = mot.replace(/\s+/g, '\\s+')
    const re = new RegExp('(\\s+' + escaped + ').*$', 'i')
    result = result.replace(re, '').trim()
  }

  return result.length >= 2 ? result : rawTitle.trim()
}

function trouverEmoji(nomMatiere) {
  const norm = normaliser(nomMatiere)
  for (const { mots, emoji } of EMOJIS_MATIERES) {
    if (mots.some((m) => norm.includes(m))) return emoji
  }
  return '📚'
}

export function processEvents(rawEvents, existingSubjects) {
  const matieres = [...existingSubjects]
  const nouvellesMatieres = []
  const seen = new Set()
  const evenements = []

  for (const evt of rawEvents) {
    if (seen.has(evt.id)) continue
    seen.add(evt.id)

    if (new Date(evt.debut) < new Date() && evt.type !== 'cours') continue

    const nomExtrait = extractSubjectName(evt.titreBrut || evt.titre)
    const normExtrait = normaliser(nomExtrait)

    const allMatieres = [...matieres, ...nouvellesMatieres]
    const match = allMatieres.find((m) => {
      const normNom = normaliser(m.nom)
      return normNom === normExtrait || normNom.includes(normExtrait) || normExtrait.includes(normNom)
    })

    let matiereId = null
    if (match) {
      matiereId = match.id
    } else if (evt.type !== 'cours' && nomExtrait && nomExtrait.length >= 2) {
      // Les cours n'ont pas besoin de créer une matière — ils vont directement dans le calendrier
      const newMat = {
        id: genId(),
        nom: nomExtrait,
        couleur: PALETTE_COULEURS[(matieres.length + nouvellesMatieres.length) % PALETTE_COULEURS.length],
        emoji: trouverEmoji(nomExtrait),
        maitrise: 2,
        heuresTotal: 0,
        dateCreation: new Date().toISOString(),
        fromImport: true,
      }
      nouvellesMatieres.push(newMat)
      matiereId = newMat.id
    }

    evenements.push({ ...evt, matiereId })
  }

  if (nouvellesMatieres.length > 0) {
    const touteMatieres = [...matieres, ...nouvellesMatieres]
    saveMatieres(touteMatieres)
    return { evenements, matieres: touteMatieres, nouvellesMatieres }
  }

  return { evenements, matieres, nouvellesMatieres }
}

export function extraireCoursDepuisEvenements(evenements) {
  return evenements
    .filter((e) => e.inclus && e.type === 'cours')
    .map((e) => ({
      id: genId(),
      titre: extractSubjectName(e.titreBrut || e.titre),
      titreBrut: e.titreBrut || e.titre,
      matiereId: e.matiereId,
      type: detecterTypeCours(e.titreBrut || e.titre),
      debut: e.debut,
      fin: e.fin,
      salle: e.lieu || '',
      uid: e.id,
      fromImport: true,
    }))
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

      const titreBrut = titre.replace(/\\n/g, ' ').trim()

      evenements.push({
        id: uid,
        titre: titreBrut,
        titreBrut,
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
