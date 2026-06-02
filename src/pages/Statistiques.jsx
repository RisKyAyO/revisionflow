import { useState, useEffect } from 'react'
import { parseISO, format, subDays, isSameDay, getDay, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import { getMatieres, getExamens, getSessions } from '../utils/storage'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'

const JOURS_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function tooltipStyle() {
  return {
    contentStyle: {
      background: 'var(--card-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      color: 'var(--text-primary)',
      fontSize: 12,
    },
  }
}

export default function Statistiques() {
  const [matieres, setMatieres] = useState([])
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    setMatieres(getMatieres())
    setSessions(getSessions())
  }, [])

  const sessionsTerminees = sessions.filter((s) => s.terminee)

  const donneesPie = matieres
    .map((m) => {
      const heures = sessionsTerminees
        .filter((s) => s.matiereId === m.id)
        .reduce((acc, s) => acc + s.duree / 60, 0)
      return { nom: m.nom, heures: Math.round(heures * 10) / 10, couleur: m.couleur, emoji: m.emoji }
    })
    .filter((d) => d.heures > 0)

  const derniers28Jours = Array.from({ length: 4 }, (_, i) => {
    const debutSem = subDays(new Date(), (3 - i) * 7 + 6)
    const finSem = subDays(new Date(), (3 - i) * 7)
    const label = `S-${3 - i}`
    const count = sessionsTerminees.filter((s) => {
      const d = parseISO(s.date)
      return d >= debutSem && d <= finSem
    }).length
    return { semaine: label, séances: count }
  })

  const donneesJourSemaine = JOURS_LABELS.map((label, idx) => ({
    jour: label,
    séances: sessionsTerminees.filter((s) => getDay(parseISO(s.date)) === idx).length,
  }))

  const totalSeances = donneesJourSemaine.reduce((acc, j) => acc + j.séances, 0)
  const jourLePlusProductif = totalSeances > 0
    ? donneesJourSemaine.reduce((max, j) => j.séances > max.séances ? j : max, donneesJourSemaine[0])
    : { jour: '—', séances: 0 }

  const dureeMoyenne = sessionsTerminees.length > 0
    ? Math.round(sessionsTerminees.reduce((acc, s) => acc + s.duree, 0) / sessionsTerminees.length)
    : 0

  const matLaPlusRevisee = donneesPie.length > 0
    ? donneesPie.reduce((max, m) => m.heures > max.heures ? m : max, donneesPie[0])
    : null

  let streak = 0
  let jourTest = new Date()
  while (true) {
    const adesSeances = sessionsTerminees.some((s) => isSameDay(parseISO(s.date), jourTest))
    if (!adesSeances) break
    streak++
    jourTest = subDays(jourTest, 1)
  }

  const donneesEvolution = matieres.map((m) => ({
    matiere: m.nom,
    couleur: m.couleur,
    maitrise: m.maitrise,
  }))

  const jours365 = Array.from({ length: 52 }, (_, semaine) =>
    Array.from({ length: 7 }, (_, jour) => {
      const date = subDays(new Date(), (51 - semaine) * 7 + (6 - jour))
      const count = sessionsTerminees.filter((s) => isSameDay(parseISO(s.date), date)).length
      return { date, count }
    })
  )

  function getCouleurHeatmap(count) {
    if (count === 0) return 'var(--border)'
    if (count === 1) return 'rgba(108,99,255,0.3)'
    if (count === 2) return 'rgba(108,99,255,0.5)'
    if (count === 3) return 'rgba(108,99,255,0.7)'
    return 'var(--primary)'
  }

  if (matieres.length === 0) {
    return (
      <div className="page-wrapper page-enter">
        <h1 className="page-title mb-4">Statistiques</h1>
        <EmptyState
          titre="Pas encore de données"
          soustitre="Ajoutez des matières et complétez des séances pour voir vos statistiques"
        />
      </div>
    )
  }

  return (
    <div className="page-wrapper page-enter">
      <h1 className="page-title mb-4">Statistiques</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            icone="🏆"
            label="Matière la plus révisée"
            valeur={matLaPlusRevisee ? matLaPlusRevisee.emoji : '—'}
            couleur="var(--warning)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone="📅"
            label="Jour le plus productif"
            valeur={jourLePlusProductif.jour}
            couleur="var(--primary)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone="⏱️"
            label="Durée moyenne"
            valeur={dureeMoyenne}
            unite="min"
            couleur="var(--accent)"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icone="🔥"
            label="Streak actuel"
            valeur={streak}
            unite="jours"
            couleur="var(--success)"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-5">
          <div className="rf-card p-4 h-100">
            <div className="label-upper mb-3">Répartition du temps</div>
            {donneesPie.length === 0 ? (
              <EmptyState titre="Aucune donnée" soustitre="Complétez des séances pour voir la répartition" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donneesPie} dataKey="heures" nameKey="nom" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {donneesPie.map((entry, index) => (
                        <Cell key={index} fill={entry.couleur} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle()} formatter={(v) => [`${v}h`, 'Heures']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {donneesPie.map((d) => (
                    <div key={d.nom} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.couleur }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.emoji} {d.nom}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <div className="rf-card p-4 h-100">
            <div className="label-upper mb-3">Séances complétées par semaine</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={derniers28Jours}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="semaine" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip {...tooltipStyle()} />
                <Bar dataKey="séances" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="rf-card p-4">
            <div className="label-upper mb-3">Activité — 12 dernières semaines</div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 3, paddingBottom: 8 }}>
                {jours365.map((semaine, si) => (
                  <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {semaine.map((jour, ji) => (
                      <div
                        key={ji}
                        title={`${format(jour.date, 'dd MMM yyyy', { locale: fr })} : ${jour.count} séance(s)`}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          background: getCouleurHeatmap(jour.count),
                          cursor: jour.count > 0 ? 'pointer' : 'default',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (jour.count > 0) e.target.style.transform = 'scale(1.3)' }}
                        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span className="caption">Moins</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <div key={n} style={{ width: 12, height: 12, borderRadius: 2, background: getCouleurHeatmap(n) }} />
              ))}
              <span className="caption">Plus</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="rf-card p-4">
            <div className="label-upper mb-3">Niveau de maîtrise actuel</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {matieres.map((m) => {
                const niveau = Math.round(m.maitrise)
                const pourcent = (m.maitrise / 5) * 100
                return (
                  <div key={m.id} style={{ flex: '1 1 200px', padding: 16, background: 'var(--card-elevated)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>{m.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.nom}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pourcent}%`, background: m.couleur, borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span className="caption">{m.maitrise}/5</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map((n) => <span key={n} style={{ fontSize: 10, opacity: n <= niveau ? 1 : 0.2 }}>⭐</span>)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
