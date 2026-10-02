import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useClientStore } from '@/store'

const MESSAGES: Record<string, { title: string; body: string; reload: string }> = {
  en: { title: 'Something went wrong', body: 'This page hit an unexpected error.', reload: 'Reload' },
  it: { title: 'Qualcosa è andato storto', body: 'Questa pagina ha incontrato un errore imprevisto.', reload: 'Ricarica' },
  ro: { title: 'A apărut o eroare', body: 'Această pagină a întâmpinat o eroare neașteptată.', reload: 'Reîncarcă' },
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Without this, any uncaught render error unmounts the whole tree and leaves
// only the page's base background (#242424 — effectively a black screen) with
// no message and no way to recover short of force-closing the app.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      // Plain getState() call, not the hook — this is a class component and
      // may be rendering precisely because something upstream broke.
      const language = useClientStore.getState().language
      const t = MESSAGES[language] || MESSAGES.en
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#242424] px-4">
          <div className="text-center text-white max-w-sm">
            <p className="text-xl font-semibold mb-2">{t.title}</p>
            <p className="text-white/70 mb-6">{t.body}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors"
            >
              {t.reload}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
