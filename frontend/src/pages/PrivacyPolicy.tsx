import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const { language } = useClientStore()
  const t = getTranslation(language)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t.privacy.title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose prose-blue max-w-none text-gray-900">
            <p className="text-sm text-gray-500 mb-6">
              <strong>{t.privacy.lastUpdated}:</strong> 1 {language === 'ro' ? 'Aprilie' : 'April'} 2026
            </p>

            <h2>{t.privacy.intro.title}</h2>
            <p>{t.privacy.intro.text}</p>

            <h2>{t.privacy.controller.title}</h2>
            <p>
              <strong>{t.privacy.controller.name}:</strong> LoyalCard<br />
              <strong>{t.privacy.controller.email}:</strong> privacy@loyalcard.net<br />
              <strong>{t.privacy.controller.website}:</strong> https://loyalcard.net
            </p>

            <h2>{t.privacy.data.title}</h2>
            <p>{t.privacy.data.text}</p>
            <ul>
              <li><strong>{t.privacy.data.identification.split(':')[0]}:</strong> {t.privacy.data.identification.split(':')[1]}</li>
              <li><strong>{t.privacy.data.usage.split(':')[0]}:</strong> {t.privacy.data.usage.split(':')[1]}</li>
              <li><strong>{t.privacy.data.technical.split(':')[0]}:</strong> {t.privacy.data.technical.split(':')[1]}</li>
              <li><strong>{t.privacy.data.location.split(':')[0]}:</strong> {t.privacy.data.location.split(':')[1]}</li>
            </ul>

            <h2>{t.privacy.purpose.title}</h2>
            <p>{t.privacy.purpose.text}</p>
            <ul>
              <li>{t.privacy.purpose.service}</li>
              <li>{t.privacy.purpose.account}</li>
              <li>{t.privacy.purpose.recovery}</li>
              <li>{t.privacy.purpose.notifications}</li>
              <li>{t.privacy.purpose.improve}</li>
              <li>{t.privacy.purpose.legal}</li>
            </ul>

            <h2>{t.privacy.legal.title}</h2>
            <p>{t.privacy.legal.text}</p>
            <ul>
              <li><strong>{t.privacy.legal.consent.split(':')[0]}:</strong> {t.privacy.legal.consent.split(':')[1]}</li>
              <li><strong>{t.privacy.legal.contract.split(':')[0]}:</strong> {t.privacy.legal.contract.split(':')[1]}</li>
              <li><strong>{t.privacy.legal.legitimate.split(':')[0]}:</strong> {t.privacy.legal.legitimate.split(':')[1]}</li>
            </ul>

            <h2>{t.privacy.sharing.title}</h2>
            <p>{t.privacy.sharing.text}</p>
            <ul>
              <li><strong>{t.privacy.sharing.supabase.split(':')[0]}:</strong> {t.privacy.sharing.supabase.split(':')[1]}</li>
              <li><strong>{t.privacy.sharing.netlify.split(':')[0]}:</strong> {t.privacy.sharing.netlify.split(':')[1]}</li>
              <li><strong>{t.privacy.sharing.merchants.split(':')[0]}:</strong> {t.privacy.sharing.merchants.split(':')[1]}</li>
            </ul>
            <p>{t.privacy.sharing.noSale}</p>

            <h2>{t.privacy.retention.title}</h2>
            <p>{t.privacy.retention.text}</p>

            <h2>{t.privacy.rights.title}</h2>
            <p>{t.privacy.rights.text}</p>
            <ul>
              <li><strong>{t.privacy.rights.access.split(':')[0]}:</strong> {t.privacy.rights.access.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.rectification.split(':')[0]}:</strong> {t.privacy.rights.rectification.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.erasure.split(':')[0]}:</strong> {t.privacy.rights.erasure.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.portability.split(':')[0]}:</strong> {t.privacy.rights.portability.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.objection.split(':')[0]}:</strong> {t.privacy.rights.objection.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.restriction.split(':')[0]}:</strong> {t.privacy.rights.restriction.split(':')[1]}</li>
              <li><strong>{t.privacy.rights.withdraw.split(':')[0]}:</strong> {t.privacy.rights.withdraw.split(':')[1]}</li>
            </ul>
            <p>{t.privacy.rights.contact} <strong>privacy@loyalcard.net</strong></p>

            <h2>{t.privacy.security.title}</h2>
            <p>{t.privacy.security.text}</p>
            <ul>
              <li>{t.privacy.security.encryption}</li>
              <li>{t.privacy.security.rls}</li>
              <li>{t.privacy.security.auth}</li>
              <li>{t.privacy.security.backup}</li>
            </ul>

            <h2>{t.privacy.cookies.title}</h2>
            <p>
              {t.privacy.cookies.text}{' '}
              <button onClick={() => navigate('/cookie-policy')} className="text-primary-600 underline">
                {t.privacy.cookies.link}
              </button>{' '}
              {t.privacy.cookies.forDetails}
            </p>

            <h2>{t.privacy.minors.title}</h2>
            <p>{t.privacy.minors.text}</p>

            <h2>{t.privacy.changes.title}</h2>
            <p>{t.privacy.changes.text}</p>

            <h2>{t.privacy.contact.title}</h2>
            <p>
              {t.privacy.contact.text}<br />
              <strong>{t.privacy.contact.email}:</strong> privacy@loyalcard.net<br />
              <strong>{t.privacy.contact.complaints}:</strong> {t.privacy.contact.complaints.split(':')[1]}
            </p>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 {language === 'ro' ? 'Notă' : 'Note'}:</strong> {t.privacy.note}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
