import { useEffect, type ReactNode } from 'react'
import { IosIcon } from '@/components/landing/ios'

interface Props {
  title?: string
  onClose: () => void
  children: ReactNode
  tone?: 'danger'
}

/**
 * Sheet that rises from the bottom on phones and sits centred on larger screens.
 * Like the dialogs it replaces, it closes only through its own buttons, never by
 * tapping outside, so a half-filled form is not lost by accident.
 */
export default function Modal({ title, onClose, children, tone }: Props) {
  // keep the page behind from scrolling while a sheet is open
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="cs-modal-bg" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`cs-sheet${tone === 'danger' ? ' is-danger' : ''}`}>
        <span className="cs-grab" />
        {title && (
          <div className="cs-sheet-head">
            <h3>{title}</h3>
            <button type="button" onClick={onClose} aria-label="Close">
              <IosIcon name="close" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
