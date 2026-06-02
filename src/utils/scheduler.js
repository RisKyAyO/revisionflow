import { addDays, differenceInDays, startOfDay, format, getDay, isAfter, isBefore, parseISO, isSameDay } from 'date-fns'

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

export function hasCollision(slotStart, slotEnd, occupiedSlots) {
  for (const slot of occupiedSlots) {
    const start = new Date(slot.debut)
    const end = new Date(slot.fin)
    if (!(slotEnd <= start || slotStart >= end)) return true
  }
  return false
}

function trouverCreneauLibreDuJour(jour, dureeMin, occupiedSlots, disponibilites) {
  const indexJour = getDay(jour)
  const nomJour = JOURS_SEMAINE[indexJour]
  const dispo = disponibilites[nomJour]

  if (!dispo || !dispo.actif) return null

  const debutMin = heureVersMinutes(dispo.debut)
  const finMin = heureVersMinutes(dispo.fin)

  let slot = debutMin
  while (slot + dureeMin <= finMin) {
    const slotStart = new Date(jour)
    slotStart.setHours(Math.floor(slot / 60), slot % 60, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + dureeMin * 60 * 1000)

    if (!hasCollision(slotStart, slotEnd, occupiedSlots)) {
      return slotStart
    }
    slot += 15
  }
  return null
}

function trouverProchainCreneau(dateDepart, dateMax, dureeMin, occupiedSlots, disponibilites) {
  let jour = startOfDay(dateDepart)
  const limiteMax = startOfDay(dateMax)

  while (!isAfter(jour, limiteMax)) {
    const creneau = trouverCreneauLibreDuJour(jour, dureeMin, occupiedSlots, disponibilites)
    if (creneau) return creneau
    jour = addDays(jour, 1)
  }
  return null
}

export function estimerNbSessions(event, matieres) {
  if (event.type === 'cours') return null

  if (event.type === 'devoir' || event.type === 'autre') {
    const jours = differenceInDays(new Date(event.debut), new Date())
    return jours > 7 ? 2 : 1
  }

  const matiere = matieres.find((m) => m.id === event.matiereId)
  const maitrise = matiere ? matiere.maitrise : 2
  const jours = differenceInDays(new Date(event.debut), new Date())

  if (maitrise <= 1) return jours > 14 ? 9 : jours > 7 ? 6 : 4
  if (maitrise <= 2) return jours > 14 ? 7 : jours > 7 ? 5 : 3
  if (maitrise <= 3) return jours > 14 ? 5 : jours > 7 ? 3 : 2
  return 2
}

export function generateSessionsForEvent(event, matieres, occupiedSlots, disponibilites, preferences) {
  const sessions = []

  if (event.type === 'cours') return sessions

  const nbSessions = estimerNbSessions(event, matieres)
  if (!nbSessions || nbSessions <= 0) return sessions

  const dateEvenement = new Date(event.debut)
  const duree = preferences.dureeSceance || 45
  const isExamen = event.type === 'examen'

  let dateDepart = new Date()
  const dateMax = addDays(dateEvenement, -1)

  for (let i = 0; i < nbSessions; i++) {
    const creneau = trouverProchainCreneau(dateDepart, dateMax, duree, occupiedSlots, disponibilites)
    if (!creneau) break

    let phase = null
    if (isExamen) {
      const tiers = Math.max(1, Math.floor(nbSessions / 3))
      if (i < tiers) phase = 'découverte'
      else if (i < tiers * 2) phase = 'consolidation'
      else phase = 'intensive'
    }

    const session = {
      id: genId(),
      matiereId: event.matiereId,
      date: creneau.toISOString(),
      duree,
      terminee: false,
      note: 0,
      typeSession: isExamen ? 'revision' : 'travail',
      phase,
      linkedEventId: event.id,
      linkedEventType: event.type,
      ordre: i + 1,
      nom: null,
    }

    sessions.push(session)
    occupiedSlots.push({
      debut: creneau.toISOString(),
      fin: new Date(creneau.getTime() + duree * 60 * 1000).toISOString(),
    })

    dateDepart = addDays(creneau, 1)
  }

  return sessions
}
