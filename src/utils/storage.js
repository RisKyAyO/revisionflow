import { addDays, addWeeks } from 'date-fns'

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

const CLE_MATIERES = 'rf_matieres'
const CLE_EXAMENS = 'rf_examens'
const CLE_SESSIONS = 'rf_sessions'
const CLE_DISPONIBILITES = 'rf_disponibilites'
const CLE_PREFERENCES = 'rf_preferences'
const CLE_INIT = 'rf_initialise'

function lire(cle) {
  try {
    const val = localStorage.getItem(cle)
    return val ? JSON.parse(val) : null
  } catch (e) {
    return null
  }
}

function sauvegarder(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
  } catch (e) {
    console.error('Erreur sauvegarde:', e)
  }
}

export function getMatieres() {
  return lire(CLE_MATIERES) || []
}

export function saveMatieres(matieres) {
  sauvegarder(CLE_MATIERES, matieres)
}

export function getExamens() {
  return lire(CLE_EXAMENS) || []
}

export function saveExamens(examens) {
  sauvegarder(CLE_EXAMENS, examens)
}

export function getSessions() {
  return lire(CLE_SESSIONS) || []
}

export function saveSessions(sessions) {
  sauvegarder(CLE_SESSIONS, sessions)
}

const CLE_DEVOIRS = 'rf_devoirs'

export function getDevoirs() {
  return lire(CLE_DEVOIRS) || []
}

export function saveDevoirs(devoirs) {
  sauvegarder(CLE_DEVOIRS, devoirs)
}

const CLE_COURS = 'rf_cours'

export function getCours() {
  return lire(CLE_COURS) || []
}

export function saveCours(cours) {
  sauvegarder(CLE_COURS, cours)
}

export function getDisponibilites() {
  const defaut = {
    lundi: { actif: true, debut: '09:00', fin: '18:00' },
    mardi: { actif: true, debut: '09:00', fin: '18:00' },
    mercredi: { actif: true, debut: '09:00', fin: '18:00' },
    jeudi: { actif: true, debut: '09:00', fin: '18:00' },
    vendredi: { actif: true, debut: '09:00', fin: '18:00' },
    samedi: { actif: false, debut: '10:00', fin: '16:00' },
    dimanche: { actif: false, debut: '10:00', fin: '14:00' },
  }
  return lire(CLE_DISPONIBILITES) || defaut
}

export function saveDisponibilites(dispo) {
  sauvegarder(CLE_DISPONIBILITES, dispo)
}

export function getPreferences() {
  const defaut = {
    dureeSceance: 45,
    pauseEntre: 10,
    maxSceancesParJour: 4,
    methode: 'espacee',
  }
  return lire(CLE_PREFERENCES) || defaut
}

export function savePreferences(prefs) {
  sauvegarder(CLE_PREFERENCES, prefs)
}

const CLE_MAPPING_COURS = 'rf_mapping_cours'

export function getMappingCours() {
  return lire(CLE_MAPPING_COURS) || {}
}

export function saveMappingCours(mapping) {
  sauvegarder(CLE_MAPPING_COURS, mapping)
}

const CLE_SYNC = 'rf_sync'

export function getSyncConfig() {
  return lire(CLE_SYNC) || { url: '', lastSync: null }
}

export function saveSyncConfig(config) {
  sauvegarder(CLE_SYNC, config)
}

export function reinitialiserDonnees() {
  localStorage.removeItem(CLE_MATIERES)
  localStorage.removeItem(CLE_EXAMENS)
  localStorage.removeItem(CLE_SESSIONS)
  localStorage.removeItem(CLE_INIT)
  initialiserDemoData()
}

export function exporterDonnees() {
  const data = {
    matieres: getMatieres(),
    examens: getExamens(),
    sessions: getSessions(),
    disponibilites: getDisponibilites(),
    preferences: getPreferences(),
    exportDate: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'revisionflow-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function initialiserDemoData() {
  if (lire(CLE_INIT)) return

  const maintenant = new Date()

  const matieres = [
    {
      id: genId(),
      nom: 'Mathématiques',
      couleur: '#6C63FF',
      emoji: '📐',
      maitrise: 2,
      heuresTotal: 8,
      dateCreation: maintenant.toISOString(),
    },
    {
      id: genId(),
      nom: 'Physique',
      couleur: '#FF6584',
      emoji: '⚗️',
      maitrise: 3,
      heuresTotal: 6,
      dateCreation: maintenant.toISOString(),
    },
    {
      id: genId(),
      nom: 'Anglais',
      couleur: '#4ADE80',
      emoji: '🌍',
      maitrise: 4,
      heuresTotal: 4,
      dateCreation: maintenant.toISOString(),
    },
    {
      id: genId(),
      nom: 'Histoire',
      couleur: '#FBBF24',
      emoji: '📜',
      maitrise: 2,
      heuresTotal: 5,
      dateCreation: maintenant.toISOString(),
    },
  ]

  const examens = [
    {
      id: genId(),
      matiereId: matieres[0].id,
      date: addDays(maintenant, 18).toISOString(),
      lieu: 'Amphi A',
      notes: 'Chapitres 1 à 6',
    },
    {
      id: genId(),
      matiereId: matieres[1].id,
      date: addDays(maintenant, 22).toISOString(),
      lieu: 'Salle B12',
      notes: 'Mécanique et thermodynamique',
    },
    {
      id: genId(),
      matiereId: matieres[2].id,
      date: addDays(maintenant, 28).toISOString(),
      lieu: 'Amphi C',
      notes: 'Expression orale et écrite',
    },
    {
      id: genId(),
      matiereId: matieres[3].id,
      date: addDays(maintenant, 14).toISOString(),
      lieu: 'Salle A08',
      notes: 'Guerre froide et décolonisation',
    },
  ]

  saveMatieres(matieres)
  saveExamens(examens)
  sauvegarder(CLE_INIT, true)
}
