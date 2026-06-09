import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { getMatieres, getExamens, getSessions, saveSessions, getDisponibilites, getPreferences, getCours } from '../utils/storage'
import { generatePlanning } from '../utils/scheduler'
import { toast } from 'sonner'

// ─── Constantes de mise en page ───────────────────────────────────────────────
const HEURE_DEBUT = 7
const HEURE_FIN   = 22                         // incluse
const HEURES      = Array.from({ length: HEURE_FIN - HEURE_DEBUT + 1 }, (_, i) => i + HEURE_DEBUT)
const PX_PAR_HEURE = 64                        // pixels par heure
const TOTAL_HAUTEUR = HEURES.length * PX_PAR_HEURE

const TYPE_COURS_COULEUR = { CM: '#6C63FF', TD: '#12c2e9', TP: '#43C6AC', autre: '#8B8BA8' }

// ─── Helpers de positionnement ────────────────────────────────────────────────
function topPourISO(iso) {
  const d = parseISO(iso)
  return (d.getHours() - HEURE_DEBUT + d.getMinutes() / 60) * PX_PAR_HEURE
}

function hauteurEntreDates(debutISO, finISO) {
  const ms = parseISO(finISO) - parseISO(debutISO)
  return Math.max((ms / 3_600_000) * PX_PAR_HEURE, 20)
}

