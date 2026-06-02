import { useState } from 'react'
import EventRow from './EventRow'
import EmptyState from './EmptyState'

const FILTRES = [
  { id: 'tous', label: 'Tous' },
  { id: 'examen', label: 'Examens' },
  { id: 'devoir', label: 'Devoirs' },
  { id: 'cours', label: 'Cours' },
  { id: 'autre', label: 'Autres' },
]

const COLONNES = ['', 'Titre / Lieu', 'Type', 'Date', 'Matière associée', 'Catégorie', 'Séances', '']

export default function EventReviewTable({ evenements, matieres, onChange, onNouvelleMat }) {
  const [filtreActif, setFiltreActif] = useState('tous')

  if (evenements.length === 0) {
    return (
      <EmptyState
        titre="Aucun événement détecté"
        soustitre="Le fichier ICS ne contient aucun événement valide ou reconnaissable."
      />
    )
  }

  function toggleTous(valeur) {
    onChange(evenements.map((e) => ({ ...e, inclus: valeur })))
  }

  function supprimer(id) {
    onChange(evenements.filter((e) => e.id !== id))
  }

  const nbInclus = evenements.filter((e) => e.inclus).length

  const comptes = {
    tous: evenements.length,
    examen: evenements.filter((e) => e.type === 'examen').length,
    devoir: evenements.filter((e) => e.type === 'devoir').length,
    cours: evenements.filter((e) => e.type === 'cours').length,
    autre: evenements.filter((e) => e.type === 'autre').length,
  }

  const evenementsFiltres =
    filtreActif === 'tous' ? evenements : evenements.filter((e) => e.type === filtreActif)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 0,
          overflowX: 'auto',
        }}
      >
        {FILTRES.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltreActif(f.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: filtreActif === f.id ? 600 : 400,
              color: filtreActif === f.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: `2px solid ${filtreActif === f.id ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 20,
                background: filtreActif === f.id ? 'var(--primary-glow)' : 'var(--card-elevated)',
                color: filtreActif === f.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {comptes[f.id]}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {nbInclus} / {evenements.length} événements sélectionnés
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => toggleTous(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--primary)',
              fontFamily: 'Inter',
              padding: '4px 8px',
            }}
          >
            Tout sélectionner
          </button>
          <button
            onClick={() => toggleTous(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'Inter',
              padding: '4px 8px',
            }}
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 90px 120px 160px 100px 90px 28px',
          gap: 10,
          padding: '6px 14px 10px',
        }}
      >
        {COLONNES.map((col, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            {col}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {evenementsFiltres.map((evt, i) => (
          <div
            key={evt.id}
            className="animate-fade-slide"
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            <EventRow
              evenement={evt}
              matieres={matieres}
              onChange={(updated) =>
                onChange(evenements.map((e) => (e.id === updated.id ? updated : e)))
              }
              onSupprimer={supprimer}
              onNouvelleMat={onNouvelleMat}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
