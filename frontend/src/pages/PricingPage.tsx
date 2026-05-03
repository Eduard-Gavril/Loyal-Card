import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import DarkVeil from '@/components/DarkVeil'

export default function PricingPage() {
  const navigate = useNavigate()
  const { language } = useClientStore()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Helper function for translations
  const t = (ro: string, en: string, it: string) => {
    if (language === 'ro') return ro
    if (language === 'it') return it
    return en
  }

  const plans = [
    {
      name: 'Starter',
      price: 0,
      yearlyPrice: 0,
      badge: t('Gratuit', 'Free', 'Gratis'),
      badgeColor: 'bg-green-500',
      description: t(
        'Perfect pentru a începe',
        'Perfect to get started',
        'Perfetto per iniziare'
      ),
      features: [
        { text: t('1 locație', '1 location', '1 sede'), included: true },
        { text: t('50 clienți activi/lună', '50 active clients/month', '50 clienti attivi/mese'), included: true },
        { text: t('1 regulă loyalty', '1 loyalty rule', '1 regola fedeltà'), included: true },
        { text: t('Scanner QR de bază', 'Basic QR scanner', 'Scanner QR base'), included: true },
        { text: t('Branding LoyalCard', 'LoyalCard branding', 'Branding LoyalCard'), included: true },
        { text: t('Analytics avansate', 'Advanced analytics', 'Analytics avanzate'), included: false },
        { text: t('White-label', 'White-label', 'White-label'), included: false },
      ],
      cta: t('Începe Gratuit', 'Start Free', 'Inizia Gratis'),
      popular: false
    },
    {
      name: 'Business',
      price: 30,
      yearlyPrice: 300, // ~17% discount
      badge: t('Cel mai popular', 'Most Popular', 'Più Popolare'),
      badgeColor: 'bg-primary-500',
      description: t(
        'Pentru afaceri mici și medii',
        'For small and medium businesses',
        'Per piccole e medie imprese'
      ),
      features: [
        { text: t('1 locație', '1 location', '1 sede'), included: true },
        { text: t('300 clienți activi/lună', '300 active clients/month', '300 clienti attivi/mese'), included: true },
        { text: t('Reguli loyalty nelimitate', 'Unlimited loyalty rules', 'Regole fedeltà illimitate'), included: true },
        { text: t('Product management', 'Product management', 'Gestione prodotti'), included: true },
        { text: t('Scanner multi-produs', 'Multi-product scanner', 'Scanner multi-prodotto'), included: true },
        { text: t('Analytics + Export Excel', 'Analytics + Excel export', 'Analytics + Export Excel'), included: true },
        { text: t('White-label (logo propriu)', 'White-label (your logo)', 'White-label (logo proprio)'), included: true },
        { text: t('Support email', 'Email support', 'Supporto email'), included: true },
      ],
      cta: t('Alege Business', 'Choose Business', 'Scegli Business'),
      popular: true
    },
    {
      name: 'Professional',
      price: 60,
      yearlyPrice: 600, // ~17% discount
      badge: t('Avansat', 'Advanced', 'Avanzato'),
      badgeColor: 'bg-blue-500',
      description: t(
        'Pentru catene și francize',
        'For chains and franchises',
        'Per catene e franchising'
      ),
      features: [
        { text: t('3 locații', '3 locations', '3 sedi'), included: true },
        { text: t('1.000 clienți activi/lună', '1,000 active clients/month', '1.000 clienti attivi/mese'), included: true },
        { text: t('Tot din Business +', 'Everything in Business +', 'Tutto in Business +'), included: true },
        { text: t('Multi-level rewards', 'Multi-level rewards', 'Premi multi-livello'), included: true },
        { text: t('Analytics avansate', 'Advanced analytics', 'Analytics avanzate'), included: true },
        { text: t('Acces API', 'API access', 'Accesso API'), included: true },
        { text: t('Support prioritar', 'Priority support', 'Supporto prioritario'), included: true },
      ],
      cta: t('Alege Professional', 'Choose Professional', 'Scegli Professional'),
      popular: false
    },
    {
      name: 'Enterprise',
      price: 149,
      yearlyPrice: 1490, // ~17% discount
      badge: 'Premium',
      badgeColor: 'bg-yellow-500',
      description: t(
        'Pentru afaceri la scară mare',
        'For large-scale businesses',
        'Per grandi aziende'
      ),
      features: [
        { text: t('Locații nelimitate', 'Unlimited locations', 'Sedi illimitate'), included: true },
        { text: t('Clienți nelimitați', 'Unlimited clients', 'Clienti illimitati'), included: true },
        { text: t('Tot din Professional +', 'Everything in Professional +', 'Tutto in Professional +'), included: true },
        { text: t('Integrări personalizate', 'Custom integrations', 'Integrazioni personalizzate'), included: true },
        { text: t('Account manager dedicat', 'Dedicated account manager', 'Account manager dedicato'), included: true },
        { text: t('SLA 99.9%', 'SLA 99.9%', 'SLA 99.9%'), included: true },
        { text: t('Training personal', 'Staff training', 'Formazione staff'), included: true },
      ],
      cta: t('Contactează-ne', 'Contact Us', 'Contattaci'),
      popular: false
    }
  ]

  const addons = [
    {
      name: t('Notificări WhatsApp', 'WhatsApp Notifications', 'Notifiche WhatsApp'),
      price: 9,
      description: t(
        'Trimite notificări automate clienților prin WhatsApp. Aumenta engagement-ul și fidelizarea cu mesaje personalizate.',
        'Send automated notifications to customers via WhatsApp. Increase engagement and retention with personalized messages.',
        'Invia notifiche automatiche ai clienti tramite WhatsApp. Aumenta il coinvolgimento e la fidelizzazione con messaggi personalizzati.'
      ),
      icon: '💬'
    }
  ]

  return (
    <div>
      {/* Dark Section with Animated Background */}
      <div className="relative w-full overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
          />
        </div>

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Floating Back Button */}
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('Înapoi', 'Back', 'Indietro')}
        </button>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
            {t('Planuri Personalizate Pentru Afacerea Ta', 'Custom Plans For Your Business', 'Piani Personalizzati Per La Tua Attività')}
        </h1>
        <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto drop-shadow-lg">
          {t(
            'De la gratuit pentru a începe, la soluții enterprise pentru afaceri mari. Alege planul perfect pentru nevoile tale.',
            'From free to get started, to enterprise solutions for large businesses. Choose the perfect plan for your needs.',
            'Dal gratuito per iniziare, alle soluzioni enterprise per grandi aziende. Scegli il piano perfetto per le tue esigenze.'
          )}
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-purple-200'}`}>
            {t('Lunar', 'Monthly', 'Mensile')}
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-16 h-8 bg-gray-200 rounded-full transition-colors duration-300 hover:bg-gray-300"
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-primary-600 rounded-full transition-transform duration-300 shadow-md ${
              billingCycle === 'yearly' ? 'translate-x-8' : ''
            }`}></div>
          </button>
            <span className={`text-lg font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-purple-200'}`}>
            {t('Anual', 'Yearly', 'Annuale')}
            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              {t('Economisești 17%', 'Save 17%', 'Risparmia 17%')}
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col ${
                plan.popular ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              {/* Badge */}
              <div className={`${plan.badgeColor} text-white text-xs font-bold py-2 px-4 text-center`}>
                {plan.badge}
              </div>

              <div className="p-8 flex flex-col flex-grow">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      €{billingCycle === 'monthly' ? plan.price : Math.round(plan.yearlyPrice / 12)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 ml-2">
                        /{t('lună', 'month', 'mese')}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      €{plan.yearlyPrice} {t('facturat anual', 'billed annually', 'fatturato annualmente')}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => navigate('/contact')}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 mt-auto ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
      </div>

      {/* White Background Section */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Add-ons Section - Compact */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-5xl">{addons[0].icon}</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">{addons[0].name}</h3>
                  <p className="text-sm text-gray-600">{addons[0].description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary-600">
                    +€{addons[0].price}/{t('lună', 'mo', 'mese')}
                  </div>
                  <button
                    onClick={() => navigate('/contact')}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    {t('Solicită Info', 'Request Info', 'Richiedi Info')}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2026 LoyalCard. {t('Toate drepturile rezervate.', 'All rights reserved.', 'Tutti i diritti riservati.')}</p>
        </div>
      </footer>
    </div>
  )
}

