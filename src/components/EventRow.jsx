import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'

const TYPES_CONFIG = {
  examen: { label: 'Examen', couleur: '#FF6584', bg: 'rgba(255,101,132,0.12)' },
  devoir: { label: 'Devoir', couleur: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  cours: { label: 'Cours', couleur: '#8B8BA8', bg: 'rgba(139,139,168,0.12)' },
  autre: { label: 'Autre', couleur: '#4B4B6B', bg: 'rgba(75,75,107,0.2)' },
}

export default function EventRow({ evenement, matieres, onChange, onSupprimer, onNouvelleMat }) {
  const [modeNouvelle, setModeNouvelle] = useState(false)
  const [nomNouvelle, setNomNouvelle] = useState('')

  const config = TYPES_CONFIG[evenement.type] || TYPES_CONFIG.autre
  const date = format(parseISO(evenement.debut), 'EEE dd MMM', { locale: fr })
  const heure = format(parseISO(evenement.debut), 'HH:mm')

  function confirmerNouvelleMat() {
    const nom = nomNouvelle.trim()
    if (nom && onNouvelleMat) {
      onNouvelleMat(evenement.id, nom)
    }
    setModeNouvelle(false)
    setNomNouvelle('')
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 90px 120px 170px 100px 28px',
        gap: 10,
        alignItems: 'center',
        padding: '10px 14px',
        background: evenement.inclus ? 'var(--card-elevated)' : 'transparent',
        borderRadius: 8,
        opacity: evenement.inclus ? 1 : 0.35,
        transition: 'all 0.15s ease',
        borderLeft: `3px solid ${evenement.inclus ? config.couleur : 'var(--border)'}`,
      }}
    >
      <input
        type="checkbox"
        checked={evenement.inclus}
        onChange={(e) => onChange({ ...evenement, inclus: e.target.checked })}
        style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: 'pointer' }}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={evenement.titre}
        >
          {evenement.titre}
        </div>
        {evenement.lieu && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {evenement.lieu}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 20,
          background: config.bg,
          color: config.couleur,
          textAlign: 'center',
          letterSpacing: '0.3px',
        }}
      >
        {config.label}
      </span>

      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{date}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{heure}</div>
      </div>

      {modeNouvelle ? (
        <input
          autoFocus
          value={nomNouvelle}
          onChange={(e) => setNomNouvelle(e.target.value)}
          onBlur={confirmerNouvelleMat}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmerNouvelleMat()
            if (e.key === 'Escape') { setModeNouvelle(false); setNomNouvelle('') }
          }}
          placeholder="Nom de la matière…"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--primary)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 12,
            padding: '5px 8px',
            outline: 'none',
            fontFamily: 'Inter',
            width: '100%',
          }}
        />
      ) : (
        <select
          value={evenement.matiereId || ''}
          onChange={(e) => {
            if (e.target.value === '__nouvelle__') {
              setModeNouvelle(true)
            } else {
              onChange({ ...evenement, matiereId: e.target.value || null })
            }
          }}
          style={{
            background: 'var(--card)',
            border: `1px solid ${evenement.matiereId ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 6,
            color: evenement.matiereId ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 12,
            padding: '5px 8px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Inter',
            width: '100%',
          }}
        >
          <option value="">— Matière —</option>
          {matieres.map((m) => (
            <option key={m.id} value={m.id}>{m.emoji} {m.nom}</option>
          ))}
          <option value="__nouvelle__">+ Nouvelle matière</option>
        </select>
      )}

      <select
        value={evenement.type}
        onChange={(e) => onChange({ ...evenement, type: e.target.value })}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-secondary)',
          fontSize: 12,
          padding: '5px 8px',
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'Inter',
          width: '100%',
        }}
      >
        <option value="examen">Examen</option>
        <option value="devoir">Devoir</option>
        <option value="cours">Cours</option>
        <option value="autre">Autre</option>
      </select>

      <button
        onClick={() => onSupprimer && onSupprimer(evenement.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
