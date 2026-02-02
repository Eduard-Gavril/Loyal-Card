export type Language = 'en' | 'ro'

export const translations = {
  en: {
    // Landing Page
    appName: 'Fidelix',
    hero: {
      title: 'Your loyalty card',
      titleHighlight: 'always with you',
      subtitle: 'Forget plastic cards. Earn points, get rewards and bring your loyalty into the future.',
      getCard: 'Get your Card',
      learnMore: 'Learn More',
      backToTop: 'Back to Top',
    },
    stats: {
      digital: '100% Digital',
      rewards: '∞ Rewards',
      cost: '0€ Cost',
    },
    features: {
      title: 'How it works',
      step1: {
        title: 'Get your digital card',
        description: 'Instant generation, no registration required',
      },
      step2: {
        title: 'Scan at checkout',
        description: 'Show your QR code at each purchase',
      },
      step3: {
        title: 'Collect rewards',
        description: 'Unlock prizes and exclusive benefits',
      },
    },
    footer: {
      info1: '💡 Each card is specific to a store',
      info2: 'Earn points separately at each business',
    },

    // For Who Section
    forWho: {
      title: 'Who is Fidelix for?',
      businesses: {
        title: 'For Businesses',
        subtitle: 'Build customer loyalty without physical cards, apps, or high costs',
        benefit1: 'No physical cards to print',
        benefit2: 'No app for customers to download',
        benefit3: 'Real-time analytics dashboard',
        benefit4: 'Works with any smartphone',
      },
      customers: {
        title: 'For Customers',
        subtitle: 'Collect points with your phone, without downloading anything',
        benefit1: 'No registration required',
        benefit2: 'All cards in one place',
        benefit3: 'Never lose your points',
        benefit4: 'Works offline too',
      },
    },

    // FAQ Section
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'Does it cost anything?',
      a1: 'For customers, Fidelix is completely free. Businesses can start with a generous free tier.',
      q2: 'Do I need to download an app?',
      a2: 'No! Fidelix works directly from your browser. No app to install, no storage space used.',
      q3: 'How do I get my loyalty card?',
      a3: 'Simply visit the store and ask them to scan your QR code. Your card is created automatically.',
      q4: 'Is my data safe?',
      a4: 'Absolutely. We are GDPR compliant and we never sell your data. Your information is encrypted and secure.',
      q5: 'What if I change my phone?',
      a5: 'Your cards are linked to your browser. You can easily transfer them or access them from any device.',
      q6: 'Can I use it at any store?',
      a6: 'Fidelix works at any participating store. Each store has its own loyalty program.',
      q7: 'How do rewards work?',
      a7: 'Each purchase earns you points. When you reach the goal, you unlock rewards that you can redeem at checkout.',
      q8: 'What if the store closes?',
      a8: 'Your points history is always saved. If a store closes, you can still view your past rewards.',
    },

    // Footer
    footerNav: {
      company: 'Company',
      about: 'About Us',
      careers: 'Careers',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
      social: 'Follow Us',
      copyright: '© 2026 Fidelix. All rights reserved.',
      tagline: 'Digital loyalty made simple.',
    },

    // Client Card
    card: {
      title: 'Fidelix',
      subtitle: 'Your digital loyalty card',
      loading: 'Loading...',
      qrTitle: 'Your QR Code',
      qrInfo: '💡 Show this code at the checkout to earn rewards',
      noCard: "You don't have a loyalty card yet",
      generateCard: 'Generate your Loyalty Card',
      addAppleWallet: 'Add to Apple Wallet',
      addGoogleWallet: 'Add to Google Wallet',
      yourRewards: 'Your rewards',
      noProgram: 'No active loyalty program',
      purchases: 'purchases',
      onlyMore: 'Only',
      moreNeeded: 'more!',
      available: 'available',
      reward: 'reward',
      rewards: 'rewards',
      rewardAvailable: 'Reward Earned!',
      showAtCheckout: 'Show this card at checkout to redeem your reward',
      howItWorks: 'How it works',
      howStep1: '📱 Show the QR code at checkout',
      howStep2: '⭐ Earn points with every purchase',
      howStep3: '🎯 Rewards are product-specific',
      howStep4: '💳 Add to Wallet for quick access',
      of: 'of',
      stamp: 'stamp',
      stamps: 'stamps',
    },

    // Client Wallet
    wallet: {
      title: 'Your Cards',
      subtitle: 'Choose the card to show',
      noCards: 'No cards',
      noCardsDesc: "You don't have any loyalty cards yet.\nAsk the store to scan your QR!",
      createNew: 'Create New Card',
      addNew: 'Add New Card',
    },

    // Admin Login
    admin: {
      login: {
        title: 'Fidelix Admin',
        subtitle: 'Manage your loyalty program',
        email: 'Email',
        password: 'Password',
        loginButton: 'Login',
        loggingIn: 'Logging in...',
        backHome: 'Back to Home',
        demoCredentials: 'Demo credentials',
      },

      // Admin Dashboard
      dashboard: {
        title: 'Fidelix Admin',
        logout: 'Logout',
        statsTotal: 'Total Scans',
        statsClients: 'Clients',
        statsRewards: 'Rewards Given',
        statsToday: 'Scans Today',
        quickActions: 'Quick Actions',
        scanQR: 'Scan QR Code',
        viewReports: 'View Reports',
        manageRewards: 'Manage Rewards',
        settings: 'Settings',
        recentActivity: 'Recent Activity',
        inDevelopment: 'Feature in development',
        comingSoon: 'Coming soon: real-time logs, charts and analytics',
      },

      // Admin Scanner
      scanner: {
        title: 'Scan QR Code',
        back: 'Back',
        frameQR: 'Frame the QR code',
        frameDesc: 'Position the customer QR code in the center of the frame',
        cameraInfo: '💡 Allow camera access when prompted',
        qrScanned: 'QR Code Scanned',
        registerPurchase: 'Register Purchase',
        redeemReward: 'Redeem Reward',
        selectProduct: 'Select purchased product',
        noProducts: 'No products available',
        selectReward: 'Select reward to redeem',
        noRewards: 'No rewards available for this card',
        availableRewards: 'Available rewards',
        confirmPurchase: 'Confirm Purchase',
        confirmRedeem: 'Confirm Redemption',
        cancel: 'Cancel',
        registering: 'Registering...',
        redeeming: 'Redeeming...',
        purchaseRegistered: '✓ Purchase Registered!',
        rewardRedeemed: '🎁 Reward Redeemed!',
        rewardEarned: 'Reward Earned!',
        pointsAdded: '✓ Points added to customer card',
        remainingRewards: 'Remaining rewards',
        scanNewClient: 'Scan New Customer',
      },
    },

    common: {
      on: 'on',
      out: 'out of',
    },
  },

  ro: {
    // Landing Page
    appName: 'Fidelix',
    hero: {
      title: 'Cardul tău de fidelitate',
      titleHighlight: 'întotdeauna cu tine',
      subtitle: 'Uită de cardurile de plastic. Acumulează puncte, câștigă premii și adu-ți fidelitatea în viitor.',
      getCard: 'Obține Cardul',
      learnMore: 'Află Mai Mult',
      backToTop: 'Înapoi Sus',
    },
    stats: {
      digital: '100% Digital',
      rewards: '∞ Premii',
      cost: '0€ Cost',
    },
    features: {
      title: 'Cum funcționează',
      step1: {
        title: 'Obține cardul tău digital',
        description: 'Generare instant, fără înregistrare',
      },
      step2: {
        title: 'Scanează la casă',
        description: 'Arată codul QR la fiecare achiziție',
      },
      step3: {
        title: 'Colectează premii',
        description: 'Deblochează premii și beneficii exclusive',
      },
    },
    footer: {
      info1: '💡 Fiecare card este specific unui magazin',
      info2: 'Acumulează puncte separat la fiecare unitate',
    },

    // For Who Section
    forWho: {
      title: 'Pentru cine este Fidelix?',
      businesses: {
        title: 'Pentru Afaceri',
        subtitle: 'Fidelizează clienții fără carduri fizice, aplicații sau costuri ridicate',
        benefit1: 'Fără carduri fizice de printat',
        benefit2: 'Fără aplicație de descărcat',
        benefit3: 'Dashboard cu analize în timp real',
        benefit4: 'Funcționează cu orice smartphone',
      },
      customers: {
        title: 'Pentru Clienți',
        subtitle: 'Acumulează puncte cu telefonul, fără să descarci nimic',
        benefit1: 'Fără înregistrare necesară',
        benefit2: 'Toate cardurile într-un singur loc',
        benefit3: 'Nu îți mai pierzi punctele',
        benefit4: 'Funcționează și offline',
      },
    },

    // FAQ Section
    faq: {
      title: 'Întrebări Frecvente',
      q1: 'Costă ceva?',
      a1: 'Pentru clienți, Fidelix este complet gratuit. Afacerile pot începe cu un plan generos gratuit.',
      q2: 'Trebuie să descarc o aplicație?',
      a2: 'Nu! Fidelix funcționează direct din browser. Fără aplicație de instalat, fără spațiu ocupat.',
      q3: 'Cum îmi obțin cardul de fidelitate?',
      a3: 'Vizitează magazinul și roagă-i să scaneze codul tău QR. Cardul se creează automat.',
      q4: 'Datele mele sunt în siguranță?',
      a4: 'Absolut. Suntem conformi GDPR și nu vindem niciodată datele tale. Informațiile tale sunt criptate și securizate.',
      q5: 'Ce se întâmplă dacă îmi schimb telefonul?',
      a5: 'Cardurile tale sunt legate de browser. Le poți transfera ușor sau accesa de pe orice dispozitiv.',
      q6: 'Pot să-l folosesc la orice magazin?',
      a6: 'Fidelix funcționează la orice magazin participant. Fiecare magazin are propriul program de fidelitate.',
      q7: 'Cum funcționează premiile?',
      a7: 'Fiecare achiziție îți aduce puncte. Când atingi obiectivul, deblochezi premii pe care le poți răscumpăra la casă.',
      q8: 'Ce se întâmplă dacă magazinul se închide?',
      a8: 'Istoricul tău de puncte este întotdeauna salvat. Dacă un magazin se închide, poți vedea în continuare premiile anterioare.',
    },

    // Footer
    footerNav: {
      company: 'Companie',
      about: 'Despre Noi',
      careers: 'Cariere',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Politica de Confidențialitate',
      terms: 'Termeni și Condiții',
      cookies: 'Politica de Cookie-uri',
      social: 'Urmărește-ne',
      copyright: '© 2026 Fidelix. Toate drepturile rezervate.',
      tagline: 'Fidelizare digitală simplificată.',
    },

    // Client Card
    card: {
      title: 'Fidelix',
      subtitle: 'Cardul tău de fidelitate digital',
      loading: 'Se încarcă...',
      qrTitle: 'Codul tău QR',
      qrInfo: '💡 Arată acest cod la casă pentru a acumula premii',
      noCard: 'Nu ai încă un card de fidelitate',
      generateCard: 'Generează Cardul de Fidelitate',
      addAppleWallet: 'Adaugă în Apple Wallet',
      addGoogleWallet: 'Adaugă în Google Wallet',
      yourRewards: 'Premiile tale',
      noProgram: 'Niciun program de fidelitate activ',
      purchases: 'achiziții',
      onlyMore: 'Încă',
      moreNeeded: 'necesar!',
      available: 'disponibil',
      reward: 'premiu',
      rewards: 'premii',
      rewardAvailable: 'Premiu Câștigat!',
      showAtCheckout: 'Arată acest card la casă pentru a răscumpăra premiul',
      howItWorks: 'Cum funcționează',
      howStep1: '📱 Arată codul QR la casă',
      howStep2: '⭐ Acumulează puncte la fiecare achiziție',
      howStep3: '🎯 Premiile sunt specifice produsului',
      howStep4: '💳 Adaugă în Wallet pentru acces rapid',
      of: 'din',
      stamp: 'ștampilă',
      stamps: 'ștampile',
    },

    // Client Wallet
    wallet: {
      title: 'Cardurile Tale',
      subtitle: 'Alege cardul de arătat',
      noCards: 'Niciun card',
      noCardsDesc: 'Nu ai încă niciun card de fidelitate.\nCere magazinului să scaneze QR-ul tău!',
      createNew: 'Creează Card Nou',
      addNew: 'Adaugă Card Nou',
    },

    // Admin Login
    admin: {
      login: {
        title: 'Fidelix Admin',
        subtitle: 'Gestionează programul de fidelitate',
        email: 'Email',
        password: 'Parolă',
        loginButton: 'Autentificare',
        loggingIn: 'Se autentifică...',
        backHome: 'Înapoi la Acasă',
        demoCredentials: 'Credențiale demo',
      },

      // Admin Dashboard
      dashboard: {
        title: 'Fidelix Admin',
        logout: 'Deconectare',
        statsTotal: 'Scanări Totale',
        statsClients: 'Clienți',
        statsRewards: 'Premii Date',
        statsToday: 'Scanări Azi',
        quickActions: 'Acțiuni Rapide',
        scanQR: 'Scanează Cod QR',
        viewReports: 'Vezi Rapoarte',
        manageRewards: 'Gestionează Premii',
        settings: 'Setări',
        recentActivity: 'Activitate Recentă',
        inDevelopment: 'Funcționalitate în dezvoltare',
        comingSoon: 'În curând: log-uri în timp real, grafice și analize',
      },

      // Admin Scanner
      scanner: {
        title: 'Scanează Cod QR',
        back: 'Înapoi',
        frameQR: 'Încadrează codul QR',
        frameDesc: 'Poziționează codul QR al clientului în centrul cadrului',
        cameraInfo: '💡 Permite accesul la cameră când este solicitat',
        qrScanned: 'Cod QR Scanat',
        registerPurchase: 'Înregistrează Achiziție',
        redeemReward: 'Răscumpără Premiu',
        selectProduct: 'Selectează produsul achiziționat',
        noProducts: 'Niciun produs disponibil',
        selectReward: 'Selectează premiul de răscumpărat',
        noRewards: 'Niciun premiu disponibil pentru acest card',
        availableRewards: 'Premii disponibile',
        confirmPurchase: 'Confirmă Achiziția',
        confirmRedeem: 'Confirmă Răscumpărarea',
        cancel: 'Anulează',
        registering: 'Se înregistrează...',
        redeeming: 'Se răscumpără...',
        purchaseRegistered: '✓ Achiziție Înregistrată!',
        rewardRedeemed: '🎁 Premiu Răscumpărat!',
        rewardEarned: 'Premiu Câștigat!',
        pointsAdded: '✓ Puncte adăugate la cardul clientului',
        remainingRewards: 'Premii rămase',
        scanNewClient: 'Scanează Client Nou',
      },
    },

    common: {
      on: 'pe',
      out: 'din',
    },
  },
}

export function getTranslation(lang: Language) {
  return translations[lang]
}
