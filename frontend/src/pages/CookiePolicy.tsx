import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function CookiePolicy() {
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
          <h1 className="text-2xl font-bold text-gray-900">{t.cookiePolicy.title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose prose-blue max-w-none text-gray-900">
            <p className="text-sm text-gray-500 mb-6">
              <strong>{t.cookiePolicy.lastUpdated}:</strong> 1 {language === 'ro' ? 'Aprilie' : 'April'} 2026
            </p>

            <h2>{t.cookiePolicy.what.title}</h2>
            <p>{t.cookiePolicy.what.text}</p>

            <h2>{t.cookiePolicy.used.title}</h2>
            
            <h3>{t.cookiePolicy.used.essential}</h3>
            <p>{t.cookiePolicy.used.essentialText}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 my-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">{t.cookiePolicy.used.name}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">{t.cookiePolicy.used.purpose}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">{t.cookiePolicy.used.duration}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>{t.cookiePolicy.used.storage}</code></td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.storageDesc}</td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.persistent}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>{t.cookiePolicy.used.consent}</code></td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.consentDesc}</td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.year}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code>{t.cookiePolicy.used.auth}</code></td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.authDesc}</td>
                    <td className="border border-gray-300 px-4 py-2">{t.cookiePolicy.used.session}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>{t.cookiePolicy.used.thirdParty}</h3>
            <p>{t.cookiePolicy.used.noTracking}</p>

            <h2>{t.cookiePolicy.localStorage.title}</h2>
            <p>{t.cookiePolicy.localStorage.text}</p>
            <ul>
              <li><strong>{t.cookiePolicy.localStorage.clientId.split(':')[0]}:</strong> {t.cookiePolicy.localStorage.clientId.split(':')[1]}</li>
              <li><strong>{t.cookiePolicy.localStorage.cards.split(':')[0]}:</strong> {t.cookiePolicy.localStorage.cards.split(':')[1]}</li>
              <li><strong>{t.cookiePolicy.localStorage.language.split(':')[0]}:</strong> {t.cookiePolicy.localStorage.language.split(':')[1]}</li>
              <li><strong>{t.cookiePolicy.localStorage.adminSession.split(':')[0]}:</strong> {t.cookiePolicy.localStorage.adminSession.split(':')[1]}</li>
            </ul>

            <h2>{t.cookiePolicy.manage.title}</h2>
            <p>{t.cookiePolicy.manage.text}</p>
            
            <h3>{t.cookiePolicy.manage.browser}</h3>
            <ul>
              <li><strong>Chrome:</strong> {t.cookiePolicy.manage.chrome}</li>
              <li><strong>Firefox:</strong> {t.cookiePolicy.manage.firefox}</li>
              <li><strong>Safari:</strong> {t.cookiePolicy.manage.safari}</li>
              <li><strong>Edge:</strong> {t.cookiePolicy.manage.edge}</li>
            </ul>

            <h3>{t.cookiePolicy.manage.banner}</h3>
            <p>{t.cookiePolicy.manage.bannerText}</p>

            <h2>{t.cookiePolicy.consequences.title}</h2>
            <p>{t.cookiePolicy.consequences.text}</p>
            <ul>
              <li>{t.cookiePolicy.consequences.noSave}</li>
              <li>{t.cookiePolicy.consequences.newCard}</li>
              <li>{t.cookiePolicy.consequences.noLogin}</li>
            </ul>

            <h2>{t.cookiePolicy.contact.title}</h2>
            <p>
              {t.cookiePolicy.contact.text}<br />
              <strong>{t.cookiePolicy.contact.email}:</strong> privacy@loyalcard.net
            </p>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>🔒 Privacy-First:</strong> {t.cookiePolicy.privacyFirst}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
