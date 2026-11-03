import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { SIGNUP_OPEN, BUSINESS_TERMS_VERSION } from '@/lib/features'

type Lang = 'en' | 'ro' | 'it'

const TXT: Record<Lang, Record<string, string>> = {
  it: {
    back: 'Home',
    title: 'Crea la tua attività',
    subtitle: 'Gratis con il piano Starter. Ogni richiesta viene controllata prima di andare online.',
    closed: 'La registrazione delle attività non è ancora aperta.',
    name: "Nome dell'attività",
    slug: 'Indirizzo (slug)',
    slugHint: 'Solo lettere minuscole, numeri e trattini. Non si può cambiare dopo la creazione.',
    slugBad: 'Non valido: usa da 3 a 40 caratteri, lettere minuscole, numeri e trattini.',
    slugTaken: 'Questo indirizzo è già in uso.',
    slugOk: 'Disponibile',
    email: 'Email del titolare',
    password: 'Password (almeno 8 caratteri)',
    terms1: 'Ho letto e accetto le ',
    terms2: 'condizioni per le attività e l\'accordo sul trattamento dei dati',
    terms3: ' e la ',
    privacy: 'privacy policy',
    submit: 'Invia la richiesta',
    sending: 'Invio...',
    notice: 'Le richieste vengono valutate manualmente. Se dopo l\'iscrizione non riesci più ad accedere, la richiesta non è stata approvata.',
    doneTitle: 'Controlla la tua email',
    done: 'Ti abbiamo inviato un link di conferma. Aprilo, poi accedi con la tua email e password: potrai configurare la tua attività mentre aspetti l\'approvazione.',
    login: 'Vai al login',
    errEmail: 'Questa email è già registrata. Prova ad accedere.',
    errGeneric: 'Qualcosa è andato storto. Riprova.',
  },
  ro: {
    back: 'Acasă',
    title: 'Creează-ți afacerea',
    subtitle: 'Gratuit cu planul Starter. Fiecare cerere este verificată înainte de a fi publicată.',
    closed: 'Înregistrarea afacerilor nu este încă deschisă.',
    name: 'Numele afacerii',
    slug: 'Adresă (slug)',
    slugHint: 'Doar litere mici, cifre și cratime. Nu se poate schimba după creare.',
    slugBad: 'Invalid: folosește 3-40 de caractere, litere mici, cifre și cratime.',
    slugTaken: 'Această adresă este deja folosită.',
    slugOk: 'Disponibil',
    email: 'Emailul proprietarului',
    password: 'Parolă (minimum 8 caractere)',
    terms1: 'Am citit și accept ',
    terms2: 'condițiile pentru afaceri și acordul de prelucrare a datelor',
    terms3: ' și ',
    privacy: 'politica de confidențialitate',
    submit: 'Trimite cererea',
    sending: 'Se trimite...',
    notice: 'Cererile sunt evaluate manual. Dacă după înscriere nu mai poți accesa contul, cererea nu a fost aprobată.',
    doneTitle: 'Verifică emailul',
    done: 'Ți-am trimis un link de confirmare. Deschide-l, apoi autentifică-te cu emailul și parola: îți poți configura afacerea cât aștepți aprobarea.',
    login: 'Mergi la autentificare',
    errEmail: 'Acest email este deja înregistrat. Încearcă să te autentifici.',
    errGeneric: 'Ceva nu a funcționat. Încearcă din nou.',
  },
  en: {
    back: 'Home',
    title: 'Create your business',
    subtitle: 'Free with the Starter plan. Every request is reviewed before it goes live.',
    closed: 'Business signup is not open yet.',
    name: 'Business name',
    slug: 'Address (slug)',
    slugHint: 'Lowercase letters, numbers and hyphens only. It cannot be changed after creation.',
    slugBad: 'Invalid: use 3-40 characters, lowercase letters, numbers and hyphens.',
    slugTaken: 'This address is already taken.',
    slugOk: 'Available',
    email: "Owner's email",
    password: 'Password (at least 8 characters)',
    terms1: 'I have read and accept the ',
    terms2: 'business terms and the data processing agreement',
    terms3: ' and the ',
    privacy: 'privacy policy',
    submit: 'Send request',
    sending: 'Sending...',
    notice: 'Requests are reviewed manually. If you can no longer sign in after registering, the request was not approved.',
    doneTitle: 'Check your email',
    done: 'We sent you a confirmation link. Open it, then sign in with your email and password: you can set up your business while you wait for approval.',
    login: 'Go to login',
    errEmail: 'This email is already registered. Try signing in.',
    errGeneric: 'Something went wrong. Please try again.',
  },
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export default function BusinessSignup() {
  const { language } = useClientStore()
  const L = TXT[(language as Lang) in TXT ? (language as Lang) : 'en']
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugState, setSlugState] = useState<'idle' | 'checking' | 'ok' | 'bad' | 'taken'>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const seq = useRef(0)

  // never index this page
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'
    m.content = 'noindex'
    document.head.appendChild(m)
    return () => { document.head.removeChild(m) }
  }, [])

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  useEffect(() => {
    if (!slug) { setSlugState('idle'); return }
    const mine = ++seq.current
    setSlugState('checking')
    const timer = setTimeout(async () => {
      const { data, error: err } = await supabase.rpc('check_slug_available', { p_slug: slug })
      if (mine !== seq.current) return
      if (err || !data) { setSlugState('idle'); return }
      setSlugState(!data.valid ? 'bad' : !data.available ? 'taken' : 'ok')
    }, 350)
    return () => clearTimeout(timer)
  }, [slug])

  if (!SIGNUP_OPEN) {
    return (
      <ClientShell back={{ label: L.back, to: '/' }} profile={false} narrow>
        <header className="cs-head">
          <span className="cs-hero-ico"><IosIcon name="store" /></span>
          <h1>{L.title}</h1>
          <p>{L.closed}</p>
        </header>
      </ClientShell>
    )
  }

  const canSubmit =
    !loading && name.trim().length >= 2 && slugState === 'ok' && /\S+@\S+\.\S+/.test(email) && password.length >= 8 && accepted

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
          data: {
            business_name: name.trim(),
            business_slug: slug,
            terms_accepted: true,
            terms_version: BUSINESS_TERMS_VERSION,
            locale: language,
          },
        },
      })
      if (err) throw err
      // An already registered email comes back with no identities (no error, to avoid leaking accounts)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(L.errEmail)
        return
      }
      await supabase.auth.signOut().catch(() => {})
      setDone(true)
    } catch (err: any) {
      setError(/registered|exists/i.test(err?.message || '') ? L.errEmail : L.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <ClientShell back={{ label: L.back, to: '/' }} profile={false} narrow>
        <header className="cs-head">
          <span className="cs-hero-ico"><IosIcon name="mail" /></span>
          <h1>{L.doneTitle}</h1>
          <p>{L.done}</p>
        </header>
        <div className="cs-glass cs-formcard">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/admin/login" className="cs-btn main">{L.login}</Link>
          </div>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell back={{ label: L.back, to: '/' }} profile={false} narrow>
      <header className="cs-head">
        <span className="cs-hero-ico"><IosIcon name="store" /></span>
        <h1>{L.title}</h1>
        <p>{L.subtitle}</p>
      </header>

      <div className="cs-glass cs-formcard">
        <form onSubmit={submit} className="cs-form">
          <div className="cs-field">
            <label htmlFor="biz-name" className="cs-label">{L.name}</label>
            <input id="biz-name" className="cs-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required disabled={loading} />
          </div>

          <div className="cs-field">
            <label htmlFor="biz-slug" className="cs-label">{L.slug}</label>
            <input
              id="biz-slug"
              className="cs-input"
              value={slug}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase()) }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              required
              disabled={loading}
            />
            <p style={{ fontSize: 13, opacity: 0.75, margin: '6px 2px 0' }}>
              {slugState === 'bad' ? L.slugBad : slugState === 'taken' ? L.slugTaken : slugState === 'ok' ? `${L.slugOk}: loyalcard.net/${slug}` : L.slugHint}
            </p>
          </div>

          <div className="cs-field">
            <label htmlFor="biz-email" className="cs-label">{L.email}</label>
            <input id="biz-email" type="email" className="cs-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required disabled={loading} />
          </div>

          <div className="cs-field">
            <label htmlFor="biz-pass" className="cs-label">{L.password}</label>
            <input id="biz-pass" type="password" className="cs-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required disabled={loading} />
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45 }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: 3 }} disabled={loading} />
            <span>
              {L.terms1}
              <a href="/business-terms" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>{L.terms2}</a>
              {L.terms3}
              <a href="/privacy" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>{L.privacy}</a>.
            </span>
          </label>

          <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>{L.notice}</p>

          {error && (
            <div className="cs-alert err" style={{ margin: 0 }}>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={!canSubmit} className="cs-btn main">
            {loading ? L.sending : L.submit}
          </button>
        </form>
      </div>
    </ClientShell>
  )
}
