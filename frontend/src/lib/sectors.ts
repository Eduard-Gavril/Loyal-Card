// Landing pages for individual business types ("digital loyalty card for cafés", ...).
// Each sector has its own address and its own text per language, so they can rank for searches of that type of business.
// Used by pages/SectorPage.tsx at runtime and by scripts/prerender.mjs + the sitemap at build time.
import type { SeoLang } from './seo'

export type SectorId = 'cafe' | 'barber' | 'street' | 'beauty'

export const SECTOR_IDS: SectorId[] = ['cafe', 'barber', 'street', 'beauty']

export interface SectorCopy {
  path: string
  /** short name for links ("Cafés & bars") */
  label: string
  title: string
  description: string
  keywords: string
  eyebrow: string
  h1a: string
  h1b: string
  sub: string
  benefits: { t: string; d: string }[]
  examples: { name: string; kind: string; rule: string; done: number; total: number }[]
  faq: { q: string; a: string }[]
}

export const sectors: Record<SectorId, Record<SeoLang, SectorCopy>> = {
  cafe: {
    en: {
      path: '/cafe-loyalty-card',
      label: 'Cafés & bars',
      title: 'Digital Loyalty Card for Cafés and Bars | LoyalCard',
      description: 'Free digital stamp card for coffee shops and bars: "buy 6 coffees, the 7th is free" on your customers’ phones. No plastic cards, no app to download.',
      keywords: 'coffee shop loyalty card, digital stamp card cafe, bar loyalty program, free coffee loyalty app, digital punch card coffee',
      eyebrow: 'For cafés and bars',
      h1a: 'The coffee card',
      h1b: 'that never gets lost',
      sub: 'Replace paper stamp cards with a digital one on your customers’ phones. Every coffee is a stamp, the tenth one is on the house.',
      benefits: [
        { t: 'Stamps in two seconds', d: 'The customer shows the QR code, you scan it at the till. No queue, no fumbling for a card at the bottom of a bag.' },
        { t: 'Regulars come back more often', d: 'A card that is always on the phone is a reason to choose your café over the one next door, especially when only one stamp is missing.' },
        { t: 'You know who your regulars are', d: 'See how many customers are active, how often they come in and which rewards get redeemed, without a spreadsheet.' },
      ],
      examples: [
        { name: 'Café Central', kind: 'Coffee', rule: '6 coffees → the 7th is free', done: 6, total: 7 },
        { name: 'Bar Piazza', kind: 'Breakfast', rule: '8 cappuccino + croissant → free breakfast', done: 5, total: 8 },
      ],
      faq: [
        { q: 'Do my customers need to install an app?', a: 'No. The loyalty card works in the phone’s browser and can be added to the home screen. Customers just scan a QR code.' },
        { q: 'Can I set the rule myself, like "buy 9, get the 10th free"?', a: 'Yes. You choose how many stamps are needed and what the reward is, and you can change it later.' },
        { q: 'How much does it cost for a single café?', a: 'There is a free plan with 1 location and up to 50 active customers per month. Paid plans add more locations, more customers and analytics.' },
        { q: 'What happens if a customer gets a new phone?', a: 'The card is tied to the customer’s account, so it can be recovered on the new phone and the stamps are not lost.' },
      ],
    },
    it: {
      path: '/it/carta-fedelta-bar',
      label: 'Bar e caffetterie',
      title: 'Carta Fedeltà Digitale per Bar e Caffetterie | LoyalCard',
      description: 'Tessera a timbri digitale gratuita per bar e caffetterie: "6 caffè, il 7° è gratis" sul telefono dei clienti. Niente carte di plastica, niente app da scaricare.',
      keywords: 'carta fedeltà bar, tessera fedeltà caffetteria, tessera punti bar digitale, programma fedeltà caffè, carta fedeltà digitale gratis',
      eyebrow: 'Per bar e caffetterie',
      h1a: 'La tessera del caffè',
      h1b: 'che non si perde più',
      sub: 'Sostituisci le tessere di carta con una carta digitale sul telefono dei clienti. Ogni caffè è un timbro, il decimo lo offri tu.',
      benefits: [
        { t: 'Timbro in due secondi', d: 'Il cliente mostra il QR code, tu lo scansioni alla cassa. Niente fila, niente tessere dimenticate nel portafoglio.' },
        { t: 'I clienti tornano più spesso', d: 'Una carta sempre sul telefono è un motivo per scegliere il tuo bar invece di quello accanto, soprattutto quando manca un solo timbro.' },
        { t: 'Sai chi sono i tuoi habitué', d: 'Vedi quanti clienti sono attivi, ogni quanto passano e quali premi vengono ritirati, senza fogli di calcolo.' },
      ],
      examples: [
        { name: 'Café Central', kind: 'Caffetteria', rule: '6 caffè → il 7° è gratis', done: 6, total: 7 },
        { name: 'Bar Piazza', kind: 'Colazione', rule: '8 cappuccino + cornetto → colazione gratis', done: 5, total: 8 },
      ],
      faq: [
        { q: 'I miei clienti devono scaricare un’app?', a: 'No. La carta fedeltà funziona nel browser del telefono e si può aggiungere alla schermata Home. Basta scansionare un QR code.' },
        { q: 'Posso impostare io la regola, ad esempio "9 caffè e il decimo è gratis"?', a: 'Sì. Scegli tu quanti timbri servono e qual è il premio, e puoi modificarli in seguito.' },
        { q: 'Quanto costa per un solo bar?', a: 'Esiste un piano gratuito con 1 sede e fino a 50 clienti attivi al mese. I piani a pagamento aggiungono sedi, clienti e statistiche.' },
        { q: 'Cosa succede se il cliente cambia telefono?', a: 'La carta è legata all’account del cliente, quindi si recupera sul nuovo telefono senza perdere i timbri.' },
      ],
    },
    ro: {
      path: '/ro/card-fidelitate-cafenea',
      label: 'Cafenele și baruri',
      title: 'Card de Fidelitate Digital pentru Cafenele și Baruri | LoyalCard',
      description: 'Card digital cu ștampile, gratuit, pentru cafenele și baruri: „6 cafele, a 7-a gratis" direct pe telefonul clienților. Fără carduri de plastic, fără aplicație de descărcat.',
      keywords: 'card fidelitate cafenea, card fidelitate bar, program loialitate cafea, card digital ștampile, card fidelitate gratuit',
      eyebrow: 'Pentru cafenele și baruri',
      h1a: 'Cardul de cafea',
      h1b: 'care nu se mai pierde',
      sub: 'Înlocuiește cardurile de hârtie cu un card digital pe telefonul clienților. Fiecare cafea este o ștampilă, a zecea o oferi tu.',
      benefits: [
        { t: 'Ștampilă în două secunde', d: 'Clientul arată codul QR, tu îl scanezi la casă. Fără coadă, fără carduri uitate prin portofel.' },
        { t: 'Clienții revin mai des', d: 'Un card mereu pe telefon este un motiv să alegă cafeneaua ta, mai ales când mai lipsește o singură ștampilă.' },
        { t: 'Îți cunoști clienții fideli', d: 'Vezi câți clienți sunt activi, cât de des vin și ce recompense sunt ridicate, fără tabele.' },
      ],
      examples: [
        { name: 'Café Central', kind: 'Cafenea', rule: '6 cafele → a 7-a gratis', done: 6, total: 7 },
        { name: 'Bar Piața', kind: 'Mic dejun', rule: '8 cappuccino + croissant → mic dejun gratis', done: 5, total: 8 },
      ],
      faq: [
        { q: 'Clienții mei trebuie să instaleze o aplicație?', a: 'Nu. Cardul funcționează în browserul telefonului și poate fi adăugat pe ecranul principal. Clientul scanează doar un cod QR.' },
        { q: 'Pot stabili singur regula, de exemplu „9 cafele, a 10-a gratis"?', a: 'Da. Alegi tu câte ștampile sunt necesare și care este recompensa, iar le poți schimba oricând.' },
        { q: 'Cât costă pentru o singură cafenea?', a: 'Există un plan gratuit cu 1 locație și până la 50 de clienți activi pe lună. Planurile plătite adaugă locații, clienți și statistici.' },
        { q: 'Ce se întâmplă dacă clientul își schimbă telefonul?', a: 'Cardul este legat de contul clientului, deci poate fi recuperat pe noul telefon fără să se piardă ștampilele.' },
      ],
    },
  },

  barber: {
    en: {
      path: '/barber-hair-salon-loyalty-card',
      label: 'Hairdressers & barbers',
      title: 'Digital Loyalty Card for Hairdressers and Barbers | LoyalCard',
      description: 'Free digital loyalty card for hair salons and barbershops: reward every cut with a stamp and offer a free wash or discount on the fourth visit. No app needed.',
      keywords: 'barber loyalty card, hair salon loyalty program, digital loyalty card hairdresser, barbershop rewards app, salon punch card',
      eyebrow: 'For hairdressers and barbers',
      h1a: 'Turn every cut',
      h1b: 'into a regular',
      sub: 'A digital card that rewards clients for coming back. Four cuts, and the next wash is on you.',
      benefits: [
        { t: 'A reason to book the next visit', d: 'When the card shows 3 of 4 stamps, the client knows exactly when the reward arrives, and books the next appointment with you.' },
        { t: 'Rewards that fit your services', d: 'Free wash, a discount on the cut or on a treatment: you decide what the reward is and how many visits it takes.' },
        { t: 'Simple for the whole team', d: 'Every chair can stamp from a phone or tablet, and you see the activity of all your clients in one place.' },
      ],
      examples: [
        { name: 'Style Salon', kind: 'Hair salon', rule: '4 cuts → free wash or 30% off the cut', done: 3, total: 4 },
        { name: 'The Barber Room', kind: 'Barbershop', rule: '5 haircuts → beard trim free', done: 2, total: 5 },
      ],
      faq: [
        { q: 'Can the reward be a discount instead of a free service?', a: 'Yes. A reward can be a free service, a percentage off, or anything else you choose, and you can offer more than one option.' },
        { q: 'Does it work if I have several chairs or staff members?', a: 'Yes. You can create staff accounts so each person can scan and stamp, while you keep the full picture.' },
        { q: 'Do clients need an account or app?', a: 'No app. They open the card in the browser through a QR code and can add it to their phone’s home screen.' },
        { q: 'Is there a free plan for a small salon?', a: 'Yes: 1 location and up to 50 active clients per month are free. You can move to a paid plan when you grow.' },
      ],
    },
    it: {
      path: '/it/carta-fedelta-parrucchieri',
      label: 'Parrucchieri e barbieri',
      title: 'Carta Fedeltà Digitale per Parrucchieri e Barbieri | LoyalCard',
      description: 'Carta fedeltà digitale gratuita per saloni e barbieri: premia ogni taglio con un timbro e offri un lavaggio o uno sconto alla quarta visita. Senza app.',
      keywords: 'carta fedeltà parrucchiere, tessera fedeltà barbiere, programma fedeltà salone, carta fedeltà digitale parrucchieri, tessera punti barbiere',
      eyebrow: 'Per parrucchieri e barbieri',
      h1a: 'Trasforma ogni taglio',
      h1b: 'in un cliente fisso',
      sub: 'Una carta digitale che premia chi torna. Quattro tagli, e il prossimo lavaggio lo offri tu.',
      benefits: [
        { t: 'Un motivo per prenotare di nuovo', d: 'Quando la carta mostra 3 timbri su 4, il cliente sa esattamente quando arriva il premio e prenota il prossimo appuntamento da te.' },
        { t: 'Premi su misura per i tuoi servizi', d: 'Lavaggio gratis, sconto sul taglio o su un trattamento: decidi tu il premio e quante visite servono.' },
        { t: 'Semplice per tutto il team', d: 'Ogni postazione può timbrare da telefono o tablet e tu vedi l’attività di tutti i clienti in un unico posto.' },
      ],
      examples: [
        { name: 'Style Salon', kind: 'Parrucchiere', rule: '4 tagli → lavaggio gratis o 30% sul taglio', done: 3, total: 4 },
        { name: 'The Barber Room', kind: 'Barbiere', rule: '5 tagli → rifinitura barba gratis', done: 2, total: 5 },
      ],
      faq: [
        { q: 'Il premio può essere uno sconto invece di un servizio gratuito?', a: 'Sì. Il premio può essere un servizio gratuito, uno sconto percentuale o altro, e puoi offrire più di un’opzione.' },
        { q: 'Funziona se ho più postazioni o collaboratori?', a: 'Sì. Puoi creare account staff così che ognuno possa scansionare e timbrare, mentre tu hai il quadro completo.' },
        { q: 'I clienti devono creare un account o scaricare un’app?', a: 'Nessuna app. Aprono la carta nel browser tramite un QR code e possono aggiungerla alla schermata Home.' },
        { q: 'C’è un piano gratuito per un piccolo salone?', a: 'Sì: 1 sede e fino a 50 clienti attivi al mese sono gratuiti. Passi a un piano a pagamento quando cresci.' },
      ],
    },
    ro: {
      path: '/ro/card-fidelitate-frizerie',
      label: 'Frizerii și coafori',
      title: 'Card de Fidelitate Digital pentru Frizerii și Saloane | LoyalCard',
      description: 'Card de fidelitate digital gratuit pentru frizerii și saloane de coafură: recompensează fiecare tuns cu o ștampilă și oferă o spălare sau o reducere la a patra vizită.',
      keywords: 'card fidelitate frizerie, card fidelitate coafor, program loialitate salon, card digital frizerie, card fidelitate gratuit',
      eyebrow: 'Pentru frizerii și coafori',
      h1a: 'Transformă fiecare tuns',
      h1b: 'într-un client fidel',
      sub: 'Un card digital care răsplătește clienții care revin. Patru tunsori, iar următoarea spălare e din partea ta.',
      benefits: [
        { t: 'Un motiv să programeze din nou', d: 'Când cardul arată 3 ștampile din 4, clientul știe exact când primește recompensa și își programează următoarea vizită la tine.' },
        { t: 'Recompense potrivite serviciilor tale', d: 'Spălare gratuită, reducere la tuns sau la un tratament: tu alegi recompensa și câte vizite sunt necesare.' },
        { t: 'Simplu pentru toată echipa', d: 'Fiecare scaun poate ștampila de pe telefon sau tabletă, iar tu vezi activitatea tuturor clienților într-un singur loc.' },
      ],
      examples: [
        { name: 'Style Salon', kind: 'Coafor', rule: '4 tunsori → spălare gratis sau 30% la tuns', done: 3, total: 4 },
        { name: 'The Barber Room', kind: 'Frizerie', rule: '5 tunsori → aranjat barba gratis', done: 2, total: 5 },
      ],
      faq: [
        { q: 'Recompensa poate fi o reducere în loc de un serviciu gratuit?', a: 'Da. Recompensa poate fi un serviciu gratuit, o reducere procentuală sau altceva, și poți oferi mai multe opțiuni.' },
        { q: 'Funcționează dacă am mai multe scaune sau angajați?', a: 'Da. Poți crea conturi de staff, astfel încât fiecare să poată scana și ștampila, iar tu ai imaginea completă.' },
        { q: 'Clienții trebuie să-și facă cont sau să instaleze o aplicație?', a: 'Nu există aplicație. Deschid cardul în browser printr-un cod QR și îl pot adăuga pe ecranul principal.' },
        { q: 'Există un plan gratuit pentru un salon mic?', a: 'Da: 1 locație și până la 50 de clienți activi pe lună sunt gratuite. Treci la un plan plătit când crești.' },
      ],
    },
  },

  street: {
    en: {
      path: '/street-food-loyalty-card',
      label: 'Street food',
      title: 'Digital Loyalty Card for Street Food and Food Trucks | LoyalCard',
      description: 'Free digital loyalty card for street food stalls, food trucks and takeaways: a stamp for every order and a free meal after the last one. Just a QR code.',
      keywords: 'street food loyalty card, food truck loyalty program, takeaway loyalty app, digital stamp card food stall, QR loyalty card',
      eyebrow: 'For street food and food trucks',
      h1a: 'Fast food needs',
      h1b: 'a fast loyalty card',
      sub: 'No app, no sign-up forms in the queue. A QR code on the counter and every order becomes a stamp.',
      benefits: [
        { t: 'Built for a busy counter', d: 'Scanning takes a couple of seconds, so the line keeps moving. The customer does not need to download anything.' },
        { t: 'One QR code, any location', d: 'A stall, a truck or a pop-up at a festival: your customers carry the card with them and you stamp it wherever you are.' },
        { t: 'Bring back the lunch crowd', d: 'Offer a free sandwich, drink or side after a set number of orders and turn the occasional visit into a weekly habit.' },
      ],
      examples: [
        { name: 'Taco Corner', kind: 'Food truck', rule: '5 tacos → a free drink', done: 4, total: 5 },
        { name: 'Panino Express', kind: 'Street food', rule: '8 sandwiches → the 9th is free', done: 6, total: 8 },
      ],
      faq: [
        { q: 'Does it work for a food truck that moves around?', a: 'Yes. All you need is a phone or tablet to scan the customer’s QR code, wherever you are parked.' },
        { q: 'How do customers join?', a: 'They scan a QR code or open the link, pick your business and the card is on their phone. No download is required.' },
        { q: 'Can I run different rewards for different products?', a: 'Yes. Paid plans let you set several loyalty rules and manage products, so rewards can match your menu.' },
        { q: 'Is it really free to start?', a: 'Yes. The free plan covers 1 location and up to 50 active customers per month, with no setup fees.' },
      ],
    },
    it: {
      path: '/it/carta-fedelta-street-food',
      label: 'Street food',
      title: 'Carta Fedeltà Digitale per Street Food e Food Truck | LoyalCard',
      description: 'Carta fedeltà digitale gratuita per street food, food truck e asporto: un timbro a ogni ordine e un pasto gratis dopo l’ultimo. Basta un QR code.',
      keywords: 'carta fedeltà street food, tessera fedeltà food truck, programma fedeltà asporto, tessera a timbri digitale, carta fedeltà QR code',
      eyebrow: 'Per street food e food truck',
      h1a: 'Il cibo è veloce,',
      h1b: 'anche la carta fedeltà',
      sub: 'Niente app, niente moduli in fila. Un QR code sul bancone e ogni ordine diventa un timbro.',
      benefits: [
        { t: 'Pensata per un banco affollato', d: 'La scansione richiede un paio di secondi, quindi la fila scorre. Il cliente non deve scaricare nulla.' },
        { t: 'Un QR code, ovunque tu sia', d: 'Banco, furgone o stand a un festival: i clienti portano la carta con sé e tu la timbri dove ti trovi.' },
        { t: 'Fai tornare la pausa pranzo', d: 'Offri un panino, una bibita o un contorno dopo un certo numero di ordini e trasforma la visita occasionale in un’abitudine settimanale.' },
      ],
      examples: [
        { name: 'Taco Corner', kind: 'Food truck', rule: '5 tacos → una bibita in omaggio', done: 4, total: 5 },
        { name: 'Panino Express', kind: 'Street food', rule: '8 panini → il 9° è gratis', done: 6, total: 8 },
      ],
      faq: [
        { q: 'Funziona per un food truck che si sposta?', a: 'Sì. Serve solo un telefono o un tablet per scansionare il QR code del cliente, ovunque tu sia parcheggiato.' },
        { q: 'Come si iscrivono i clienti?', a: 'Scansionano un QR code o aprono il link, scelgono la tua attività e la carta è sul loro telefono. Nessun download.' },
        { q: 'Posso avere premi diversi per prodotti diversi?', a: 'Sì. I piani a pagamento permettono più regole fedeltà e la gestione dei prodotti, così i premi seguono il tuo menù.' },
        { q: 'È davvero gratuito per iniziare?', a: 'Sì. Il piano gratuito comprende 1 sede e fino a 50 clienti attivi al mese, senza costi di attivazione.' },
      ],
    },
    ro: {
      path: '/ro/card-fidelitate-street-food',
      label: 'Street food',
      title: 'Card de Fidelitate Digital pentru Street Food și Food Truck | LoyalCard',
      description: 'Card de fidelitate digital gratuit pentru street food, food truck și comenzi la pachet: o ștampilă la fiecare comandă și o masă gratis după ultima. Doar un cod QR.',
      keywords: 'card fidelitate street food, program loialitate food truck, card digital ștampile, card fidelitate cod QR, card fidelitate fast food',
      eyebrow: 'Pentru street food și food truck',
      h1a: 'Mâncarea e rapidă,',
      h1b: 'iar cardul de fidelitate la fel',
      sub: 'Fără aplicație, fără formulare la coadă. Un cod QR pe tejghea și fiecare comandă devine o ștampilă.',
      benefits: [
        { t: 'Făcut pentru un punct aglomerat', d: 'Scanarea durează câteva secunde, deci coada înaintează. Clientul nu trebuie să descarce nimic.' },
        { t: 'Un cod QR, oriunde ești', d: 'Chioșc, camion sau stand la un festival: clienții își țin cardul la ei, iar tu îl ștampilezi unde te afli.' },
        { t: 'Readu clienții de la prânz', d: 'Oferă un sandviș, o băutură sau o garnitură după un număr de comenzi și transformă vizita ocazională într-un obicei săptămânal.' },
      ],
      examples: [
        { name: 'Taco Corner', kind: 'Food truck', rule: '5 tacos → o băutură gratis', done: 4, total: 5 },
        { name: 'Panino Express', kind: 'Street food', rule: '8 sandvișuri → al 9-lea gratis', done: 6, total: 8 },
      ],
      faq: [
        { q: 'Funcționează pentru un food truck care se mută?', a: 'Da. Ai nevoie doar de un telefon sau o tabletă pentru a scana codul QR al clientului, oriunde ai parcat.' },
        { q: 'Cum se alătură clienții?', a: 'Scanează un cod QR sau deschid linkul, aleg afacerea ta, iar cardul ajunge pe telefonul lor. Fără descărcări.' },
        { q: 'Pot avea recompense diferite pentru produse diferite?', a: 'Da. Planurile plătite permit mai multe reguli de fidelitate și gestionarea produselor, astfel încât recompensele să urmeze meniul tău.' },
        { q: 'Chiar este gratuit pentru început?', a: 'Da. Planul gratuit include 1 locație și până la 50 de clienți activi pe lună, fără costuri de activare.' },
      ],
    },
  },

  beauty: {
    en: {
      path: '/beauty-nails-loyalty-card',
      label: 'Beauty & nail salons',
      title: 'Digital Loyalty Card for Beauty Salons and Nail Studios | LoyalCard',
      description: 'Free digital loyalty card for beauty centres, nail studios and spas: reward every appointment with a stamp and offer a treatment or discount after a set number of visits.',
      keywords: 'beauty salon loyalty card, nail salon loyalty program, spa rewards app, digital loyalty card beauty, esthetician loyalty program',
      eyebrow: 'For beauty centres and nail studios',
      h1a: 'Appointments that',
      h1b: 'keep coming back',
      sub: 'A digital loyalty card for treatments and manicures. Clients collect a stamp at every visit and earn a reward you choose.',
      benefits: [
        { t: 'Turn one-off clients into regulars', d: 'Manicures and treatments are repeat services. A visible reward gives clients a reason to return to you instead of trying somewhere new.' },
        { t: 'A premium experience, no plastic', d: 'The card looks good on the phone and fits the image of your studio, with your own logo on paid plans.' },
        { t: 'Remind clients with WhatsApp', d: 'With the WhatsApp notifications add-on you can send clients a message when a reward is ready or to bring them back.' },
      ],
      examples: [
        { name: 'Glow Studio', kind: 'Beauty centre', rule: '6 treatments → a facial mask included', done: 4, total: 6 },
        { name: 'Nail Atelier', kind: 'Nail studio', rule: '5 manicures → nail art free', done: 3, total: 5 },
      ],
      faq: [
        { q: 'Can I put my own logo on the card?', a: 'Yes. White-label branding with your own logo is available on the Business plan and above.' },
        { q: 'Can I notify clients when their reward is ready?', a: 'Yes, with the optional WhatsApp notifications add-on you can send automatic messages to your clients.' },
        { q: 'Do clients have to download anything?', a: 'No. The card opens in the phone’s browser from a QR code and can be saved on the home screen.' },
        { q: 'Can I try it before paying?', a: 'Yes. The free plan includes 1 location and up to 50 active clients per month.' },
      ],
    },
    it: {
      path: '/it/carta-fedelta-centri-estetici',
      label: 'Centri estetici e nail',
      title: 'Carta Fedeltà Digitale per Centri Estetici e Nail Studio | LoyalCard',
      description: 'Carta fedeltà digitale gratuita per centri estetici, nail studio e spa: premia ogni appuntamento con un timbro e offri un trattamento o uno sconto dopo un certo numero di visite.',
      keywords: 'carta fedeltà centro estetico, tessera fedeltà nail, programma fedeltà estetista, carta fedeltà digitale beauty, tessera punti centro estetico',
      eyebrow: 'Per centri estetici e nail studio',
      h1a: 'Appuntamenti che',
      h1b: 'tornano sempre',
      sub: 'Una carta fedeltà digitale per trattamenti e manicure. A ogni visita un timbro, e al traguardo il premio che scegli tu.',
      benefits: [
        { t: 'Da clienti occasionali a clienti fisse', d: 'Manicure e trattamenti sono servizi ricorrenti. Un premio ben visibile è un motivo per tornare da te invece di provare altrove.' },
        { t: 'Un’esperienza curata, senza plastica', d: 'La carta è bella sul telefono e in linea con l’immagine del tuo studio, con il tuo logo nei piani a pagamento.' },
        { t: 'Ricorda i clienti con WhatsApp', d: 'Con l’opzione notifiche WhatsApp puoi inviare un messaggio quando il premio è pronto o per riportare le clienti da te.' },
      ],
      examples: [
        { name: 'Glow Studio', kind: 'Centro estetico', rule: '6 trattamenti → maschera viso inclusa', done: 4, total: 6 },
        { name: 'Nail Atelier', kind: 'Nail studio', rule: '5 manicure → nail art in omaggio', done: 3, total: 5 },
      ],
      faq: [
        { q: 'Posso mettere il mio logo sulla carta?', a: 'Sì. Il white-label con il tuo logo è disponibile dal piano Business in su.' },
        { q: 'Posso avvisare le clienti quando il premio è pronto?', a: 'Sì, con l’opzione notifiche WhatsApp puoi inviare messaggi automatici alle tue clienti.' },
        { q: 'Le clienti devono scaricare qualcosa?', a: 'No. La carta si apre nel browser del telefono da un QR code e può essere salvata nella schermata Home.' },
        { q: 'Posso provarlo prima di pagare?', a: 'Sì. Il piano gratuito comprende 1 sede e fino a 50 clienti attivi al mese.' },
      ],
    },
    ro: {
      path: '/ro/card-fidelitate-salon-infrumusetare',
      label: 'Saloane de înfrumusețare',
      title: 'Card de Fidelitate Digital pentru Saloane de Înfrumusețare și Unghii | LoyalCard',
      description: 'Card de fidelitate digital gratuit pentru saloane de înfrumusețare, studiouri de unghii și spa: recompensează fiecare programare cu o ștampilă și oferă un tratament sau o reducere.',
      keywords: 'card fidelitate salon înfrumusețare, card fidelitate manichiură, program loialitate salon unghii, card digital beauty, card fidelitate spa',
      eyebrow: 'Pentru saloane de înfrumusețare și unghii',
      h1a: 'Programări care',
      h1b: 'se tot întorc',
      sub: 'Un card de fidelitate digital pentru tratamente și manichiură. La fiecare vizită o ștampilă, iar la final recompensa aleasă de tine.',
      benefits: [
        { t: 'Din clienți ocazionali în clienți fideli', d: 'Manichiura și tratamentele sunt servicii recurente. O recompensă vizibilă este un motiv să revină la tine, nu să încerce în altă parte.' },
        { t: 'O experiență îngrijită, fără plastic', d: 'Cardul arată bine pe telefon și se potrivește imaginii studioului tău, cu logo-ul tău în planurile plătite.' },
        { t: 'Reamintește clienților prin WhatsApp', d: 'Cu opțiunea de notificări WhatsApp poți trimite un mesaj când recompensa este gata sau pentru a readuce clienții.' },
      ],
      examples: [
        { name: 'Glow Studio', kind: 'Salon beauty', rule: '6 tratamente → mască facială inclusă', done: 4, total: 6 },
        { name: 'Nail Atelier', kind: 'Studio de unghii', rule: '5 manichiuri → nail art gratis', done: 3, total: 5 },
      ],
      faq: [
        { q: 'Pot pune propriul logo pe card?', a: 'Da. White-label cu logo-ul tău este disponibil începând cu planul Business.' },
        { q: 'Pot anunța clienții când recompensa este gata?', a: 'Da, cu opțiunea de notificări WhatsApp poți trimite mesaje automate clienților tăi.' },
        { q: 'Clienții trebuie să descarce ceva?', a: 'Nu. Cardul se deschide în browserul telefonului dintr-un cod QR și poate fi salvat pe ecranul principal.' },
        { q: 'Pot încerca înainte să plătesc?', a: 'Da. Planul gratuit include 1 locație și până la 50 de clienți activi pe lună.' },
      ],
    },
  },
}

