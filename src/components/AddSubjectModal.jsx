import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import MasterySlider from './MasterySlider'

const EMOJIS = ['📐', '⚗️', '🌍', '📜', '🧬', '💻', '📖', '🎨', '🎵', '🏛️', '🧪', '📊', '🌱', '🔭', '⚡', '🧮', '📝', '🗺️', '🎭', '🌐']

const COULEURS_PRESET = [
  '#6C63FF', '#FF6584', '#4ADE80', '#FBBF24', '#38BDF8', '#F472B6',
  '#A78BFA', '#34D399', '#FB923C', '#E879F9', '#60A5FA', '#F87171',
]

export default function AddSubjectModal({ ouvert, onFermer, onAjouter, onModifier, matiereAModifier }) {
  const modeEdition = Boolean(matiereAModifier)

  const [nom, setNom] = useState('')
  const [emoji, setEmoji] = useState('📐')
  const [couleur, setCouleur] = useState('#6C63FF')
  const [maitrise, setMaitrise] = useState(3)
  const [ajouterExamen, setAjouterExamen] = useState(false)
  const [dateExamen, setDateExamen] = useState('')
  const [lieuExamen, setLieuExamen] = useState('')

  useEffect(() => {
    if (matiereAModifier) {
      setNom(matiereAModifier.nom || '')
      setEmoji(matiereAModifier.emoji || '📐')
      setCouleur(matiereAModifier.couleur || '#6C63FF')
      setMaitrise(matiereAModifier.maitrise || 3)
      setAjouterExamen(false)
      setDateExamen('')
      setLieuExamen('')
    } else {
      reinitialiser()
    }
  }, [matiereAModifier])

  function reinitialiser() {
    setNom('')
    setEmoji('📐')
    setCouleur('#6C63FF')
    setMaitrise(3)
    setAjouterExamen(false)
    setDateExamen('')
    setLieuExamen('')
  }

  function handleSoumettre() {
    if (!nom.trim()) return
    const donnees = { nom: nom.trim(), emoji, couleur, maitrise }
    if (modeEdition) {
      onModifier({ ...matiereAModifier, ...donnees })
    } else {
      const examen = ajouterExamen && dateExamen ? { date: new Date(dateExamen).toISOString(), lieu: lieuExamen } : null
      onAjouter(donnees, examen)
    }
    reinitialiser()
    onFermer()
  }

  function handleFermer() {
    reinitialiser()
    onFermer()
  }

  return (
    <Dialog open={ouvert} onOpenChange={handleFermer}>
      <DialogContent style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>{modeEdition ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label-upper d-block mb-2">Nom de la matière</label>
            <input
              className="rf-input"
              placeholder="Ex: Mathématiques"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>

          <div>
            <label className="label-upper d-block mb-2">Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    background: emoji === e ? 'var(--primary-glow)' : 'var(--card-elevated)',
                    border: `2px solid ${emoji === e ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    width: 40,
                    height: 40,
                    cursor: 'pointer',
                    fontSize: 20,
                    transition: 'all 0.15s ease',
                    transform: emoji === e ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-upper d-block mb-2">Couleur</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COULEURS_PRESET.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleur(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: `3px solid ${couleur === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    transform: couleur === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: couleur === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <MasterySlider valeur={maitrise} onChange={setMaitrise} />

          {!modeEdition && (
            <>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={ajouterExamen}
                    onChange={(e) => setAjouterExamen(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Ajouter un examen</span>
                </label>
              </div>

              {ajouterExamen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'var(--card-elevated)', borderRadius: 10 }}>
                  <div>
                    <label className="label-upper d-block mb-2">Date de l'examen</label>
                    <input
                      type="date"
                      className="rf-input"
                      value={dateExamen}
                      onChange={(e) => setDateExamen(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="label-upper d-block mb-2">Lieu (optionnel)</label>
                    <input
                      className="rf-input"
                      placeholder="Ex: Amphi A"
                      value={lieuExamen}
                      onChange={(e) => setLieuExamen(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleFermer}>Annuler</Button>
          <Button variant="default" onClick={handleSoumettre} disabled={!nom.trim()}>
            {modeEdition ? 'Enregistrer les modifications' : 'Ajouter la matière'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
