import { useState, useEffect } from 'react'
import { format, parseISO, differenceInDays, isSameDay, startOfWeek, addDays, isToday, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, BookOpen, Clock, TrendingUp } from 'lucide-react'
import StatCard from '../components/StatCard'
import SessionCard from '../components/SessionCard'
import EmptyState from '../components/EmptyState'
import { Progress } from '../components/ui/progress'
import { getMatieres, getExamens, getSessions, saveSessions, saveMatieres, getDevoirs, saveDevoirs } from '../utils/storage'
import { mettreAJourMaistrise } from '../utils/scheduler'

export default function Dashboard() {
  const [matieres, setMatieres] = useState([])
  const [examens, setExamens] = useState([])
  const [sessions, setSessions] = useState([])
  const [devoirs, setDevoirs] = useState([])
  const [jourSelectionne, setJourSelectionne] = useState(new Date())

  useEffect(() => {
    setMatieres(getMatieres())
    setExamens(getExamens())
    setSessions(getSessions())
    setDevoirs(getDevoirs())
  }, [])

  const aujourd = new Date()
  const sessionsDuJour = sessions.filter((s) => isSameDay(parseISO(s.date), jourSelectionne))
  const sessionsDaujourdhui = sessions.filter((s) => isSameDay(parseISO(s.date), aujourd))

  const totalSessions = sessions.length
  const terminees = sessions.filter((s) => s.terminee).length
  const tauxCompletion = totalSessions > 0 ? Math.round((terminees / totalSessions) * 100) : 0

  const prochainExamen = examens
    .map((e) => ({ ...e, jours: differenceInDays(parseISO(e.date), aujourd) }))
    .filter((e) => e.jours >= 0)
    .sort((a, b) => a.jours - b.jours)[0]

  function marquerFaite(sessionId, note) {
    const matieresMaj = [...matieres]
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    const indexMatiere = matieresMaj.findIndex((m) => m.id === session.matiereId)
    if (indexMatiere !== -1) {
      const matMaj = mettreAJourMaistrise(matieresMaj[indexMatiere], note)
      matMaj.heuresTotal = (matMaj.heuresTotal || 0) + session.duree / 60
      matieresMaj[indexMatiere] = matMaj
    }

    const sessionsMaj = sessions.map((s) =>
      s.id === sessionId ? { ...s, terminee: true, note } : s
    )
    setSessions(sessionsMaj)
    setMatieres(matieresMaj)
    saveSessions(sessionsMaj)
    saveMatieres(matieresMaj)
  }

  const debutSemaine = startOfWeek(aujourd, { weekStartsOn: 1 })
  const jours7 = Array.from({ length: 7 }, (_, i) => addDays(debutSemaine, i))

  function getCouleurExamen(jours) {
    if (jours < 7) return 'var(--accent)'
    if (jours < 14) return 'var(--warning)'
    return 'var(--success)'
  }

  function getMatiereExamen(examen) {
    return matieres.find((m) => m.id === examen.matiereId)
  }

  const examensProches = examens
    .map((e) => ({ ...e, jours: differenceInDays(parseISO(e.date), aujourd) }))
    .filter((e) => e.jours >= 0)
    .sort((a, b) => a.jours - b.jours)
    .slice(0, 4)

  const devoirsProches = devoirs
    .filter((d) => !d.termine)
    .sort((a, b) => new Date(a.dateRendu) - new Date(b.dateRendu))
    .slice(0, 4)

  function marquerDevoirFait(id) {
    const maj = devoirs.map((d) => (d.id === id ? { ...d, termine: true } : d))
    setDevoirs(maj)
    saveDevoirs(maj)
  }

  return (
    <div className="page-wrapper page-enter">
      <div className="mb-4">
        <h1 className="page-title">Bonjour 👋</h1>
        <p className="caption" style={{ fontSize: 14, marginTop: 4 }}>
          {format(aujourd, "EEEE d MMMM yyyy", { locale: fr }).replace(/^\w/, (c) => c.toUpperCase())}
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            icone={<Clock size={18} />}
            label="Séances aujourd'hui"
            valeur={sessionsDaujourdhui.length}
            couleur="var(--primary)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone={<BookOpen size={18} />}
            label="Matières en cours"
            valeur={matieres.length}
            couleur="var(--accent)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone={<CalendarDays size={18} />}
            label="Prochain examen"
            valeur={prochainExamen ? prochainExamen.jours : '—'}
            unite={prochainExamen ? 'jours' : ''}
            couleur="var(--warning)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone={<TrendingUp size={18} />}
            label="Taux de complétion"
            valeur={tauxCompletion}
            unite="%"
            couleur="var(--success)"
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="rf-card p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="label-upper">Vue hebdomadaire</div>
            </div>
            <div className="d-flex gap-2 mt-3" style={{ overflowX: 'auto' }}>
              {jours7.map((jour, i) => {
                const sessionsJour = sessions.filter((s) => isSameDay(parseISO(s.date), jour))
                const actif = isSameDay(jour, jourSelectionne)
                const auj = isToday(jour)
                return (
                  <button
                    key={i}
                    onClick={() => setJourSelectionne(jour)}
                    style={{
                      flex: 1,
                      minWidth: 44,
                      padding: '10px 6px',
                      borderRadius: 10,
                      border: `2px solid ${actif ? 'var(--primary)' : 'var(--border)'}`,
                      background: actif ? 'var(--primary-glow)' : 'var(--card-elevated)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 600, color: actif ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {format(jour, 'EEE', { locale: fr })}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: actif ? 'var(--primary)' : auj ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: 2 }}>
                      {format(jour, 'd')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
                      {sessionsJour.slice(0, 4).map((_, idx) => (
                        <div key={idx} style={{ width: 4, height: 4, borderRadius: '50%', background: actif ? 'var(--primary)' : 'var(--text-muted)' }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rf-card p-4">
            <div className="label-upper mb-3">
              {isToday(jourSelectionne) ? "Aujourd'hui" : format(jourSelectionne, 'EEEE d MMMM', { locale: fr })}
              <span className="rf-badge rf-badge-primary ms-2">{sessionsDuJour.length} séances</span>
            </div>
            {sessionsDuJour.length === 0 ? (
              <EmptyState
                titre="Aucune séance prévue"
                soustitre="Générez votre planning dans la section Planning"
                ctaLabel="Aller au planning"
                onCta={() => window.location.href = '/planning'}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessionsDuJour.map((session) => {
                  const matiere = matieres.find((m) => m.id === session.matiereId)
                  return (
                    <SessionCard
                      key={session.id}
                      session={session}
                      matiere={matiere}
                      onMarquerFaite={marquerFaite}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <div className="rf-card p-4 mt-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="label-upper">Devoirs à rendre</div>
              {devoirs.filter((d) => !d.termine).length > 4 && (
                <a
                  href="/import"
                  style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}
                >
                  Voir tout
                </a>
              )}
            </div>
            {devoirsProches.length === 0 ? (
              <EmptyState
                titre="Aucun devoir à venir"
                soustitre="Importez votre calendrier pour voir vos devoirs"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {devoirsProches.map((devoir, i) => {
                  const mat = matieres.find((m) => m.id === devoir.matiereId)
                  const enRetard = isBefore(parseISO(devoir.dateRendu), aujourd)
                  return (
                    <div
                      key={devoir.id}
                      className="animate-fade-slide"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: i < devoirsProches.length - 1 ? '1px solid var(--border)' : 'none',
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      <input
                        type="checkbox"
                        onChange={() => marquerDevoirFait(devoir.id)}
                        style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 500,
                          color: enRetard ? 'var(--accent)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {devoir.titre}
                      </span>
                      {mat && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: `${mat.couleur}20`,
                            color: mat.couleur,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {mat.emoji} {mat.nom}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          color: enRetard ? 'var(--accent)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          fontWeight: enRetard ? 600 : 400,
                        }}
                      >
                        {format(parseISO(devoir.dateRendu), 'dd MMM', { locale: fr })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="rf-card p-4">
            <div className="label-upper mb-3">Prochains examens</div>
            {examensProches.length === 0 ? (
              <EmptyState
                titre="Aucun examen"
                soustitre="Ajoutez vos examens dans Mes matières"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {examensProches.map((examen) => {
                  const mat = getMatiereExamen(examen)
                  if (!mat) return null
                  const couleur = getCouleurExamen(examen.jours)
                  const sessionsMat = sessions.filter((s) => s.matiereId === mat.id)
                  const terminesMat = sessionsMat.filter((s) => s.terminee).length
                  const pourcentMat = sessionsMat.length > 0 ? Math.round((terminesMat / sessionsMat.length) * 100) : 0

                  return (
                    <div
                      key={examen.id}
                      className="animate-fade-slide item-stagger"
                      style={{
                        padding: '14px',
                        background: 'var(--card-elevated)',
                        borderRadius: 10,
                        borderLeft: `3px solid ${couleur}`,
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 20 }}>{mat.emoji}</span>
                          <span className="card-title">{mat.nom}</span>
                        </div>
                        <span
                          className="rf-badge"
                          style={{
                            background: `${couleur}20`,
                            color: couleur,
                          }}
                        >
                          J-{examen.jours}
                        </span>
                      </div>
                      <div className="caption mb-2">
                        {format(parseISO(examen.date), "EEEE d MMMM", { locale: fr }).replace(/^\w/, (c) => c.toUpperCase())}
                        {examen.lieu && ` · ${examen.lieu}`}
                      </div>
                      <Progress value={pourcentMat} color={couleur} />
                      <div className="caption mt-1">{pourcentMat}% de révisions complétées</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
