import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Upload, BookOpen, ClipboardList, Settings } from 'lucide-react'

const ITEMS = [
  { icon: <LayoutDashboard size={20} />, chemin: '/dashboard' },
  { icon: <Calendar size={20} />, chemin: '/planning' },
  { icon: <Upload size={20} />, chemin: '/import' },
  { icon: <BookOpen size={20} />, chemin: '/matieres' },
  { icon: <ClipboardList size={20} />, chemin: '/devoirs' },
  { icon: <Settings size={20} />, chemin: '/parametres' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}
      className="d-flex d-md-none"
    >
      {ITEMS.map((item) => {
        const actif = location.pathname === item.chemin
        return (
          <NavLink
            key={item.chemin}
            to={item.chemin}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: actif ? 'var(--primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              position: 'relative',
            }}
          >
            {actif && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 3,
                  background: 'var(--primary)',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
            {item.icon}
          </NavLink>
        )
      })}
    </nav>
  )
}
