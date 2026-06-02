import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import SubjectCard from '../components/SubjectCard'
import AddSubjectModal from '../components/AddSubjectModal'
import EmptyState from '../components/EmptyState'
import {
  getMatieres, saveMatieres, getExamens, saveExamens, getSessions
} from '../utils/storage'
import { toast } from 'sonner'

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export default function Matieres() {
  const [matieres, setMatieres] = useState([])
  const [examens, setExamens] = useState([])
  const [sessions, setSessions] = useState([])
  const [modalOuverte, setModalOuverte] = useState(false)
  const [matiereModif, setMatiereModif] = useState(null)

  useEffect(() => {
    setMatieres(getMatieres())
    setExamens(getExamens())
    setSessions(getSessions())
  }, [])

  function ajouterMatiere(donneesMatiere, donneesExamen) {
    const nouvelleMatiere = {
      id: genId(),
      heuresTotal: 0,
      dateCreation: new Date().toISOString(),
      ...donneesMatiere,
    }
    const nouvMatieres = [...matieres, nouvelleMatiere]
    setMatieres(nouvMatieres)
    saveMatieres(nouvMatieres)

    if (donneesExamen) {
      const nouvelExamen = {
        id: genId(),
        matiereId: nouvelleMatiere.id,
        ...donneesExamen,
      }
      const nouvExamens = [...examens, nouvelExamen]
      setExamens(nouvExamens)
      saveExamens(nouvExamens)
    }
    toast.success(`${nouvelleMatiere.nom} ajoutée !`)
  }

  function supprimerMatiere(id) {
    const nouvMatieres = matieres.filter((m) => m.id !== id)
    const nouvExamens = examens.filter((e) => e.matiereId !== id)
    setMatieres(nouvMatieres)
    setExamens(nouvExamens)
    saveMatieres(nouvMatieres)
    saveExamens(nouvExamens)
    toast.success('Matière supprimée')
  }

  function modifierMatiere(matiere) {
    setMatiereModif(matiere)
    setModalOuverte(true)
  }

  function enregistrerModification(matiereModifiee) {
    const nouvMatieres = matieres.map((m) => m.id === matiereModifiee.id ? matiereModifiee : m)
    setMatieres(nouvMatieres)
    saveMatieres(nouvMatieres)
    toast.success(`${matiereModifiee.nom} modifiée !`)
  }

  function getExamenMatiere(matiereId) {
    return examens.find((e) => e.matiereId === matiereId) || null
  }

  return (
    <div className="page-wrapper page-enter">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="page-title">Mes matières</h1>
        <Button variant="default" onClick={() => { setMatiereModif(null); setModalOuverte(true) }}>
          <Plus size={15} />
          Ajouter une matière
        </Button>
      </div>

      {matieres.length === 0 ? (
        <EmptyState
          titre="Aucune matière ajoutée"
          soustitre="Commencez par ajouter vos matières pour générer votre planning de révisions personnalisé"
          ctaLabel="Ajouter ma première matière"
          onCta={() => setModalOuverte(true)}
        />
      ) : (
        <div className="row g-3">
          {matieres.map((matiere) => (
            <div key={matiere.id} className="col-12 col-md-6">
              <SubjectCard
                matiere={matiere}
                examen={getExamenMatiere(matiere.id)}
                sessions={sessions}
                onSupprimer={supprimerMatiere}
                onModifier={modifierMatiere}
              />
            </div>
          ))}
        </div>
      )}

      <AddSubjectModal
        ouvert={modalOuverte}
        onFermer={() => { setModalOuverte(false); setMatiereModif(null) }}
        onAjouter={ajouterMatiere}
        onModifier={enregistrerModification}
        matiereAModifier={matiereModif}
      />
    </div>
  )
}
