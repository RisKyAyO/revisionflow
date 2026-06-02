import { addDays, differenceInDays, startOfDay, format, getDay, isAfter, isBefore, parseISO } from 'date-fns'

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const INTERVALLES_MAITRISE = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 7,
}

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function heureVersMinutes(heure) {
  const [h, m] = heure.split(':').map(Number)
  return h * 60 + m
}

function minutesVersHeure(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function calculerUrgence(matiere, examens) {
  const maintenant = new Date()
  let urgenceMax = 0

  examens.forEach((examen) => {
    if (examen.matiereId !== matiere.id) return
    const joursRestants = differenceInDays(parseISO(examen.date), maintenant)
    if (joursRestants <= 0) return
    const urgence = (1 / joursRestants) * (1 / matiere.maitrise)
    if (urgence > urgenceMax) urgenceMax = urgence
  })

  return urgenceMax
}

function prochaineExamen(matiereId, examens) {
  const maintenant = new Date()
  let dateMin = null
  examens.forEach((examen) => {
    if (examen.matiereId !== matiereId) return
    const d = parseISO(examen.date)
    if (isAfter(d, maintenant)) {
      if (!dateMin || isBefore(d, dateMin)) {
        dateMin = d
      }
    }
  })
  return dateMin
}

export function generatePlanning(matieres, examens, disponibilites, preferences) {
  const sessions = []
  const maintenant = new Date()
  const fin = addDays(maintenant, 14)

  if (matieres.length === 0) return sessions

  const matieresAvecExamen = matieres.filter((m) => {
    return examens.some((e) => e.matiereId === m.id)
  })

  const matieresATraiter = matieresAvecExamen.length > 0 ? matieresAvecExamen : matieres

  const urgences = matieresATraiter.map((m) => ({
    matiere: m,
    urgence: calculerUrgence(m, examens) || 1 / (m.maitrise * 3),
  }))

  let jour = startOfDay(maintenant)
  const jourParMatiere = {}
  matieresATraiter.forEach((m) => {
    jourParMatiere[m.id] = startOfDay(maintenant)
  })

  while (isBefore(jour, fin)) {
    const indexJour = getDay(jour)
    const nomJour = JOURS_SEMAINE[indexJour]
    const dispo = disponibilites[nomJour]

    if (!dispo || !dispo.actif) {
      jour = addDays(jour, 1)
      continue
    }

    const debutMin = heureVersMinutes(dispo.debut)
    const finMin = heureVersMinutes(dispo.fin)
    const duree = preferences.dureeSceance || 45
    const pause = preferences.pauseEntre || 10
    const maxParJour = preferences.maxSceancesParJour || 4

    let slotActuel = debutMin
    let sessionsAujourdHui = 0
    let derniereMatiereId = null

    const matieresDisponibles = urgences
      .filter((u) => {
        const prochainJour = jourParMatiere[u.matiere.id]
        return !isAfter(prochainJour, jour)
      })
      .sort((a, b) => b.urgence - a.urgence)

    for (let i = 0; i < matieresDisponibles.length && sessionsAujourdHui < maxParJour; i++) {
      const { matiere } = matieresDisponibles[i]

      if (matiere.id === derniereMatiereId && matieresDisponibles.length > 1) continue

      if (slotActuel + duree > finMin) break

      const dateSession = new Date(jour)
      dateSession.setHours(Math.floor(slotActuel / 60), slotActuel % 60, 0, 0)

      sessions.push({
        id: genId(),
        matiereId: matiere.id,
        date: dateSession.toISOString(),
        duree: duree,
        terminee: false,
        note: 0,
      })

      const intervalle = INTERVALLES_MAITRISE[Math.round(matiere.maitrise)] || 3
      jourParMatiere[matiere.id] = addDays(jour, intervalle)
      derniereMatiereId = matiere.id
      slotActuel += duree + pause
      sessionsAujourdHui++
    }

    jour = addDays(jour, 1)
  }

  return sessions
}

export function mettreAJourMaistrise(matiere, note) {
  let nouvelleMaitrise = matiere.maitrise

  if (note >= 4) {
    nouvelleMaitrise = Math.min(5, matiere.maitrise + 0.5)
  } else if (note <= 2) {
    nouvelleMaitrise = Math.max(1, matiere.maitrise - 0.5)
  }

  return { ...matiere, maitrise: nouvelleMaitrise }
}

export function getIntervalleParMaitrise(maitrise) {
  return INTERVALLES_MAITRISE[Math.round(maitrise)] || 3
}