export interface SectorRoute { id: SectorId; lang: SeoLang; path: string }

/** Every sector page in every language. */
export const SECTOR_ROUTES: SectorRoute[] = SECTOR_IDS.flatMap((id) =>
  (['en', 'it', 'ro'] as SeoLang[]).map((lang) => ({ id, lang, path: sectors[id][lang].path })),
)

export function sectorForPath(pathname: string): SectorRoute | undefined {
  const p = pathname.replace(/(.)\/$/, '$1')
  return SECTOR_ROUTES.find((r) => r.path === p)
}

/** Strings shared by all sector pages. */
export const sectorUi: Record<SeoLang, {
  stepsTitle: string
  steps: { t: string; d: string }[]
  benefitsTitle: string
  examplesTitle: string
  examplesSub: string
  toGo: (n: number) => string
  ready: string
  faqSub: string
  ctaTitle: string
  ctaSub: string
  ctaBtn: string
  seePricing: string
  othersTitle: string
  navHow: string
  navFaq: string
  navPricing: string
  navContact: string
  free: string
}> = {
  en: {
    stepsTitle: 'Up and running in three steps',
    steps: [
      { t: 'Create your program', d: 'Choose how many stamps are needed and what the reward is. It takes about two minutes.' },
      { t: 'Show your QR code', d: 'Customers scan it and the card lands on their phone. No app, no forms.' },
      { t: 'Stamp and reward', d: 'Scan the customer’s code at every purchase. When the card is full, the reward is theirs.' },
    ],
    benefitsTitle: 'Why it works',
    examplesTitle: 'Example loyalty programs',
    examplesSub: 'Ideas for rules you can set up in LoyalCard.',
    toGo: (n) => `${n} to go`,
    ready: 'Reward ready',
    faqSub: 'Common questions',
    ctaTitle: 'Ready to start?',
    ctaSub: 'Create your loyalty program in two minutes. The free plan has no setup fees.',
    ctaBtn: 'Get started free',
    seePricing: 'See all plans',
    othersTitle: 'LoyalCard for other businesses',
    navHow: 'How it works',
    navFaq: 'FAQ',
    navPricing: 'Pricing',
    navContact: 'Contact Us',
    free: 'Start free',
  },
  it: {
    stepsTitle: 'Operativo in tre passaggi',
    steps: [
      { t: 'Crea il tuo programma', d: 'Scegli quanti timbri servono e qual è il premio. Bastano circa due minuti.' },
      { t: 'Mostra il tuo QR code', d: 'I clienti lo scansionano e la carta arriva sul loro telefono. Niente app, niente moduli.' },
      { t: 'Timbra e premia', d: 'Scansiona il codice del cliente a ogni acquisto. Quando la carta è piena, il premio è suo.' },
    ],
    benefitsTitle: 'Perché funziona',
    examplesTitle: 'Esempi di programmi fedeltà',
    examplesSub: 'Idee di regole che puoi configurare in LoyalCard.',
    toGo: (n) => `Ne mancano ${n}`,
    ready: 'Premio pronto',
    faqSub: 'Le domande più frequenti',
    ctaTitle: 'Pronto a iniziare?',
    ctaSub: 'Crea il tuo programma fedeltà in due minuti. Il piano gratuito non ha costi di attivazione.',
    ctaBtn: 'Inizia gratis',
    seePricing: 'Vedi tutti i piani',
    othersTitle: 'LoyalCard per altre attività',
    navHow: 'Come funziona',
    navFaq: 'FAQ',
    navPricing: 'Prezzi',
    navContact: 'Contattaci',
    free: 'Inizia gratis',
  },
  ro: {
    stepsTitle: 'Funcțional în trei pași',
    steps: [
      { t: 'Creează-ți programul', d: 'Alege câte ștampile sunt necesare și care este recompensa. Durează aproximativ două minute.' },
      { t: 'Arată codul tău QR', d: 'Clienții îl scanează, iar cardul ajunge pe telefonul lor. Fără aplicație, fără formulare.' },
      { t: 'Ștampilează și recompensează', d: 'Scanează codul clientului la fiecare achiziție. Când cardul este plin, recompensa este a lui.' },
    ],
    benefitsTitle: 'De ce funcționează',
    examplesTitle: 'Exemple de programe de fidelitate',
    examplesSub: 'Idei de reguli pe care le poți configura în LoyalCard.',
    toGo: (n) => `Mai ai ${n}`,
    ready: 'Recompensă gata',
    faqSub: 'Întrebări frecvente',
    ctaTitle: 'Ești gata să începi?',
    ctaSub: 'Creează-ți programul de fidelitate în două minute. Planul gratuit nu are costuri de activare.',
    ctaBtn: 'Începe gratuit',
    seePricing: 'Vezi toate planurile',
    othersTitle: 'LoyalCard pentru alte afaceri',
    navHow: 'Cum funcționează',
    navFaq: 'FAQ',
    navPricing: 'Prețuri',
    navContact: 'Contactează-ne',
    free: 'Începe gratuit',
  },
}
