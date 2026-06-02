export default function ProgressRing({ valeur = 0, taille = 52, epaisseur = 4, couleur }) {
  const rayon = (taille - epaisseur) / 2
  const circonference = 2 * Math.PI * rayon
  const progression = circonference - (valeur / 100) * circonference
  const couleurFinale = couleur || 'var(--primary)'

  return (
    <svg width={taille} height={taille} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={taille / 2}
        cy={taille / 2}
        r={rayon}
        fill="none"
        stroke="var(--border)"
        strokeWidth={epaisseur}
      />
      <circle
        cx={taille / 2}
        cy={taille / 2}
        r={rayon}
        fill="none"
        stroke={couleurFinale}
        strokeWidth={epaisseur}
        strokeDasharray={circonference}
        strokeDashoffset={progression}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}
