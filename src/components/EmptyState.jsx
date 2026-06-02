import { Button } from './ui/button'

export default function EmptyState({ titre, soustitre, ctaLabel, onCta, illustration }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 animate-fade-slide" style={{ minHeight: 300 }}>
      <div className="mb-4 animate-float">
        {illustration || (
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="rgba(108,99,255,0.08)" stroke="rgba(108,99,255,0.2)" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="20" fill="rgba(108,99,255,0.12)" stroke="rgba(108,99,255,0.3)" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="6" fill="rgba(108,99,255,0.6)" />
            <line x1="40" y1="8" x2="40" y2="18" stroke="rgba(108,99,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="62" x2="40" y2="72" stroke="rgba(108,99,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="40" x2="18" y2="40" stroke="rgba(108,99,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="62" y1="40" x2="72" y2="40" stroke="rgba(108,99,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h3 className="mb-2" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        {titre}
      </h3>
      <p className="caption mb-4" style={{ maxWidth: 300 }}>
        {soustitre}
      </p>
      {ctaLabel && onCta && (
        <Button variant="default" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
