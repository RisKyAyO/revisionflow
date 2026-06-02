import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileCheck, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import ImportDropzone from '../components/ImportDropzone'
import EventReviewTable from '../components/EventReviewTable'
import { parseICSFile, associerMatieres } from '../utils/icsParser'
import {
  getMatieres, saveMatieres, getExamens, saveExamens,
  getSessions, saveSessions,
  getDisponibilites, getPreferences,
  getDevoirs, saveDevoirs,
} from '../utils/storage'
import { generatePlanning } from '../utils/scheduler'
import { toast } from 'sonner'

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

const ETAPES = [
  { numero: 1, label: 'Importer' },
  { numero: 2, label: 'Vérifier' },
  { numero: 3, label: 'Terminé' },
]

export default function Import() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(0)
  const [nomFichier, setNomFichier] = useState('')
  const [evenements, setEvenements] = useState([])
  const [matieres, setMatieres] = useState([])
  const [chargement, setChargement] = useState(false)
  const [erreurParse, setErreurParse] = useState('')
  const [genererSessions, setGenererSessions] = useState(true)
  const [resultat, setResultat] = useState(null)

  useEffect(() => {
    setMatieres(getMatieres())
  }, [])

  function handleFichierCharge(texte, nom) {
    setErreurParse('')
    try {
      const evts = parseICSFile(texte)
      if (evts.length === 0) {
        setErreurParse('Aucun événement trouvé dans ce fichier.')
        return
      }
      const evtsAssocies = associerMatieres(evts, getMatieres())
      setEvenements(evtsAssocies)
      setNomFichier(nom)
      setEtape(1)
    } catch (e) {
      setErreurParse('Fichier invalide ou corrompu. Vérifiez que c\'est bien un fichier .ics valide.')
    }
  }

  function handleNouvelleMat(evtId, nomMat) {
    const palette = ['#6C63FF', '#FF6584', '#4ADE80', '#FBBF24', '#F97316', '#06B6D4', '#EC4899', '#8B5CF6']
    const newMat = {
      id: genId(),
      nom: nomMat,
      couleur: palette[matieres.length % palette.length],
      emoji: '📚',
      maitrise: 2,
      heuresTotal: 0,
      dateCreation: new Date().toISOString(),
    }
    const newMats = [...matieres, newMat]
    saveMatieres(newMats)
    setMatieres(newMats)
    setEvenements((prev) => prev.map((e) => (e.id === evtId ? { ...e, matiereId: newMat.id } : e)))
  }

  async function handleImporter() {
    setChargement(true)
    await new Promise((r) => setTimeout(r, 900))

    const inclus = evenements.filter((e) => e.inclus)
    const examensDetectes = inclus.filter((e) => e.type === 'examen' && e.matiereId)
    const devoirsDetectes = inclus.filter((e) => e.type === 'devoir')

    const examensExistants = getExamens()
    const nouveauxExamens = examensDetectes.map((e) => ({
      id: genId(),
      matiereId: e.matiereId,
      date: e.debut,
      lieu: e.lieu || '',
      notes: e.description || '',
    }))

    const tousExamens = [...examensExistants, ...nouveauxExamens]
    saveExamens(tousExamens)

    const nouveauxDevoirs = devoirsDetectes.map((e) => ({
      id: genId(),
      titre: e.titre,
      matiereId: e.matiereId || null,
      dateRendu: e.debut,
      termine: false,
    }))
    if (nouveauxDevoirs.length > 0) {
      saveDevoirs([...getDevoirs(), ...nouveauxDevoirs])
    }

    let nbSessions = 0
    if (genererSessions && nouveauxExamens.length > 0) {
      const mat = getMatieres()
      const dispo = getDisponibilites()
      const prefs = getPreferences()
      const sessionsExistantes = getSessions().filter((s) => s.terminee)
      const nouvellesSessions = generatePlanning(mat, tousExamens, dispo, prefs)
      saveSessions([...sessionsExistantes, ...nouvellesSessions])
      nbSessions = nouvellesSessions.length
    }

    setResultat({ total: inclus.length, examens: nouveauxExamens.length, devoirs: nouveauxDevoirs.length, sessions: nbSessions })
    setChargement(false)
    setEtape(2)
    toast.success(`Import réussi — ${inclus.length} événements traités`)
  }

  function recommencer() {
    setEtape(0)
    setEvenements([])
    setNomFichier('')
    setResultat(null)
    setErreurParse('')
  }

  const examensInclus = evenements.filter((e) => e.inclus && e.type === 'examen')
  const examensSansMatiere = examensInclus.filter((e) => !e.matiereId)

  return (
    <div className="page-wrapper page-enter">
      <div className="mb-4">
        <h1 className="page-title">Importer un calendrier</h1>
        <p className="caption mt-1" style={{ fontSize: 13 }}>
          Importez votre emploi du temps depuis Hyperplanning, Moodle ou tout autre outil compatible ICS
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 mb-5">
        {ETAPES.map((e, i) => (
          <div key={e.numero} className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: i < etape ? 'var(--success)' : i === etape ? 'var(--primary)' : 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: i <= etape ? '#fff' : 'var(--text-muted)',
                transition: 'background 0.3s ease',
                flexShrink: 0,
              }}
            >
              {i < etape ? '✓' : e.numero}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: i === etape ? 600 : 400,
                color: i === etape ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {e.label}
            </span>
            {i < ETAPES.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  borderRadius: 1,
                  background: i < etape ? 'var(--success)' : 'var(--border)',
                  marginLeft: 4,
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {etape === 0 && (
        <div style={{ maxWidth: 660 }}>
          <div className="rf-card p-4 mb-4">
            <div className="label-upper mb-3">Comment exporter depuis votre outil</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { src: 'Hyperplanning', info: 'Mon Planning → Exporter → Format ICS' },
                { src: 'Moodle', info: 'Calendrier → Exporter → Tous les événements' },
                { src: 'Google Agenda', info: 'Paramètres → Importer / Exporter → Exporter' },
              ].map(({ src, info }) => (
                <div
                  key={src}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: 'var(--card-elevated)',
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: 'var(--primary-glow)',
                      color: 'var(--primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {src}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{info}</span>
                </div>
              ))}
            </div>
          </div>
          <ImportDropzone onFichierCharge={handleFichierCharge} />
          {erreurParse && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                padding: '10px 14px',
                background: 'rgba(255,101,132,0.08)',
                border: '1px solid rgba(255,101,132,0.3)',
                borderRadius: 8,
              }}
            >
              <AlertCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--accent)' }}>{erreurParse}</span>
            </div>
          )}
        </div>
      )}

      {etape === 1 && (
        <div>
          <div
            className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  background: 'var(--primary-glow)',
                  borderRadius: 20,
                  color: 'var(--primary)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <FileCheck size={13} />
                {nomFichier}
              </div>
              <span className="caption">{evenements.length} événements</span>
              <span className="caption">·</span>
              <span className="caption" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {examensInclus.length} examens détectés
              </span>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={genererSessions}
                  onChange={(e) => setGenererSessions(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Générer les séances de révision
                </span>
              </label>
              <Button variant="secondary" size="sm" onClick={recommencer}>
                Rechoisir un fichier
              </Button>
              <Button variant="default" onClick={handleImporter} disabled={chargement}>
                {chargement
                  ? <><RefreshCw size={13} className="spin" /> Import en cours…</>
                  : <>Importer <ArrowRight size={14} /></>
                }
              </Button>
            </div>
          </div>

          {examensSansMatiere.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderLeftWidth: 3,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--warning)' }}>
                {examensSansMatiere.length} examen{examensSansMatiere.length > 1 ? 's' : ''} sans matière associée — assignez une matière pour inclure ces examens dans votre planning.
              </span>
            </div>
          )}

          {matieres.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(108,99,255,0.06)',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--primary)' }}>
                Aucune matière créée — ajoutez d'abord vos matières dans "Mes matières" pour pouvoir associer les événements.
              </span>
            </div>
          )}

          <div className="rf-card p-4" style={{ overflowX: 'auto' }}>
            <EventReviewTable
              evenements={evenements}
              matieres={matieres}
              onChange={setEvenements}
              onNouvelleMat={handleNouvelleMat}
            />
          </div>
        </div>
      )}

      {etape === 2 && resultat && (
        <div style={{ maxWidth: 520 }}>
          <div className="rf-card p-5 text-center animate-fade-slide">
            <div style={{ fontSize: 60, marginBottom: 16 }} className="animate-pop">🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Import réussi !
            </h2>
            <p className="caption mb-5">Votre calendrier a été importé et analysé avec succès.</p>

            <div className="row g-3 mb-5">
              {[
                { valeur: resultat.examens, label: 'Examens ajoutés', couleur: 'var(--accent)' },
                { valeur: resultat.devoirs, label: 'Devoirs ajoutés', couleur: 'var(--warning)' },
                { valeur: resultat.sessions, label: 'Séances créées', couleur: 'var(--success)' },
              ].map(({ valeur, label, couleur }) => (
                <div key={label} className="col-4">
                  <div style={{ padding: '16px 8px', background: 'var(--card-elevated)', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: couleur, lineHeight: 1 }}>{valeur}</div>
                    <div className="caption mt-1">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {resultat.examens === 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--warning)',
                }}
              >
                Aucun examen n'a pu être associé à une matière. Allez dans "Mes matières" pour créer vos matières, puis réimportez.
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button variant="secondary" onClick={recommencer}>
                Importer un autre fichier
              </Button>
              <Button variant="default" onClick={() => navigate('/planning')}>
                Voir le planning
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