function hauteurPourMinutes(minutes) {
  return Math.max((minutes / 60) * PX_PAR_HEURE, 20)
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function Planning() {
  const [semaineDebut, setSemaineDebut] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sessions, setSessions]   = useState([])
  const [matieres, setMatieres]   = useState([])
  const [cours, setCours]         = useState([])
  const [afficherCours, setAfficherCours] = useState(true)
  const [generation, setGeneration]       = useState(false)

  useEffect(() => {
    setMatieres(getMatieres())
    setSessions(getSessions())
    setCours(getCours())
  }, [])

  const joursCol = Array.from({ length: 7 }, (_, i) => addDays(semaineDebut, i))

  function getMatiere(id) {
    return matieres.find((m) => m.id === id)
  }

  function getCoursDuJour(jour) {
    if (!afficherCours) return []
    return cours.filter((c) => isSameDay(parseISO(c.debut), jour))
  }

  function getSessionsDuJour(jour) {
    return sessions.filter((s) => isSameDay(parseISO(s.date), jour))
  }

  async function genererPlanning() {
    setGeneration(true)
    await new Promise((r) => setTimeout(r, 1500))
    const mat   = getMatieres()
    const exam  = getExamens()
    const dispo = getDisponibilites()
    const prefs = getPreferences()
    const sessionsExistantes  = getSessions().filter((s) => s.terminee)
    const nouvellesSessions   = generatePlanning(mat, exam, dispo, prefs)
    const toutSessions        = [...sessionsExistantes, ...nouvellesSessions]
    saveSessions(toutSessions)
    setSessions(toutSessions)
    setGeneration(false)
    toast.success(`Planning généré ! ${nouvellesSessions.length} séances planifiées`)
  }

  const dateDebut = format(semaineDebut, 'd MMM', { locale: fr })
  const dateFin   = format(addDays(semaineDebut, 6), 'd MMM yyyy', { locale: fr })

  // ─── Ligne d'heure courante ──────────────────────────────────────────────
  const now = new Date()
  const topNow = (now.getHours() - HEURE_DEBUT + now.getMinutes() / 60) * PX_PAR_HEURE
  const showNow = topNow >= 0 && topNow <= TOTAL_HAUTEUR

  return (
    <div className="page-wrapper page-enter">
      {/* ── Barre d'actions ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h1 className="page-title">Planning</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {cours.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={afficherCours}
                onChange={(e) => setAfficherCours(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
              />
              Afficher les cours
            </label>
          )}
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
            {generation
              ? <><RefreshCw size={14} className="spin" /> Génération...</>
              : <><Zap size={14} /> Générer le planning</>
            }
          </Button>
        </div>
      </div>

      {/* ── Grille calendrier ── */}
      <div className="rf-card" style={{ overflow: 'auto' }}>
        <div style={{ minWidth: 640 }}>

          {/* En-têtes des jours */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '52px repeat(7, 1fr)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            background: 'var(--card)',
            zIndex: 20,
          }}>
            <div />
            {joursCol.map((jour, i) => {
              const auj = isSameDay(jour, new Date())
              return (
                <div key={i} style={{ padding: '10px 4px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: auj ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {format(jour, 'EEE', { locale: fr })}
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: auj ? '#fff' : 'var(--text-secondary)',
                    width: 28, height: 28, borderRadius: '50%',
                    background: auj ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '2px auto 0',
                  }}>
                    {format(jour, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Corps : colonnes avec positionnement absolu */}
          <div style={{ display: 'flex', position: 'relative' }}>

            {/* Colonne des heures */}
            <div style={{ width: 52, flexShrink: 0, position: 'relative', height: TOTAL_HAUTEUR }}>
              {HEURES.map((h) => (
                <div key={h} style={{
                  position: 'absolute',
                  top: (h - HEURE_DEBUT) * PX_PAR_HEURE - 8,
                  right: 8,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                  lineHeight: 1,
                }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {joursCol.map((jour, j) => {
              const coursJour    = getCoursDuJour(jour)
              const sessionsJour = getSessionsDuJour(jour)
              const auj          = isSameDay(jour, new Date())

              return (
                <div key={j} style={{
                  flex: 1,
                  position: 'relative',
                  height: TOTAL_HAUTEUR,
                  borderLeft: '1px solid var(--border)',
                  background: auj ? 'rgba(108,99,255,0.015)' : 'transparent',
                  minWidth: 0,
                }}>
                  {/* Lignes de grille horaire */}
                  {HEURES.map((h) => (
                    <div key={h} style={{
                      position: 'absolute',
                      top: (h - HEURE_DEBUT) * PX_PAR_HEURE,
                      left: 0, right: 0, height: 1,
                      borderTop: '1px solid var(--border)',
                    }} />
                  ))}
                  {/* Lignes demi-heures (plus légères) */}
                  {HEURES.map((h) => (
                    <div key={`${h}h`} style={{
                      position: 'absolute',
                      top: (h - HEURE_DEBUT + 0.5) * PX_PAR_HEURE,
                      left: 0, right: 0, height: 1,
                      background: 'var(--border)',
                      opacity: 0.4,
                    }} />
                  ))}

                  {/* Ligne "maintenant" */}
                  {auj && showNow && (
                    <div style={{
                      position: 'absolute',
                      top: topNow,
                      left: 0, right: 0,
                      height: 2,
                      background: 'var(--accent)',
                      zIndex: 5,
                    }}>
                      <div style={{
                        position: 'absolute', left: -4, top: -4,
                        width: 10, height: 10, borderRadius: '50%',
                        background: 'var(--accent)',
                      }} />
                    </div>
                  )}

                  {/* ── Cours ── */}
                  {coursJour.map((c) => {
                    const mat        = getMatiere(c.matiereId)
                    const couleur    = TYPE_COURS_COULEUR[c.type] || TYPE_COURS_COULEUR.autre
                    const top        = topPourISO(c.debut)
                    const hauteur    = hauteurEntreDates(c.debut, c.fin)
                    const heureDebut = format(parseISO(c.debut), 'HH:mm')
                    const heureFin   = format(parseISO(c.fin),   'HH:mm')

                    return (
                      <div
                        key={c.id}
                        title={`${c.titreBrut}${c.salle ? ' — ' + c.salle : ''}\n${heureDebut}–${heureFin}`}
                        style={{
                          position: 'absolute',
                          top, height: hauteur,
                          left: 2, right: 2,
                          background: `repeating-linear-gradient(45deg, ${couleur}14, ${couleur}14 3px, transparent 3px, transparent 7px)`,
                          border:     `1px solid ${couleur}45`,
                          borderLeft: `3px solid ${couleur}`,
                          borderRadius: 5,
                          padding: '3px 5px',
                          fontSize: 10,
                          overflow: 'hidden',
                          zIndex: 2,
                          boxSizing: 'border-box',
                          cursor: 'default',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: couleur, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '0 3px',
                            borderRadius: 3, background: `${couleur}28`,
                            letterSpacing: '0.2px', flexShrink: 0,
                          }}>
                            {c.type}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mat ? `${mat.emoji} ${mat.nom}` : c.titre}
                          </span>
                        </div>
                        {hauteur > 30 && (
                          <div style={{ color: couleur, opacity: 0.75, fontSize: 9, marginTop: 1 }}>
                            {heureDebut}–{heureFin}
                          </div>
                        )}
                        {hauteur > 44 && c.salle && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>📍 {c.salle}</div>
                        )}
                      </div>
                    )
                  })}

                  {/* ── Séances de révision ── */}
                  {sessionsJour.map((s) => {
                    const mat     = getMatiere(s.matiereId)
                    if (!mat) return null
                    const top     = topPourISO(s.date)
                    const hauteur = hauteurPourMinutes(s.duree)

                    return (
                      <div
                        key={s.id}
                        title={`${mat.nom} — ${s.duree}min${s.phase ? ' · ' + s.phase : ''}`}
                        style={{
                          position: 'absolute',
                          top, height: hauteur,
                          left: 2, right: 2,
                          background:  `${mat.couleur}1a`,
                          borderLeft:  `3px solid ${mat.couleur}`,
                          borderRadius: 5,
                          padding: '3px 5px',
                          fontSize: 10,
                          opacity: s.terminee ? 0.45 : 1,
                          overflow: 'hidden',
                          zIndex: 1,
                          boxSizing: 'border-box',
                          cursor: 'default',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: mat.couleur, display: 'flex', alignItems: 'center', gap: 3 }}>
                          {s.terminee && <Check size={9} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mat.emoji} {mat.nom}
                          </span>
                        </div>
                        {hauteur > 30 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                            {s.duree}min{s.phase ? ` · ${s.phase}` : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Légende ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, padding: '0 4px', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COURS_COULEUR).map(([type, couleur]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: `repeating-linear-gradient(45deg, ${couleur}30, ${couleur}30 2px, transparent 2px, transparent 5px)`,
              border: `1px solid ${couleur}50`,
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{type}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)', opacity: 0.4 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Révision</span>
        </div>
      </div>

      {sessions.length === 0 && cours.length === 0 && (
        <div className="rf-card p-5 mt-4 text-center">
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune séance planifiée</h3>
          <p className="caption mb-4">Cliquez sur "Générer le planning" ou importez votre emploi du temps.</p>
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
