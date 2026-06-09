import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, BookOpen, BarChart3, Settings, Zap, Upload, ClipboardList } from 'lucide-react'

const NAVIGATION = [
  { icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', chemin: '/dashboard' },
  { icon: <Calendar size={18} />, label: 'Planning', chemin: '/planning' },
  { icon: <Upload size={18} />, label: 'Importer', chemin: '/import' },
  { icon: <BookOpen size={18} />, label: 'Mes matières', chemin: '/matieres' },
  { icon: <ClipboardList size={18} />, label: 'Devoirs à rendre', chemin: '/devoirs' },
  { icon: <BarChart3 size={18} />, label: 'Statistiques', chemin: '/statistiques' },
  { icon: <Settings size={18} />, label: 'Paramètres', chemin: '/parametres' },
]

export default function Sidebar({ sessionsSemaine, sessionsTerminees, coursSemaine }) {
  const location = useLocation()
  const pourcent = sessionsSemaine > 0 ? Math.round((sessionsTerminees / sessionsSemaine) * 100) : 0

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'width 0.3s ease',
      }}
      className="sidebar-full"
    >
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            RevisionFlow
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAVIGATION.map((item) => {
          const actif = location.pathname === item.chemin || (location.pathname === '/' && item.chemin === '/dashboard')
          return (
            <NavLink
              key={item.chemin}
              to={item.chemin}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="animate-slide-right"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  background: actif ? 'var(--primary-glow)' : 'transparent',
                  color: actif ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: actif ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderLeft: `3px solid ${actif ? 'var(--primary)' : 'transparent'}`,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!actif) {
                    e.currentTarget.style.background = 'var(--surface-elevated)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!actif) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <span style={{ opacity: actif ? 1 : 0.7 }}>{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </div>
            </NavLink>
          )
        })}
      </nav>

      <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border)' }} className="sidebar-label">
        <div className="label-upper mb-2">Cette semaine</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 4,
                background: 'var(--border)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pourcent}%`,
                  background: 'var(--primary)',
                  borderRadius: 2,
                  transition: 'width 1s ease',
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {sessionsTerminees}/{sessionsSemaine}
          </span>
        </div>
        <p className="caption mt-1">séances complétées</p>
        {coursSemaine > 0 && (
          <p className="caption mt-1" style={{ color: 'var(--text-muted)' }}>
            {coursSemaine} cours / TD / TP
          </p>
        )}
      </div>
    </aside>
  )
}
