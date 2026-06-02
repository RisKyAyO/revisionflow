import { useEffect, useState } from 'react'

export default function StatCard({ icone, label, valeur, couleur, unite, tendance }) {
  const [affiche, setAffiche] = useState(0)

  useEffect(() => {
    if (typeof valeur !== 'number') {
      setAffiche(valeur)
      return
    }
    let debut = 0
    const increment = valeur / 30
    const timer = setInterval(() => {
      debut += increment
      if (debut >= valeur) {
        setAffiche(valeur)
        clearInterval(timer)
      } else {
        setAffiche(Math.floor(debut))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [valeur])

  const couleurFinale = couleur || 'var(--primary)'
  const bgIcone = `${couleurFinale}20`

  return (
    <div className="rf-card p-4 animate-fade-slide item-stagger h-100">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 40, height: 40, background: bgIcone, color: couleurFinale, fontSize: 18 }}
        >
          {icone}
        </div>
        {tendance && (
          <span
            className="rf-badge"
            style={{
              background: tendance > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(255,101,132,0.1)',
              color: tendance > 0 ? 'var(--success)' : 'var(--accent)',
              fontSize: 11,
            }}
          >
            {tendance > 0 ? '↑' : '↓'} {Math.abs(tendance)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }} className="animate-count">
        {typeof valeur === 'number' ? affiche : valeur}
        {unite && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>{unite}</span>}
      </div>
      <div className="caption mt-1">{label}</div>
    </div>
  )
}
