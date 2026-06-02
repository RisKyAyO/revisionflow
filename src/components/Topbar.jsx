import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TITRES_PAGES = {
  '/dashboard': 'Tableau de bord',
  '/planning': 'Planning',
  '/matieres': 'Mes matières',
  '/statistiques': 'Statistiques',
  '/parametres': 'Paramètres',
}

export default function Topbar({ pathname }) {
  const titre = TITRES_PAGES[pathname] || 'RevisionFlow'
  const dateAujourdhui = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const dateFormatee = dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(15, 15, 19, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <h1 className="page-title" style={{ fontSize: 20 }}>{titre}</h1>
      <span className="caption" style={{ fontSize: 13 }}>{dateFormatee}</span>
    </header>
  )
}
