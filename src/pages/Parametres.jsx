import { useState, useEffect } from 'react'
import { Save, Download, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Slider } from '../components/ui/slider'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog'
import { getDisponibilites, saveDisponibilites, getPreferences, savePreferences, reinitialiserDonnees, exporterDonnees } from '../utils/storage'
import { toast } from 'sonner'

const JOURS_CONFIG = [
  { cle: 'lundi', label: 'Lundi' },
  { cle: 'mardi', label: 'Mardi' },
  { cle: 'mercredi', label: 'Mercredi' },
  { cle: 'jeudi', label: 'Jeudi' },
  { cle: 'vendredi', label: 'Vendredi' },
  { cle: 'samedi', label: 'Samedi' },
  { cle: 'dimanche', label: 'Dimanche' },
]

const METHODES = [
  { valeur: 'espacee', label: 'Répétition espacée' },
  { valeur: 'intensive', label: 'Révision intensive' },
  { valeur: 'mixte', label: 'Mixte' },
]

export default function Parametres() {
  const [dispo, setDispo] = useState(getDisponibilites())
  const [prefs, setPrefs] = useState(getPreferences())
  const [confirmReset, setConfirmReset] = useState(false)

  function updateDispo(jour, champ, valeur) {
    setDispo((prev) => ({
      ...prev,
      [jour]: { ...prev[jour], [champ]: valeur },
    }))
  }

  function sauvegarder() {
    saveDisponibilites(dispo)
    savePreferences(prefs)
    toast.success('Paramètres sauvegardés !')
  }

  function reset() {
    reinitialiserDonnees()
    setConfirmReset(false)
    toast.success('Données réinitialisées')
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="page-wrapper page-enter">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="page-title">Paramètres</h1>
        <Button variant="default" onClick={sauvegarder}>
          <Save size={14} />
          Sauvegarder
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
        <div className="rf-card p-4">
          <div className="section-title mb-1">Disponibilités</div>
          <p className="caption mb-4">Définissez vos créneaux disponibles pour les révisions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {JOURS_CONFIG.map(({ cle, label }) => (
              <div
                key={cle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  background: 'var(--card-elevated)',
                  borderRadius: 10,
                  flexWrap: 'wrap',
                }}
              >
                <Switch
                  checked={dispo[cle]?.actif || false}
                  onCheckedChange={(v) => updateDispo(cle, 'actif', v)}
                />
                <span style={{ width: 90, fontSize: 14, fontWeight: dispo[cle]?.actif ? 600 : 400, color: dispo[cle]?.actif ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {label}
                </span>
                {dispo[cle]?.actif && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={dispo[cle]?.debut || '09:00'}
                      onChange={(e) => updateDispo(cle, 'debut', e.target.value)}
                      className="rf-input"
                      style={{ width: 100, colorScheme: 'dark' }}
                    />
                    <span className="caption">→</span>
                    <input
                      type="time"
                      value={dispo[cle]?.fin || '18:00'}
                      onChange={(e) => updateDispo(cle, 'fin', e.target.value)}
                      className="rf-input"
                      style={{ width: 100, colorScheme: 'dark' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rf-card p-4">
          <div className="section-title mb-1">Préférences de séance</div>
          <p className="caption mb-4">Configurez la durée et la fréquence de vos révisions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="d-flex justify-content-between mb-2">
                <label className="label-upper">Durée d'une séance</label>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{prefs.dureeSceance} min</span>
              </div>
              <Slider
                min={25}
                max={90}
                step={5}
                value={[prefs.dureeSceance]}
                onValueChange={(v) => setPrefs((p) => ({ ...p, dureeSceance: v[0] }))}
              />
              <div className="d-flex justify-content-between mt-1">
                <span className="caption">25 min</span>
                <span className="caption">90 min</span>
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between mb-2">
                <label className="label-upper">Pause entre les séances</label>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{prefs.pauseEntre} min</span>
              </div>
              <Slider
                min={5}
                max={30}
                step={5}
                value={[prefs.pauseEntre]}
                onValueChange={(v) => setPrefs((p) => ({ ...p, pauseEntre: v[0] }))}
              />
              <div className="d-flex justify-content-between mt-1">
                <span className="caption">5 min</span>
                <span className="caption">30 min</span>
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between mb-2">
                <label className="label-upper">Séances max par jour</label>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{prefs.maxSceancesParJour}</span>
              </div>
              <Slider
                min={1}
                max={6}
                step={1}
                value={[prefs.maxSceancesParJour]}
                onValueChange={(v) => setPrefs((p) => ({ ...p, maxSceancesParJour: v[0] }))}
              />
              <div className="d-flex justify-content-between mt-1">
                <span className="caption">1</span>
                <span className="caption">6</span>
              </div>
            </div>

            <div>
              <label className="label-upper d-block mb-2">Méthode de révision</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {METHODES.map((m) => (
                  <button
                    key={m.valeur}
                    onClick={() => setPrefs((p) => ({ ...p, methode: m.valeur }))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: `2px solid ${prefs.methode === m.valeur ? 'var(--primary)' : 'var(--border)'}`,
                      background: prefs.methode === m.valeur ? 'var(--primary-glow)' : 'var(--card-elevated)',
                      color: prefs.methode === m.valeur ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: prefs.methode === m.valeur ? 600 : 400,
                      fontFamily: 'Inter',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rf-card p-4">
          <div className="section-title mb-1">Données</div>
          <p className="caption mb-4">Gérez vos données personnelles</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={exporterDonnees}>
              <Download size={14} />
              Exporter mes données
            </Button>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              <AlertTriangle size={14} />
              Réinitialiser toutes les données
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle>Confirmer la réinitialisation</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', gap: 12, padding: '12px 0', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Cette action supprimera définitivement toutes vos matières, examens et séances. Les données de démonstration seront rechargées.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Annuler</Button>
            <Button variant="danger" onClick={reset}>Réinitialiser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
