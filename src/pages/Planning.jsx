import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, Zap, Check, Settings2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  getMatieres, saveMatieres, getExamens, getSessions, saveSessions,
  getDisponibilites, getPreferences, getCours, saveCours,
  getMappingCours, saveMappingCours,
} from '../utils/storage'
import { generatePlanning } from '../utils/scheduler'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}
function normaliser(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Lecture robuste du mapping (compat ancienne structure string)
function lireMapping(mapping, key) {
  const val = mapping[key]
  if (!val) return { matiereId: null, categorie: null }
  if (typeof val === 'string') return { matiereId: val, categorie: null }
  return { matiereId: val.matiereId || null, categorie: val.categorie || null }
}

// ─── Constantes calendrier ────────────────────────────────────────────────────
const HEURE_DEBUT   = 7
const HEURE_FIN     = 22
const HEURES        = Array.from({ length: HEURE_FIN - HEURE_DEBUT + 1 }, (_, i) => i + HEURE_DEBUT)
const PX_PAR_HEURE  = 64
const TOTAL_HAUTEUR = HEURES.length * PX_PAR_HEURE

// ─── Styles par catégorie d'événement ─────────────────────────────────────────
const TYPE_COURS_COULEUR = { CM: '#6C63FF', TD: '#12c2e9', TP: '#43C6AC', autre: '#8B8BA8' }

const CATEGORIES = [
  { val: 'cours',     label: 'Cours',      emoji: '📚', couleur: '#6C63FF' },
  { val: 'reunion',   label: 'Réunion',    emoji: '📅', couleur: '#64748B' },
  { val: 'evenement', label: 'Événement',  emoji: '🎯', couleur: '#F59E0B' },
  { val: 'ignore',    label: 'Ignorer',    emoji: '🚫', couleur: '#4B4B6B' },
]

function styleEvenement(c, mat) {
  const cat = c.categorie

  if (cat === 'reunion') {
    return {
      bg:     '#64748B18',
      border: '#64748B60',
      bLeft:  '#64748B',
      color:  '#94A3B8',
      label:  `📅 ${c.titre || c.titreBrut}`,
      sublabel: null,
    }
  }
  if (cat === 'evenement') {
    return {
      bg:     '#F59E0B18',
      border: '#F59E0B50',
      bLeft:  '#F59E0B',
      color:  '#F59E0B',
      label:  `🎯 ${c.titre || c.titreBrut}`,
      sublabel: null,
    }
  }
  // cours (ou non classé)
  const typeCouleur = mat ? mat.couleur : (TYPE_COURS_COULEUR[c.type] || TYPE_COURS_COULEUR.autre)
  return {
    bg:       `repeating-linear-gradient(45deg, ${typeCouleur}14, ${typeCouleur}14 3px, transparent 3px, transparent 7px)`,
    border:   `${typeCouleur}45`,
    bLeft:    typeCouleur,
    color:    typeCouleur,
    label:    mat ? `${mat.emoji} ${mat.nom}` : (c.titre || c.titreBrut),
    sublabel: c.type !== 'autre' ? c.type : null,
    isStriped: true,
  }
}

// ─── Positionnement ───────────────────────────────────────────────────────────
function topPourISO(iso) {
  const d = parseISO(iso)
  return (d.getHours() - HEURE_DEBUT + d.getMinutes() / 60) * PX_PAR_HEURE
}
function hauteurEntreDates(dISO, fISO) {
  return Math.max(((parseISO(fISO) - parseISO(dISO)) / 3_600_000) * PX_PAR_HEURE, 20)
}
function hauteurPourMinutes(min) {
  return Math.max((min / 60) * PX_PAR_HEURE, 20)
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Planning() {
  const [semaineDebut, setSemaineDebut] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sessions,  setSessions]  = useState([])
  const [matieres,  setMatieres]  = useState([])
  const [cours,     setCours]     = useState([])
  const [afficherCours, setAfficherCours] = useState(true)
  const [generation,    setGeneration]    = useState(false)
  const [panneauOuvert, setPanneauOuvert] = useState(false)
  const [montrerTout,   setMontrerTout]   = useState(false)
  // assocTemp : { [titre]: { matiereId, categorie } }
  const [assocTemp, setAssocTemp] = useState({})

  useEffect(() => {
    setMatieres(getMatieres())
    setSessions(getSessions())
    setCours(getCours())
  }, [])

  const joursCol = Array.from({ length: 7 }, (_, i) => addDays(semaineDebut, i))

  // Événements uniques non classés (sans matiereId ET sans categorie)
  const evtsNonClasses = (() => {
    const seen = new Set()
    return cours.filter(c => {
      if ((c.matiereId || c.categorie) || seen.has(c.titre)) return false
      seen.add(c.titre)
      return true
    })
  })()

  // Tous les titres uniques (pour "montrer tout")
  const tousEvtsUniques = (() => {
    const seen = new Set()
    return cours.filter(c => {
      if (seen.has(c.titre)) return false
      seen.add(c.titre)
      return true
    })
  })()

  const evtsPanel = montrerTout ? tousEvtsUniques : evtsNonClasses

  // ── Appliquer les associations du panneau ────────────────────────────────────
  function appliquerAssociations() {
    const mapping = getMappingCours()
    const newMapping = { ...mapping }

    const newCours = cours.map(c => {
      const entry = assocTemp[c.titre]
      if (!entry) return c
      newMapping[normaliser(c.titre)] = { matiereId: entry.matiereId || null, categorie: entry.categorie || null }
      return {
        ...c,
        matiereId: entry.matiereId || c.matiereId || null,
        categorie: entry.categorie || null,
      }
    })

    saveMappingCours(newMapping)
    saveCours(newCours)
    setCours(newCours)
    setAssocTemp({})
    setPanneauOuvert(false)
    setMontrerTout(false)
    toast.success('Associations sauvegardées !')
  }

  function setEntryTemp(titre, champ, val) {
    setAssocTemp(prev => ({
      ...prev,
      [titre]: { ...prev[titre], [champ]: val },
    }))
  }

  function creerMatiere(titreCours) {
    const palette = ['#6C63FF','#FF6584','#43C6AC','#F7971E','#12c2e9','#f64f59','#c471ed','#667eea','#11998e','#fc5c7d']
    const newMat = {
      id: genId(), nom: titreCours,
      couleur: palette[matieres.length % palette.length],
      emoji: '📚', maitrise: 2, heuresTotal: 0,
      dateCreation: new Date().toISOString(), fromImport: true,
    }
    const nouv = [...matieres, newMat]
    saveMatieres(nouv)
    setMatieres(nouv)
    setEntryTemp(titreCours, 'matiereId', newMat.id)
    toast.success(`Matière "${titreCours}" créée`)
  }

  // ── Calendrier : rendu ────────────────────────────────────────────────────────
  function getMatiere(id) { return matieres.find(m => m.id === id) }

  function getCoursDuJour(jour) {
    if (!afficherCours) return []
    return cours.filter(c => c.categorie !== 'ignore' && isSameDay(parseISO(c.debut), jour))
  }
  function getSessionsDuJour(jour) {
    return sessions.filter(s => isSameDay(parseISO(s.date), jour))
  }

  async function genererPlanning() {
    setGeneration(true)
    await new Promise(r => setTimeout(r, 1500))
    const sessEx = getSessions().filter(s => s.terminee)
    const nouv   = generatePlanning(getMatieres(), getExamens(), getDisponibilites(), getPreferences())
    saveSessions([...sessEx, ...nouv])
    setSessions([...sessEx, ...nouv])
    setGeneration(false)
    toast.success(`Planning généré ! ${nouv.length} séances planifiées`)
  }

  const now    = new Date()
  const topNow = (now.getHours() - HEURE_DEBUT + now.getMinutes() / 60) * PX_PAR_HEURE
  const showNow = topNow >= 0 && topNow <= TOTAL_HAUTEUR

  const dateDebut = format(semaineDebut, 'd MMM', { locale: fr })
  const dateFin   = format(addDays(semaineDebut, 6), 'd MMM yyyy', { locale: fr })

  return (
    <div className="page-wrapper page-enter">

      {/* ── Barre d'actions ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h1 className="page-title">Planning</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {cours.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={afficherCours} onChange={e => setAfficherCours(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 14, height: 14 }} />
              Afficher les cours
            </label>
          )}
          <div className="d-flex align-items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => setSemaineDebut(subWeeks(semaineDebut, 1))}><ChevronLeft size={14} /></Button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '0 8px', whiteSpace: 'nowrap' }}>
              {dateDebut} — {dateFin}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setSemaineDebut(addWeeks(semaineDebut, 1))}><ChevronRight size={14} /></Button>
          </div>
          <Button variant="secondary" size="sm" onClick={genererPlanning} disabled={generation}>
            <RefreshCw size={13} className={generation ? 'spin' : ''} /> Regénérer
          </Button>
          <Button variant="default" onClick={genererPlanning} disabled={generation}>
            {generation ? <><RefreshCw size={14} className="spin" /> Génération...</> : <><Zap size={14} /> Générer le planning</>}
          </Button>
          {cours.length > 0 && (
            <Button
              variant="secondary" size="sm"
              onClick={() => { setPanneauOuvert(v => !v); setMontrerTout(false) }}
              style={evtsNonClasses.length > 0 ? { borderColor: 'var(--warning)', color: 'var(--warning)' } : {}}
            >
              <Settings2 size={13} />
              {evtsNonClasses.length > 0 ? `⚠ ${evtsNonClasses.length} à classer` : 'Classer les événements'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Grille calendrier ── */}
      <div className="rf-card" style={{ overflow: 'auto' }}>
        <div style={{ minWidth: 640 }}>

          {/* En-têtes jours */}
          <div style={{
            display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, background: 'var(--card)', zIndex: 20,
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
                    fontSize: 16, fontWeight: 700, color: auj ? '#fff' : 'var(--text-secondary)',
                    width: 28, height: 28, borderRadius: '50%', background: auj ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0',
                  }}>{format(jour, 'd')}</div>
                </div>
              )
            })}
          </div>

          {/* Corps */}
          <div style={{ display: 'flex', position: 'relative' }}>

            {/* Colonne heures */}
            <div style={{ width: 52, flexShrink: 0, position: 'relative', height: TOTAL_HAUTEUR }}>
              {HEURES.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: (h - HEURE_DEBUT) * PX_PAR_HEURE - 8,
                  right: 8, fontSize: 11, color: 'var(--text-muted)', userSelect: 'none', lineHeight: 1,
                }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Colonnes jours */}
            {joursCol.map((jour, j) => {
              const coursJour    = getCoursDuJour(jour)
              const sessionsJour = getSessionsDuJour(jour)
              const auj          = isSameDay(jour, new Date())
              return (
                <div key={j} style={{
                  flex: 1, position: 'relative', height: TOTAL_HAUTEUR,
                  borderLeft: '1px solid var(--border)',
                  background: auj ? 'rgba(108,99,255,0.015)' : 'transparent',
                  minWidth: 0,
                }}>
                  {/* Lignes horaires */}
                  {HEURES.map(h => (
                    <div key={h} style={{ position: 'absolute', top: (h - HEURE_DEBUT) * PX_PAR_HEURE, left: 0, right: 0, height: 1, borderTop: '1px solid var(--border)' }} />
                  ))}
                  {HEURES.map(h => (
                    <div key={`${h}h`} style={{ position: 'absolute', top: (h - HEURE_DEBUT + 0.5) * PX_PAR_HEURE, left: 0, right: 0, height: 1, background: 'var(--border)', opacity: 0.4 }} />
                  ))}

                  {/* Indicateur heure courante */}
                  {auj && showNow && (
                    <div style={{ position: 'absolute', top: topNow, left: 0, right: 0, height: 2, background: 'var(--accent)', zIndex: 5 }}>
                      <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                    </div>
                  )}

                  {/* ── Cours / réunions / événements ── */}
                  {coursJour.map(c => {
                    const mat     = getMatiere(c.matiereId)
                    const top     = topPourISO(c.debut)
                    const hauteur = hauteurEntreDates(c.debut, c.fin)
                    const s       = styleEvenement(c, mat)
                    const hDebut  = format(parseISO(c.debut), 'HH:mm')
                    const hFin    = format(parseISO(c.fin),   'HH:mm')

                    return (
                      <div key={c.id} title={`${c.titreBrut}\n${hDebut}–${hFin}${c.salle ? '\n📍 ' + c.salle : ''}`}
                        style={{
                          position: 'absolute', top, height: hauteur, left: 2, right: 2,
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          borderLeft: `3px solid ${s.bLeft}`,
                          borderRadius: 5, padding: '3px 5px',
                          fontSize: 10, overflow: 'hidden', zIndex: 2, boxSizing: 'border-box', cursor: 'default',
                        }}>
                        <div style={{ fontWeight: 700, color: s.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                          {s.sublabel && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '0 3px', borderRadius: 3, background: `${s.bLeft}28`, flexShrink: 0 }}>
                              {s.sublabel}
                            </span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </div>
                        {hauteur > 30 && (
                          <div style={{ color: s.color, opacity: 0.75, fontSize: 9, marginTop: 1 }}>{hDebut}–{hFin}</div>
                        )}
                        {hauteur > 44 && c.salle && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>📍 {c.salle}</div>
                        )}
                      </div>
                    )
                  })}

                  {/* ── Séances de révision ── */}
                  {sessionsJour.map(s => {
                    const mat = getMatiere(s.matiereId)
                    if (!mat) return null
                    const top     = topPourISO(s.date)
                    const hauteur = hauteurPourMinutes(s.duree)
                    return (
                      <div key={s.id} title={`${mat.nom} — ${s.duree}min${s.phase ? ' · ' + s.phase : ''}`}
                        style={{
                          position: 'absolute', top, height: hauteur, left: 2, right: 2,
                          background: `${mat.couleur}1a`, borderLeft: `3px solid ${mat.couleur}`,
                          borderRadius: 5, padding: '3px 5px',
                          fontSize: 10, opacity: s.terminee ? 0.45 : 1,
                          overflow: 'hidden', zIndex: 1, boxSizing: 'border-box', cursor: 'default',
                        }}>
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

      {/* ── Panneau de classification ── */}
      {panneauOuvert && cours.length > 0 && (
        <div className="rf-card p-4 mt-4" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Classer les événements
              </div>
              <p className="caption" style={{ fontSize: 12 }}>
                Choisissez le type de chaque événement. Les associations sont mémorisées pour les prochaines synchronisations.
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <button
                onClick={() => setMontrerTout(v => !v)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Inter' }}
              >
                {montrerTout ? 'Afficher non classés' : 'Tout afficher'}
              </button>
              <Button variant="secondary" size="sm" onClick={() => { setAssocTemp({}); setPanneauOuvert(false) }}>Annuler</Button>
              <Button variant="default" size="sm" onClick={appliquerAssociations} disabled={Object.keys(assocTemp).length === 0}>
                Sauvegarder
              </Button>
            </div>
          </div>

          {evtsPanel.length === 0 && (
            <p className="caption mt-3" style={{ fontSize: 12 }}>
              Tous les événements sont classés. Cliquez sur "Tout afficher" pour modifier.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {evtsPanel.map(c => {
              const entry    = assocTemp[c.titre] || {}
              const catActuelle = entry.categorie !== undefined ? entry.categorie : (c.categorie || null)
              const matActuelle = entry.matiereId !== undefined ? entry.matiereId : (c.matiereId || '')
              const showMatiere = !catActuelle || catActuelle === 'cours'

              return (
                <div key={c.titre} style={{
                  padding: '10px 12px', background: 'var(--card-elevated)', borderRadius: 8,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {/* Titre de l'événement */}
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {c.titreBrut || c.titre}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Sélecteur de type */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {CATEGORIES.map(cat => {
                        const actif = catActuelle === cat.val
                        return (
                          <button
                            key={cat.val}
                            onClick={() => setEntryTemp(c.titre, 'categorie', cat.val)}
                            style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: actif ? 700 : 400,
                              border: `1.5px solid ${actif ? cat.couleur : 'var(--border)'}`,
                              background: actif ? `${cat.couleur}20` : 'transparent',
                              color: actif ? cat.couleur : 'var(--text-muted)',
                              cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.1s',
                            }}
                          >
                            {cat.emoji} {cat.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Dropdown matière (uniquement pour "cours") */}
                    {showMatiere && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          value={matActuelle}
                          onChange={e => setEntryTemp(c.titre, 'matiereId', e.target.value || null)}
                          className="rf-input"
                          style={{ fontSize: 12, padding: '4px 8px', minWidth: 160 }}
                        >
                          <option value="">— Matière (optionnel) —</option>
                          {matieres.map(m => (
                            <option key={m.id} value={m.id}>{m.emoji} {m.nom}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => creerMatiere(c.titre)}
                          style={{
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'Inter',
                          }}
                        >+ Créer</button>
                      </div>
                    )}

                    {/* Badge état actuel */}
                    {(c.categorie || c.matiereId) && !assocTemp[c.titre] && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {c.categorie
                          ? `${CATEGORIES.find(k => k.val === c.categorie)?.emoji} ${CATEGORIES.find(k => k.val === c.categorie)?.label}`
                          : `📚 ${getMatiere(c.matiereId)?.nom || ''}`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, padding: '0 4px', flexWrap: 'wrap' }}>
        {CATEGORIES.filter(c => c.val !== 'ignore').map(cat => (
          <div key={cat.val} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: `${cat.couleur}40`, border: `1px solid ${cat.couleur}60` }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.emoji} {cat.label}</span>
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
            <Zap size={14} /> Générer mon planning
          </Button>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
