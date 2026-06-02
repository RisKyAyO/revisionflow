import { useState } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'

const SOURCES = ['Hyperplanning', 'Moodle', 'Google Agenda', 'Outlook', 'Apple Calendar']

export default function ImportDropzone({ onFichierCharge }) {
  const [survol, setSurvol] = useState(false)
  const [erreur, setErreur] = useState('')

  function traiterFichier(fichier) {
    setErreur('')
    if (!fichier || !fichier.name.endsWith('.ics')) {
      setErreur('Seuls les fichiers .ics sont acceptés.')
      return
    }
    const lecteur = new FileReader()
    lecteur.onload = (e) => onFichierCharge(e.target.result, fichier.name)
    lecteur.onerror = () => setErreur('Impossible de lire le fichier.')
    lecteur.readAsText(fichier, 'UTF-8')
  }

  function handleDrop(e) {
    e.preventDefault()
    setSurvol(false)
    traiterFichier(e.dataTransfer.files[0])
  }

  function handleChange(e) {
    traiterFichier(e.target.files[0])
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setSurvol(true) }}
        onDragLeave={() => setSurvol(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '56px 40px',
          border: `2px dashed ${survol ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 16,
          background: survol ? 'var(--primary-glow)' : 'var(--card)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: survol ? 'var(--primary)' : 'var(--card-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: survol ? '0 0 0 8px rgba(108,99,255,0.15)' : 'none',
          }}
        >
          {survol
            ? <Upload size={30} color="#fff" />
            : <FileText size={30} color="var(--primary)" />
          }
        </div>

        <div>
          <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Glissez votre fichier .ics ici
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            ou <span style={{ color: 'var(--primary)', fontWeight: 600 }}>cliquez pour parcourir</span>
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {SOURCES.map((src) => (
            <span
              key={src}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                letterSpacing: '0.3px',
              }}
            >
              {src}
            </span>
          ))}
        </div>

        <input type="file" accept=".ics" onChange={handleChange} style={{ display: 'none' }} />
      </label>

      {erreur && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            padding: '10px 14px',
            background: 'rgba(255,101,132,0.08)',
            border: '1px solid rgba(255,101,132,0.3)',
            borderRadius: 8,
          }}
        >
          <AlertCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--accent)' }}>{erreur}</span>
        </div>
      )}
    </div>
  )
}
