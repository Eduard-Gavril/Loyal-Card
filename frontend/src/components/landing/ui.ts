// Small interface strings: the app screens drawn inside the phone mockups and the feature tiles.
import type { Lang } from './content'

export interface Ui {
  eyebrow: string
  greeting: string
  wallet: string
  allCards: string
  ready: string
  toGo: (n: number) => string
  stampsWord: string
  activity: string
  stampAdded: string
  today: string
  showCode: string
  redeem: string
  hide: string
  tiles: { t: string; d: string }[]
}

export const ui: Record<Lang, Ui> = {
  it: {
    eyebrow: 'Carta fedeltà digitale',
    greeting: 'Buongiorno',
    wallet: 'Il tuo portafoglio',
    allCards: 'Tutte le carte',
    ready: 'Premio pronto',
    toGo: (n) => (n === 1 ? '1 timbro al premio' : `${n} timbri al premio`),
    stampsWord: 'timbri',
    activity: 'Attività recente',
    stampAdded: 'Timbro aggiunto',
    today: 'Oggi',
    showCode: 'Mostra questo codice alla cassa',
    redeem: 'Riscatta',
    hide: 'Nascondi',
    tiles: [
      { t: 'Niente da scaricare.', d: 'Si apre dal telefono. Senza installare nulla, senza carta di plastica.' },
      { t: 'Un QR, un timbro.', d: 'Alla cassa mostri il codice e il timbro arriva subito.' },
      { t: 'Tutte le carte insieme.', d: 'Il bar, il ristorante e il salone nello stesso portafoglio.' },
      { t: 'Il premio si vede subito.', d: 'Quando la carta è piena lo trovi pronto, senza cercarlo.' },
    ],
  },
  en: {
    eyebrow: 'Digital loyalty card',
    greeting: 'Good morning',
    wallet: 'Your wallet',
    allCards: 'All cards',
    ready: 'Reward ready',
    toGo: (n) => `${n} to reward`,
    stampsWord: 'stamps',
    activity: 'Recent activity',
    stampAdded: 'Stamp added',
    today: 'Today',
    showCode: 'Show this code at the till',
    redeem: 'Redeem',
    hide: 'Hide',
    tiles: [
      { t: 'Nothing to download.', d: 'It opens on your phone. No install, no plastic card.' },
      { t: 'One QR, one stamp.', d: 'At the till you show the code and the stamp lands instantly.' },
      { t: 'All your cards together.', d: 'The café, the restaurant and the salon in the same wallet.' },
      { t: 'Your reward is easy to spot.', d: 'When the card is full it is ready and waiting, nothing to hunt for.' },
    ],
  },
  ro: {
    eyebrow: 'Card de fidelitate digital',
    greeting: 'Bună dimineața',
    wallet: 'Portofelul tău',
    allCards: 'Toate cardurile',
    ready: 'Premiu gata',
    toGo: (n) => (n === 1 ? '1 ștampilă până la premiu' : `${n} ștampile până la premiu`),
    stampsWord: 'ștampile',
    activity: 'Activitate recentă',
    stampAdded: 'Ștampilă adăugată',
    today: 'Azi',
    showCode: 'Arată acest cod la casă',
    redeem: 'Valorifică',
    hide: 'Ascunde',
    tiles: [
      { t: 'Nimic de descărcat.', d: 'Se deschide pe telefon. Fără instalare, fără card de plastic.' },
      { t: 'Un QR, o ștampilă.', d: 'La casă arăți codul și ștampila apare pe loc.' },
      { t: 'Toate cardurile la un loc.', d: 'Cafeneaua, restaurantul și salonul în același portofel.' },
      { t: 'Premiul se vede imediat.', d: 'Când cardul e plin, îl găsești gata, fără să-l cauți.' },
    ],
  },
}
