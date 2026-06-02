import { Slider } from './ui/slider'

const LABELS_MAITRISE = {
  1: 'Très difficile',
  2: 'Difficile',
  3: 'Moyen',
  4: 'Bien',
  5: 'Maîtrisé',
}

const COULEURS_MAITRISE = {
  1: '#FF6584',
  2: '#FBBF24',
  3: '#8B8BA8',
  4: '#4ADE80',
  5: '#6C63FF',
}

export default function MasterySlider({ valeur, onChange }) {
  const niveau = Math.round(valeur)
  const couleur = COULEURS_MAITRISE[niveau] || 'var(--primary)'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="label-upper">Niveau de maîtrise</span>
        <span className="rf-badge" style={{ background: `${couleur}20`, color: couleur, fontSize: 12, fontWeight: 600 }}>
          {LABELS_MAITRISE[niveau]}
        </span>
      </div>
      <Slider
        min={1}
        max={5}
        step={1}
        value={[valeur]}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="d-flex justify-content-between mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="caption" style={{ color: n === niveau ? couleur : 'var(--text-muted)' }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

export { LABELS_MAITRISE, COULEURS_MAITRISE }
