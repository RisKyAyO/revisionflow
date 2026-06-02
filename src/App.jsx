import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Planning from './pages/Planning'
import Import from './pages/Import'
import Matieres from './pages/Matieres'
import Statistiques from './pages/Statistiques'
import Parametres from './pages/Parametres'
import { initialiserDemoData, getSessions, getCours } from './utils/storage'
import { startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import './styles/global.css'
import './styles/animations.css'

function Layout() {
  const location = useLocation()
  const [sessions, setSessions] = useState([])
  const [cours, setCours] = useState([])

  useEffect(() => {
    setSessions(getSessions())
    setCours(getCours())
  }, [location.pathname])

  const debutSemaine = startOfWeek(new Date(), { weekStartsOn: 1 })
  const jours7 = Array.from({ length: 7 }, (_, i) => addDays(debutSemaine, i))

  const sessionsSemaine = sessions.filter((s) =>
    jours7.some((j) => isSameDay(parseISO(s.date), j))
  ).length

  const sessionsTerminees = sessions.filter((s) =>
    s.terminee && jours7.some((j) => isSameDay(parseISO(s.date), j))
  ).length

  const coursSemaine = cours.filter((c) =>
    jours7.some((j) => isSameDay(parseISO(c.debut), j))
  ).length

  return (
    <div className="app-layout">
      <div className="d-none d-md-block">
        <Sidebar sessionsSemaine={sessionsSemaine} sessionsTerminees={sessionsTerminees} coursSemaine={coursSemaine} />
      </div>
      <div className="main-content">
        <Topbar pathname={location.pathname} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/import" element={<Import />} />
          <Route path="/matieres" element={<Matieres />} />
          <Route path="/statistiques" element={<Statistiques />} />
          <Route path="/parametres" element={<Parametres />} />
        </Routes>
      </div>
      <div className="d-md-none">
        <BottomNav />
      </div>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    initialiserDemoData()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
          },
        }}
      />
      <Layout />
    </BrowserRouter>
  )
}
