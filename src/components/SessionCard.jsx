import { useState } from 'react'
import { Check, Clock, Star } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'

export default function SessionCard({ session, matiere, onMarquerFaite }) {
  const [modalOuverte, setModalOuverte] = useState(false)
  const [note, setNote] = useState(0)

  if (!matiere) return null

  const heure = format(parseISO(session.date), 'HH:mm', { locale: fr })

  function confirmer() {
    onMarquerFaite(session.id, note)
    setModalOuverte(false)
    setNote(0)
  }

  return (
    <>
      <div
        className="rf-card p-3 animate-fade-slide item-stagger"
        style={{
          borderLeft: `3px solid ${matiere.couleur}`,
          opacity: session.terminee ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: 22 }}>{matiere.emoji}</span>
            <div>
              <div
                className="card-title"
                style={{ textDecoration: session.terminee ? 'line-through' : 'none' }}
              >
                {matiere.nom}
              </div>
              <div className="d-flex align-items-center gap-2 mt-1">
                <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="caption">{heure}</span>
                <span
                  className="rf-badge rf-badge-primary"
                  style={{ fontSize: 11 }}
                >
                  {session.duree} min
                </span>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {session.terminee ? (
              <div
                className="d-flex align-items-center justify-content-center rounded-circle animate-pop"
                style={{ width: 32, height: 32, background: 'rgba(74,222,128,0.15)' }}
              >
                <Check size={16} style={{ color: 'var(--success)' }} />
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setModalOuverte(true)}>
                Marquer comme fait
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={modalOuverte} onOpenChange={setModalOuverte}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader>
            <DialogTitle>Comment s'est passée la séance ?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-3">
            <span style={{ fontSize: 40 }}>{matiere.emoji}</span>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{matiere.nom}</p>
            <div className="d-flex justify-content-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNote(n)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 28,
                    filter: n <= note ? 'none' : 'grayscale(1) opacity(0.3)',
                    transition: 'filter 0.15s ease, transform 0.15s ease',
                    transform: n === note ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="caption mt-2">
              {note === 0 && 'Évaluez votre compréhension'}
              {note === 1 && 'Très difficile — plus de révisions nécessaires'}
              {note === 2 && 'Difficile — quelques points à revoir'}
              {note === 3 && 'Correct — continuez ainsi'}
              {note === 4 && 'Bien — bonne maîtrise'}
              {note === 5 && 'Excellent — vous maîtrisez le sujet !'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOuverte(false)}>Annuler</Button>
            <Button variant="default" onClick={confirmer} disabled={note === 0}>
              <Check size={14} />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
