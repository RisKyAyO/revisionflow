import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { getMatieres, getExamens, getSessions, saveSessions, getDisponibilites, getPreferences } from '../utils/storage'
import { generatePlanning } from '../utils/scheduler'
import { toast } from 'sonner'

const HEURES = Array.from({ length: 15 }, (_, i) => i + 8)

export default function Planning() {
  const [semaineDebut, setSemaineDebut] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sessions, setSessions] = useState([])
  const [matieres, setMatieres] = useState([])
  const [generation, setGeneration] = useState(false)

  useEffect(() => {
    setMatieres(getMatieres())
    setSessions(getSessions())
  }, [])

  const joursCol = Array.from({ length: 7 }, (_, i) => addDays(semaineDebut, i))

  function getSessionsDuJourHeure(jour, heure) {
    return sessions.filter((s) => {
      const d = parseISO(s.date)
      return isSameDay(d, jour) && d.getHours() === heure
    })
  }

  function getMatiere(id) {
    return matieres.find((m) => m.id === id)
  }

  async function genererPlanning() {
    setGeneration(true)
    await new Promise((r) => setTimeout(r, 1500))

    const mat = getMatieres()
    const exam = getExamens()
    const dispo = getDisponibilites()
    const prefs = getPreferences()

    const sessionsExistantes = getSessions().filter((s) => s.terminee)
    const nouvellesSessions = generatePlanning(mat, exam, dispo, prefs)
    const toutSessions = [...sessionsExistantes, ...nouvellesSessions]

    saveSessions(toutSessions)
    setSessions(toutSessions)
    setGeneration(false)
    toast.success(`Planning généré ! ${nouvellesSessions.length} séances planifiées`)
  }

  const dateDebut = format(semaineDebut, 'd MMM', { locale: fr })
  const dateFin = format(addDays(semaineDebut, 6), 'd MMM yyyy', { locale: fr })

  return (
    <div className="page-wrapper page-enter">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h1 className="page-title">Planning</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => setSemaineDebut(subWeeks(semaineDebut, 1))}>
              <ChevronLeft size={14} />
            </Button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '0 8px', whiteSpace: 'nowrap' }}>
              {dateDebut} — {dateFin}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setSemaineDebut(addWeeks(semaineDebut, 1))}>
              <ChevronRight size={14} />
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={genererPlanning} disabled={generation}>
            <RefreshCw size={13} className={generation ? 'spin' : ''} />
            Regénérer
          </Button>
          <Button variant="default" onClick={genererPlanning} disabled={generation}>
            {generation ? (
              <><RefreshCw size={14} className="spin" /> Génération...</>
            ) : (
              <><Zap size={14} /> Générer le planning</>
            )}
          </Button>
        </div>
      </div>

      <div className="rf-card" style={{ overflow: 'auto' }}>
        <div style={{ minWidth: 700 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '56px repeat(7, 1fr)',
              borderBottom: '1px solid var(--border)',
              position: 'sticky',
              top: 60,
              background: 'var(--card)',
              zIndex: 10,
            }}
          >
            <div style={{ padding: '12px 8px' }} />
            {joursCol.map((jour, i) => {
              const auj = isSameDay(jour, new Date())
              return (
                <div
                  key={i}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderLeft: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: auj ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {format(jour, 'EEE', { locale: fr })}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: auj ? '#fff' : 'var(--text-secondary)',
                      marginTop: 2,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: auj ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '4px auto 0',
                    }}
                  >
                    {format(jour, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          {HEURES.map((heure) => (
            <div
              key={heure}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px repeat(7, 1fr)',
                borderBottom: '1px solid var(--border)',
                minHeight: 64,
              }}
            >
              <div style={{ padding: '8px 8px 0', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                {String(heure).padStart(2, '0')}:00
              </div>
              {joursCol.map((jour, j) => {
                const sess = getSessionsDuJourHeure(jour, heure)
                return (
                  <div
                    key={j}
                    style={{
                      borderLeft: '1px solid var(--border)',
                      padding: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    {sess.map((s) => {
                      const mat = getMatiere(s.matiereId)
                      if (!mat) return null
                      return (
                        <div
                          key={s.id}
                          style={{
                            background: `${mat.couleur}18`,
                            borderLeft: `3px solid ${mat.couleur}`,
                            borderRadius: 6,
                            padding: '4px 7px',
                            fontSize: 11,
                            opacity: s.terminee ? 0.5 : 1,
                            cursor: 'default',
                            position: 'relative',
                          }}
                          title={`${mat.nom} — ${s.duree}min`}
                        >
                          <div style={{ fontWeight: 600, color: mat.couleur, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {s.terminee && <Check size={10} />}
                            {mat.emoji} {mat.nom}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{s.duree}min</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="rf-card p-5 mt-4 text-center">
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune séance planifiée</h3>
          <p className="caption mb-4">Cliquez sur "Générer le planning" pour créer votre programme de révisions personnalisé</p>
          <Button variant="default" onClick={genererPlanning} disabled={generation}>
            <Zap size={14} />
            Générer mon planning
          </Button>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
