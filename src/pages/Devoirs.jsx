import { useState, useEffect } from 'react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, Trash2, Clock, AlertTriangle } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { getDevoirs, saveDevoirs, getMatieres } from '../utils/storage'
import { toast } from 'sonner'

function urgenceDevoir(dateRendu) {
  const d = parseISO(dateRendu)
  const maintenant = new Date()
  const diffJours = Math.ceil((d - maintenant) / (1000 * 60 * 60 * 24))
  if (isPast(d) && !isToday(d)) return 'retard'
  if (diffJours <= 2) return 'urgent'
  if (diffJours <= 7) return 'proche'
  return 'normal'
}

export default function Devoirs() {
  const [devoirs, setDevoirs] = useState([])
  const [matieres, setMatieres] = useState([])
  const [filtre, setFiltre] = useState('actifs')

  useEffect(() => {
    setDevoirs(getDevoirs())
    setMatieres(getMatieres())
  }, [])

  function toggleTermine(id) {
    const updated = devoirs.map((d) => d.id === id ? { ...d, termine: !d.termine } : d)
    setDevoirs(updated)
    saveDevoirs(updated)
    const devoir = updated.find((d) => d.id === id)
    if (devoir.termine) toast.success('Devoir marqué comme rendu !')
  }

  function supprimerDevoir(id) {
    const updated = devoirs.filter((d) => d.id !== id)
    setDevoirs(updated)
    saveDevoirs(updated)
    toast.success('Devoir supprimé')
  }

  function getMatiere(matiereId) {
    return matieres.find((m) => m.id === matiereId) || null
  }

  const devoirsFiltres = devoirs.filter((d) => {
    if (filtre === 'actifs') return !d.termine
    if (filtre === 'termines') return d.termine
    return true
  })

  const nbActifs = devoirs.filter((d) => !d.termine).length
  const nbUrgents = devoirs.filter((d) => !d.termine && d.dateRendu && urgenceDevoir(d.dateRendu) === 'urgent').length
  const nbRetard = devoirs.filter((d) => !d.termine && d.dateRendu && urgenceDevoir(d.dateRendu) === 'retard').length

  return (
    <div className="page-wrapper page-enter">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Devoirs à rendre</h1>
          <p className="caption mt-1" style={{ fontSize: 13 }}>
            Vos travaux à remettre importés depuis Moodle ou ajoutés manuellement
          </p>
        </div>
      </div>

      {(nbUrgents > 0 || nbRetard > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: nbRetard > 0 ? 'rgba(255,101,132,0.08)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${nbRetard > 0 ? 'rgba(255,101,132,0.3)' : 'rgba(251,191,36,0.3)'}`,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            color: nbRetard > 0 ? 'var(--accent)' : 'var(--warning)',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          {nbRetard > 0
            ? `${nbRetard} devoir${nbRetard > 1 ? 's' : ''} en retard !`
            : `${nbUrgents} devoir${nbUrgents > 1 ? 's' : ''} à rendre dans moins de 2 jours`}
        </div>
      )}

      <div className="d-flex align-items-center gap-2 mb-4">
        {[
          { val: 'actifs', label: `À rendre (${nbActifs})` },
          { val: 'termines', label: 'Rendus' },
          { val: 'tous', label: 'Tous' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFiltre(val)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: filtre === val ? 'var(--primary)' : 'transparent',
              color: filtre === val ? '#fff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: filtre === val ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {devoirsFiltres.length === 0 ? (
        <EmptyState
          titre={filtre === 'actifs' ? 'Aucun devoir à rendre' : 'Aucun devoir'}
          soustitre={
            filtre === 'actifs'
              ? 'Importez votre calendrier Moodle pour voir vos devoirs à rendre automatiquement'
              : 'Aucun devoir dans cette catégorie'
          }
          ctaLabel={filtre === 'actifs' ? 'Importer un calendrier' : undefined}
          onCta={filtre === 'actifs' ? () => window.location.assign('/import') : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {devoirsFiltres
            .slice()
            .sort((a, b) => new Date(a.dateRendu) - new Date(b.dateRendu))
            .map((devoir) => {
              const mat = getMatiere(devoir.matiereId)
              const urgence = devoir.dateRendu ? urgenceDevoir(devoir.dateRendu) : 'normal'
              const couleurUrgence = {
                retard: 'var(--accent)',
                urgent: 'var(--warning)',
                proche: '#F4A261',
                normal: 'var(--text-muted)',
              }[urgence]

              return (
                <div
                  key={devoir.id}
                  className="rf-card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    opacity: devoir.termine ? 0.55 : 1,
                    borderLeft: `3px solid ${mat ? mat.couleur : 'var(--border)'}`,
                  }}
                >
                  <button
                    onClick={() => toggleTermine(devoir.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${devoir.termine ? 'var(--success)' : 'var(--border)'}`,
                      background: devoir.termine ? 'var(--success)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {devoir.termine && <Check size={12} color="#fff" strokeWidth={3} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textDecoration: devoir.termine ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {devoir.titre}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      {mat && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '1px 7px',
                            borderRadius: 10,
                            background: `${mat.couleur}20`,
                            color: mat.couleur,
                          }}
                        >
                          {mat.emoji} {mat.nom}
                        </span>
                      )}
                      {devoir.dateRendu && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 11,
                            color: devoir.termine ? 'var(--text-muted)' : couleurUrgence,
                            fontWeight: urgence !== 'normal' && !devoir.termine ? 600 : 400,
                          }}
                        >
                          <Clock size={10} />
                          {urgence === 'retard' && !devoir.termine
                            ? `En retard — ${format(parseISO(devoir.dateRendu), 'dd MMM', { locale: fr })}`
                            : `À rendre le ${format(parseISO(devoir.dateRendu), 'dd MMM yyyy', { locale: fr })}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => supprimerDevoir(devoir.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
