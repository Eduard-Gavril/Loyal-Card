// Copy written for the landing page itself (hero, steps, example programs).
// Everything else on the page (FAQ, results, footer...) comes straight from lib/i18n.ts.
export type Lang = 'en' | 'it' | 'ro'

export interface Example {
  name: string
  kind: string
  rule: string
  done: number
  total: number
}

export interface Copy {
  nav: { how: string; pricing: string; admin: string; dashboard: string }
  heroA: string
  heroB: string
  sub: string
  cta: string
  cta2: string
  steps: { t: string; d: string }[]
  examplesTitle: string
  examplesSub: string
  bizTitle: string
  bizSub: string
  examples: Example[]
}

export const content: Record<Lang, Copy> = {
  it: {
    nav: { how: 'Come funziona', pricing: 'Prezzi', admin: 'Area negozi', dashboard: 'La mia area' },
    heroA: 'La tua carta fedeltà',
    heroB: 'sempre con te',
    sub: 'La tua carta fedeltà gratuita, sempre sul telefono. Accumula timbri, guadagna premi. Senza carta fisica, senza scaricare app.',
    cta: 'Scopri i partner',
    cta2: 'Come funziona',
    steps: [
      { t: 'Scegli il tuo locale', d: 'Trova il bar, il ristorante o il salone che frequenti tra i partner LoyalCard.' },
      { t: 'Fai timbrare la carta', d: 'Alla cassa mostri il QR code dal telefono e ricevi un timbro a ogni acquisto.' },
      { t: 'Ritira il premio', d: 'Quando la carta è piena mostri la schermata alla cassa e il premio è tuo.' },
    ],
    examplesTitle: 'Programmi fedeltà reali',
    examplesSub: 'Alcuni esempi di come i locali usano LoyalCard.',
    bizTitle: 'Hai un’attività?',
    bizSub: 'Crea il tuo programma fedeltà in due minuti, senza costi di attivazione.',
    examples: [
      { name: 'Café Central', kind: 'Caffetteria', rule: '6 caffè → il 7° è gratis', done: 6, total: 7 },
      { name: 'Bistro Verde', kind: 'Ristorante', rule: '5 piatti principali → dessert gratis o 20% di sconto', done: 5, total: 5 },
      { name: 'Style Salon', kind: 'Parrucchiere', rule: '4 tagli → lavaggio gratis o 30% sul taglio', done: 3, total: 4 },
    ],
  },
  en: {
    nav: { how: 'How it works', pricing: 'Pricing', admin: 'Business area', dashboard: 'My area' },
    heroA: 'Your loyalty card',
    heroB: 'always with you',
    sub: 'Your free loyalty card, always on your phone. Collect stamps, earn loyalty rewards. No plastic card, no app download required.',
    cta: 'Discover partners',
    cta2: 'How it works',
    steps: [
      { t: 'Pick your place', d: 'Find the café, restaurant or salon you visit among the LoyalCard partners.' },
      { t: 'Get your card stamped', d: 'At the till you show the QR code on your phone and get a stamp with every purchase.' },
      { t: 'Collect your reward', d: 'When the card is full, show the screen at the till and the reward is yours.' },
    ],
    examplesTitle: 'Real loyalty programs',
    examplesSub: 'A few examples of how businesses use LoyalCard.',
    bizTitle: 'Run a business?',
    bizSub: 'Create your loyalty program in two minutes, with no setup fees.',
    examples: [
      { name: 'Café Central', kind: 'Coffee shop', rule: 'Buy 6 coffees → the 7th is free', done: 6, total: 7 },
      { name: 'Bistro Verde', kind: 'Restaurant', rule: '5 main dishes → free dessert or 20% off', done: 5, total: 5 },
      { name: 'Style Salon', kind: 'Hair salon', rule: '4 cuts → free wash or 30% off your next cut', done: 3, total: 4 },
    ],
  },
  ro: {
    nav: { how: 'Cum funcționează', pricing: 'Prețuri', admin: 'Zona afaceri', dashboard: 'Contul meu' },
    heroA: 'Cardul tău de fidelitate',
    heroB: 'întotdeauna cu tine',
    sub: 'Cardul tău de fidelitate gratuit, mereu pe telefon. Acumulează timbre, câștigă recompense. Fără card fizic, fără descărcare de aplicație.',
    cta: 'Descoperă parteneri',
    cta2: 'Cum funcționează',
    steps: [
      { t: 'Alege localul tău', d: 'Găsește cafeneaua, restaurantul sau salonul tău printre partenerii LoyalCard.' },
      { t: 'Primește ștampila', d: 'La casă arăți codul QR de pe telefon și primești o ștampilă la fiecare achiziție.' },
      { t: 'Ridică premiul', d: 'Când cardul e plin, arăți ecranul la casă și premiul este al tău.' },
    ],
    examplesTitle: 'Programe de fidelitate reale',
    examplesSub: 'Câteva exemple despre cum folosesc afacerile LoyalCard.',
    bizTitle: 'Ai o afacere?',
    bizSub: 'Creează-ți programul de fidelitate în două minute, fără costuri de activare.',
    examples: [
      { name: 'Café Central', kind: 'Cafenea', rule: 'Cumpără 6 cafele → al 7-lea este gratuit', done: 6, total: 7 },
      { name: 'Bistro Verde', kind: 'Restaurant', rule: '5 mese principale → desert gratuit sau 20% reducere', done: 5, total: 5 },
      { name: 'Style Salon', kind: 'Frizerie', rule: '4 tăieturi → un spălat gratuit sau 30% reducere la tuns', done: 3, total: 4 },
    ],
  },
}
