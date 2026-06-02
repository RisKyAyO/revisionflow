import { useState } from 'react'
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from './ui/button'
import ProgressRing from './ProgressRing'
import { LABELS_MAITRISE, COULEURS_MAITRISE } from './MasterySlider'

export default function SubjectCard({ matiere, examen, sessions, onSupprimer, onModifier }) {
  const [ouvert, setOuvert] = useState(false)

  const sessionsMat = sessions.filter((s) => s.matiereId === matiere.id)
  const terminees = sessionsMat.filter((s) => s.terminee).length
  const total = sessionsMat.length
  const pourcent = total > 0 ? Math.round((terminees / total) * 100) : 0

  const joursAvant = examen
    ? differenceInDays(parseISO(examen.date), new Date())
    : null

  const niveauMaitrise = Math.round(matiere.maitrise)
  const couleurMaitrise = COULEURS_MAITRISE[niveauMaitrise] || 'var(--primary)'

  return (
    <div
      className="rf-card animate-fade-slide item-stagger"
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${matiere.couleur}30, ${matiere.couleur}10)`,
          borderBottom: `1px solid ${matiere.couleur}30`,
          padding: '24px 20px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>{matiere.emoji}</div>
        <h3 className="card-title">{matiere.nom}</h3>
        <div className="d-flex align-items-center justify-content-center gap-2 mt-1">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: matiere.couleur }} />
          <span className="caption">{matiere.couleur}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <div className="label-upper mb-1">Maîtrise</div>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ fontSize: 14, opacity: n <= niveauMaitrise ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
            <span className="caption" style={{ color: couleurMaitrise, fontWeight: 600 }}>
              {LABELS_MAITRISE[niveauMaitrise]}
            </span>
          </div>
          <div className="d-flex flex-column align-items-center">
            <ProgressRing valeur={pourcent} couleur={matiere.couleur} taille={52} />
            <span className="caption mt-1">{pourcent}%</span>
          </div>
        </div>

        <div className="divider" />

        <div className="d-flex justify-content-between mb-3">
          <div className="text-center">
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(matiere.heuresTotal)}h
            </div>
            <div className="caption">Révisées</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {terminees}/{total}
            </div>
            <div className="caption">Séances</div>
          </div>
          <div className="text-center">
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: joursAvant === null ? 'var(--text-muted)' : joursAvant < 7 ? 'var(--accent)' : joursAvant < 14 ? 'var(--warning)' : 'var(--success)',
              }}
            >
              {joursAvant !== null ? `J-${joursAvant}` : '—'}
            </div>
            <div className="caption">Examen</div>
          </div>
        </div>

        {examen && (
          <div
            className="rf-badge mb-3 w-100 justify-content-center"
            style={{
              background: 'var(--card-elevated)',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              padding: '6px 12px',
            }}
          >
            📅 {format(parseISO(examen.date), 'dd MMMM yyyy', { locale: fr })}
            {examen.lieu && ` — ${examen.lieu}`}
          </div>
        )}

        <div className="d-flex gap-2">
          <Button variant="secondary" size="sm" className="flex-fill" onClick={() => onModifier(matiere)}>
            <Edit2 size={13} />
            Modifier
          </Button>
          <Button variant="danger" size="sm" className="flex-fill" onClick={() => onSupprimer(matiere.id)}>
            <Trash2 size={13} />
            Supprimer
          </Button>
        </div>

        {sessionsMat.length > 0 && (
          <>
            <button
              onClick={() => setOuvert(!ouvert)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 12,
                padding: 0,
                fontFamily: 'Inter',
              }}
            >
              {ouvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {ouvert ? 'Masquer' : `Voir ${sessionsMat.length} séances`}
            </button>
            {ouvert && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessionsMat.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '6px 10px',
                      background: 'var(--card-elevated)',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      opacity: s.terminee ? 0.5 : 1,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {format(parseISO(s.date), 'EEE dd MMM HH:mm', { locale: fr })}
                    </span>
                    <span style={{ color: s.terminee ? 'var(--success)' : 'var(--text-muted)' }}>
                      {s.terminee ? '✓' : `${s.duree}min`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
