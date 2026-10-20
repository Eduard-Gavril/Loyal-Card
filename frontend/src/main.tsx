import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { useAuthStore, useClientStore } from './store'
import './index.css'

const rootElement = document.getElementById('root')!

// /it and /ro are the Italian and Romanian addresses of the landing: select that language before anything is drawn,
// so the browser's first render matches the HTML that was generated at build time.
const pathLanguage = ({ '/it': 'it', '/ro': 'ro' } as const)[location.pathname.replace(/(.)\/$/, '$1') as '/it' | '/ro']
if (pathLanguage) useClientStore.setState({ language: pathLanguage, languageDetected: true })

// Pages generated at build time say which language they were drawn in (data-lang). When the visitor's language is
// different (or the markup is missing), draw from scratch instead of adopting HTML that would not match.
const drawnIn = rootElement.dataset.lang
const canAdopt = rootElement.hasChildNodes() && (drawnIn === 'any' || drawnIn === useClientStore.getState().language)

// While hydrating, React asks the stores for their *initial* state (the server's view), then checks it against the
// current one. The saved state differs from the initial one for returning visitors, which forces an update before
// the page finished hydrating and makes React throw the generated HTML away. Make both the same object first.
type Adoptable = { getInitialState: () => object; getState: () => object; setState: (s: object, replace: true) => void }
const adoptAsInitial = (store: Adoptable) => {
  const initial = store.getInitialState()
  Object.assign(initial, store.getState())
  store.setState(initial, true)
}

if (canAdopt) {
  adoptAsInitial(useClientStore as unknown as Adoptable)
  adoptAsInitial(useAuthStore as unknown as Adoptable)
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  rootElement.replaceChildren()
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
