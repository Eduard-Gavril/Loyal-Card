import LegalBackdrop from '@/components/legal/LegalBackdrop'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { BUSINESS_TERMS_VERSION } from '@/lib/features'

type Lang = 'en' | 'ro' | 'it'
type Section = { h: string; p: string[] }
type Doc = { title: string; updated: string; partA: string; a: Section[]; partB: string; b: Section[] }

const CONTACT = 'eduardgavril.1999@gmail.com'
const PHONE = '+39 351 844 4209'

const DOCS: Record<Lang, Doc> = {
  it: {
    title: 'Condizioni per le attività e accordo sul trattamento dei dati',
    updated: `Versione ${BUSINESS_TERMS_VERSION} · novembre 2026`,
    partA: 'Parte A - Condizioni d\'uso per le attività',
    a: [
      { h: '1. Chi siamo e a cosa servono queste condizioni', p: [
        `LoyalCard è una piattaforma di carte fedeltà digitali gestita da Iulian Eduard Gavril, persona fisica residente in Italia ("LoyalCard", "noi"). Contatti: ${CONTACT}, ${PHONE}.`,
        'Queste condizioni regolano il rapporto tra noi e l\'attività commerciale ("l\'Attività", "tu") che crea un profilo per offrire una carta fedeltà ai propri clienti. Se registri l\'Attività per conto di un\'impresa, dichiari di avere il potere di vincolarla.',
      ] },
      { h: '2. Registrazione e approvazione', p: [
        'La registrazione richiede un indirizzo email verificato. Le informazioni fornite devono essere vere e aggiornate.',
        'Ogni richiesta è valutata manualmente: finché non è approvata, il profilo non è visibile ai clienti. Possiamo rifiutare una richiesta senza obbligo di motivazione; in tal caso il profilo e le credenziali creati vengono cancellati. Le richieste non gestite entro 30 giorni vengono cancellate automaticamente.',
        'L\'indirizzo del profilo (slug) è scelto da te alla registrazione e non può essere modificato in seguito, perché è usato nei link e nei QR code. Non sono ammessi nomi che violano diritti altrui o che inducono in errore.',
      ] },
      { h: '3. Piani e costi', p: [
        'Il piano Starter è gratuito e ha limiti su clienti, sedi, personale e funzioni. Gli altri piani (Business, Pro, Enterprise) e i componenti aggiuntivi sono attivati su richiesta, al prezzo concordato per iscritto. I limiti del piano sono applicati automaticamente dal sistema.',
        'Possiamo modificare funzioni e limiti dei piani con un preavviso ragionevole. Al momento non incassiamo pagamenti attraverso la piattaforma.',
      ] },
      { h: '4. Obblighi dell\'Attività', p: [
        'Usi il servizio in modo lecito, onori i premi che offri ai clienti, custodisci con cura le credenziali tue e del tuo personale e sei responsabile di ciò che avviene con i tuoi account.',
        'Non carichi contenuti illeciti, ingannevoli o che violano diritti di terzi (inclusi loghi e marchi) e non usi il servizio per inviare comunicazioni non richieste. Le notifiche ai clienti sono limitate a una al giorno.',
        'Sei tenuto a informare i tuoi clienti sul trattamento dei loro dati e ad avere una base giuridica per le comunicazioni promozionali che invii.',
      ] },
      { h: '5. Dati dei clienti', p: [
        'I dati personali dei clienti che usano la carta della tua Attività sono trattati come descritto nella Parte B (accordo sul trattamento dei dati) e nella nostra informativa privacy.',
      ] },
      { h: '6. Disponibilità del servizio', p: [
        'Il servizio è fornito "così com\'è". Facciamo il possibile per mantenerlo attivo, ma non garantiamo assenza di interruzioni, errori o perdita di dati e possiamo sospenderlo per manutenzione. Ti consigliamo di esportare periodicamente i tuoi dati dove il piano lo permette.',
      ] },
      { h: '7. Sospensione e chiusura', p: [
        'Possiamo sospendere o chiudere un profilo in caso di violazione di queste condizioni, abuso o rischio per altri utenti. Per il piano gratuito possiamo recedere con preavviso di 30 giorni.',
        'Puoi chiudere il profilo in qualsiasi momento da Impostazioni > Elimina attività (sito e app). L\'eliminazione diventa definitiva dopo 14 giorni, durante i quali puoi annullarla. Vengono cancellati l\'attività, le sedi, i prodotti, i premi, le carte dei clienti di quell\'attività e gli account di accesso del titolare e dello staff. Gli account dei clienti non vengono eliminati.',
      ] },
      { h: '8. Proprietà intellettuale', p: [
        'Il software, il marchio e i contenuti di LoyalCard restano nostri. Ti concediamo un diritto non esclusivo e non trasferibile di usare il servizio finché il profilo è attivo.',
        'Restano tuoi il nome, il logo e i contenuti che inserisci; ci autorizzi a mostrarli nel servizio e nell\'elenco dei partner.',
      ] },
      { h: '9. Responsabilità', p: [
        'Nei limiti consentiti dalla legge non rispondiamo di danni indiretti, mancati guadagni o perdita di dati. La nostra responsabilità complessiva verso di te non supera quanto hai pagato nei 12 mesi precedenti (o 100 euro per il piano gratuito). Restano ferme le responsabilità che la legge non permette di escludere.',
      ] },
      { h: '10. Modifiche', p: [
        'Possiamo aggiornare queste condizioni; le modifiche rilevanti ti saranno comunicate nell\'app o via email e la versione accettata è registrata insieme al tuo profilo. Se non le accetti puoi chiudere il profilo.',
      ] },
      { h: '11. Legge applicabile e foro competente', p: [
        'Queste condizioni sono regolate dalla legge italiana. Per ogni controversia è competente il foro del luogo di residenza del fornitore, salvo diversa disposizione inderogabile di legge.',
      ] },
    ],
    partB: 'Parte B - Accordo sul trattamento dei dati (art. 28 GDPR)',
    b: [
      { h: '1. Ruoli', p: [
        'Per i dati dei clienti raccolti tramite la carta fedeltà della tua Attività, tu sei titolare del trattamento e LoyalCard è responsabile del trattamento, che tratta i dati per tuo conto. Per l\'account personale del cliente sulla piattaforma (nome, recupero dell\'accesso, notifiche, eliminazione automatica degli account inattivi) LoyalCard agisce anche come titolare autonomo, come descritto nell\'informativa privacy.',
      ] },
      { h: '2. Oggetto, durata, dati e interessati', p: [
        'Oggetto: fornitura del servizio di carte fedeltà (creazione della carta, registrazione dei timbri e dei premi, statistiche, notifiche). Durata: finché il profilo è attivo, più il periodo necessario alla cancellazione (14 giorni di grazia).',
        'Dati: nome o pseudonimo del cliente, numero di telefono ed email se forniti, identificativo della carta, cronologia delle scansioni e dei premi, token per le notifiche. Interessati: i clienti dell\'Attività; per gli accessi, il titolare e lo staff.',
      ] },
      { h: '3. Istruzioni', p: [
        'Trattiamo i dati solo per fornire il servizio e secondo le tue istruzioni, che sono costituite da queste condizioni e dall\'uso che fai delle funzioni della piattaforma, salvo obblighi di legge. Ti avvisiamo se un\'istruzione ci sembra violare la normativa.',
      ] },
      { h: '4. Riservatezza e sicurezza', p: [
        'Le persone autorizzate al trattamento sono vincolate alla riservatezza. Adottiamo misure adeguate (art. 32 GDPR): connessioni cifrate, controllo degli accessi per attività e per ruolo, isolamento dei dati tra attività, limiti di tentativi di accesso, backup dei fornitori di infrastruttura.',
      ] },
      { h: '5. Sub-responsabili', p: [
        'Autorizzi in via generale l\'uso di fornitori di infrastruttura: Supabase (database e autenticazione), Netlify (hosting del sito) e i servizi di notifica push di Expo, Apple e Google. Questi fornitori possono trattare dati anche fuori dallo Spazio economico europeo con garanzie adeguate (clausole contrattuali standard). Se cambiamo fornitore ti informiamo aggiornando questa pagina e puoi opporti chiudendo il profilo.',
      ] },
      { h: '6. Assistenza sui diritti degli interessati', p: [
        'Ti aiutiamo a rispondere alle richieste dei clienti (accesso, rettifica, cancellazione). I clienti possono eliminare il proprio account dall\'app; gli account non utilizzati da 10 mesi e le carte non scansionate da 3 mesi vengono eliminati automaticamente.',
      ] },
      { h: '7. Violazioni dei dati', p: [
        'Se veniamo a conoscenza di una violazione dei dati personali che riguarda i dati della tua Attività, te lo comunichiamo senza ingiustificato ritardo, con le informazioni utili per la notifica al Garante.',
      ] },
      { h: '8. Cancellazione e restituzione dei dati', p: [
        'Alla chiusura del profilo cancelliamo i dati dell\'Attività al termine del periodo di grazia di 14 giorni. Prima della chiusura puoi esportare i dati dove il tuo piano lo prevede. Possiamo conservare i dati solo se la legge lo richiede.',
      ] },
      { h: '9. Verifiche', p: [
        `Su richiesta ti forniamo le informazioni necessarie a dimostrare il rispetto di questo accordo. Per richieste privacy scrivi a ${CONTACT}.`,
      ] },
    ],
  },

  ro: {
    title: 'Condiții pentru afaceri și acord de prelucrare a datelor',
    updated: `Versiunea ${BUSINESS_TERMS_VERSION} · noiembrie 2026`,
    partA: 'Partea A - Condiții de utilizare pentru afaceri',
    a: [
      { h: '1. Cine suntem și la ce servesc aceste condiții', p: [
        `LoyalCard este o platformă de carduri de fidelitate digitale administrată de Iulian Eduard Gavril, persoană fizică cu reședința în Italia ("LoyalCard", "noi"). Contact: ${CONTACT}, ${PHONE}.`,
        'Aceste condiții reglementează relația dintre noi și afacerea ("Afacerea", "tu") care își creează un profil pentru a oferi clienților un card de fidelitate. Dacă înregistrezi Afacerea în numele unei firme, declari că ai puterea de a o reprezenta.',
      ] },
      { h: '2. Înregistrare și aprobare', p: [
        'Înregistrarea necesită o adresă de email verificată. Informațiile furnizate trebuie să fie reale și actuale.',
        'Fiecare cerere este evaluată manual: până la aprobare, profilul nu este vizibil clienților. Putem refuza o cerere fără obligația de a o motiva; în acest caz profilul și datele de acces create sunt șterse. Cererile netratate în 30 de zile sunt șterse automat.',
        'Adresa profilului (slug) este aleasă de tine la înregistrare și nu poate fi modificată ulterior, deoarece este folosită în linkuri și coduri QR. Nu sunt permise nume care încalcă drepturile altora sau induc în eroare.',
      ] },
      { h: '3. Planuri și costuri', p: [
        'Planul Starter este gratuit și are limite privind clienții, sediile, personalul și funcțiile. Celelalte planuri (Business, Pro, Enterprise) și opțiunile suplimentare se activează la cerere, la prețul convenit în scris. Limitele planului sunt aplicate automat de sistem.',
        'Putem modifica funcțiile și limitele planurilor cu un preaviz rezonabil. În prezent nu încasăm plăți prin platformă.',
      ] },
      { h: '4. Obligațiile Afacerii', p: [
        'Folosești serviciul în mod legal, onorezi recompensele oferite clienților, îți păstrezi în siguranță datele de acces și pe cele ale personalului și ești responsabil pentru ce se întâmplă cu conturile tale.',
        'Nu încarci conținut ilegal, înșelător sau care încalcă drepturile terților (inclusiv logo-uri și mărci) și nu folosești serviciul pentru comunicări nesolicitate. Notificările către clienți sunt limitate la una pe zi.',
        'Ești obligat să îți informezi clienții despre prelucrarea datelor lor și să ai un temei legal pentru comunicările promoționale pe care le trimiți.',
      ] },
      { h: '5. Datele clienților', p: [
        'Datele personale ale clienților care folosesc cardul Afacerii tale sunt prelucrate conform Părții B (acordul de prelucrare a datelor) și politicii noastre de confidențialitate.',
      ] },
      { h: '6. Disponibilitatea serviciului', p: [
        'Serviciul este oferit "ca atare". Facem tot posibilul să îl menținem activ, dar nu garantăm lipsa întreruperilor, a erorilor sau a pierderii de date și îl putem suspenda pentru mentenanță. Îți recomandăm să îți exporți periodic datele acolo unde planul permite.',
      ] },
      { h: '7. Suspendare și închidere', p: [
        'Putem suspenda sau închide un profil în caz de încălcare a acestor condiții, abuz sau risc pentru alți utilizatori. Pentru planul gratuit putem înceta relația cu preaviz de 30 de zile.',
        'Poți închide profilul oricând din Setări > Șterge afacerea (site și aplicație). Ștergerea devine definitivă după 14 zile, în care o poți anula. Se șterg afacerea, sediile, produsele, recompensele, cardurile clienților acelei afaceri și conturile de acces ale proprietarului și ale personalului. Conturile clienților nu sunt șterse.',
      ] },
      { h: '8. Proprietate intelectuală', p: [
        'Software-ul, marca și conținutul LoyalCard rămân ale noastre. Îți acordăm un drept neexclusiv și netransmisibil de a folosi serviciul cât timp profilul este activ.',
        'Numele, logo-ul și conținutul pe care le introduci rămân ale tale; ne autorizezi să le afișăm în serviciu și în lista partenerilor.',
      ] },
      { h: '9. Răspundere', p: [
        'În limitele permise de lege nu răspundem pentru daune indirecte, profit nerealizat sau pierderea datelor. Răspunderea noastră totală față de tine nu depășește suma plătită în ultimele 12 luni (sau 100 de euro pentru planul gratuit). Rămân neatinse răspunderile care nu pot fi excluse prin lege.',
      ] },
      { h: '10. Modificări', p: [
        'Putem actualiza aceste condiții; modificările importante îți vor fi comunicate în aplicație sau prin email, iar versiunea acceptată este înregistrată împreună cu profilul tău. Dacă nu le accepți, poți închide profilul.',
      ] },
      { h: '11. Legea aplicabilă și instanța competentă', p: [
        'Aceste condiții sunt reglementate de legea italiană. Pentru orice litigiu este competentă instanța din locul de reședință al furnizorului, cu excepția unei dispoziții legale imperative contrare.',
      ] },
    ],
    partB: 'Partea B - Acord de prelucrare a datelor (art. 28 GDPR)',
    b: [
      { h: '1. Roluri', p: [
        'Pentru datele clienților colectate prin cardul de fidelitate al Afacerii tale, tu ești operator, iar LoyalCard este persoană împuternicită care prelucrează datele în numele tău. Pentru contul personal al clientului pe platformă (nume, recuperarea accesului, notificări, ștergerea automată a conturilor inactive) LoyalCard acționează și ca operator independent, conform politicii de confidențialitate.',
      ] },
      { h: '2. Obiect, durată, date și persoane vizate', p: [
        'Obiect: furnizarea serviciului de carduri de fidelitate (crearea cardului, înregistrarea ștampilelor și a recompenselor, statistici, notificări). Durată: cât timp profilul este activ, plus perioada necesară ștergerii (14 zile de grație).',
        'Date: numele sau pseudonimul clientului, numărul de telefon și emailul dacă sunt furnizate, identificatorul cardului, istoricul scanărilor și al recompenselor, token-ul pentru notificări. Persoane vizate: clienții Afacerii; pentru acces, proprietarul și personalul.',
      ] },
      { h: '3. Instrucțiuni', p: [
        'Prelucrăm datele doar pentru a furniza serviciul și conform instrucțiunilor tale, care constau în aceste condiții și în modul în care folosești funcțiile platformei, cu excepția obligațiilor legale. Te anunțăm dacă o instrucțiune pare să încalce legislația.',
      ] },
      { h: '4. Confidențialitate și securitate', p: [
        'Persoanele autorizate să prelucreze datele sunt obligate la confidențialitate. Adoptăm măsuri adecvate (art. 32 GDPR): conexiuni criptate, controlul accesului pe afacere și pe rol, separarea datelor între afaceri, limitarea încercărilor de autentificare, copii de siguranță ale furnizorilor de infrastructură.',
      ] },
      { h: '5. Sub-împuterniciți', p: [
        'Autorizezi în general folosirea furnizorilor de infrastructură: Supabase (baza de date și autentificare), Netlify (găzduirea site-ului) și serviciile de notificări push Expo, Apple și Google. Acești furnizori pot prelucra date și în afara Spațiului Economic European, cu garanții adecvate (clauze contractuale standard). Dacă schimbăm un furnizor te informăm actualizând această pagină și te poți opune închizând profilul.',
      ] },
      { h: '6. Asistență privind drepturile persoanelor vizate', p: [
        'Te ajutăm să răspunzi cererilor clienților (acces, rectificare, ștergere). Clienții își pot șterge contul din aplicație; conturile nefolosite de 10 luni și cardurile nescanate de 3 luni sunt șterse automat.',
      ] },
      { h: '7. Încălcări ale securității datelor', p: [
        'Dacă aflăm de o încălcare a securității datelor personale care privește datele Afacerii tale, te anunțăm fără întârzieri nejustificate, cu informațiile utile pentru notificarea autorității.',
      ] },
      { h: '8. Ștergerea și restituirea datelor', p: [
        'La închiderea profilului ștergem datele Afacerii la sfârșitul perioadei de grație de 14 zile. Înainte de închidere poți exporta datele acolo unde planul tău permite. Putem păstra datele doar dacă legea o cere.',
      ] },
      { h: '9. Verificări', p: [
        `La cerere îți furnizăm informațiile necesare pentru a demonstra respectarea acestui acord. Pentru cereri privind confidențialitatea scrie la ${CONTACT}.`,
      ] },
    ],
  },

  en: {
    title: 'Business terms and data processing agreement',
    updated: `Version ${BUSINESS_TERMS_VERSION} · November 2026`,
    partA: 'Part A - Business terms of use',
    a: [
      { h: '1. Who we are and what these terms are for', p: [
        `LoyalCard is a digital loyalty card platform run by Iulian Eduard Gavril, an individual resident in Italy ("LoyalCard", "we"). Contact: ${CONTACT}, ${PHONE}.`,
        'These terms govern the relationship between us and the business ("the Business", "you") that creates a profile to offer a loyalty card to its customers. If you register the Business on behalf of a company, you confirm you have the authority to bind it.',
      ] },
      { h: '2. Signup and approval', p: [
        'Signing up requires a verified email address. The information you provide must be true and up to date.',
        'Every request is reviewed manually: until it is approved, the profile is not visible to customers. We may refuse a request without giving a reason; in that case the profile and login created are deleted. Requests not handled within 30 days are deleted automatically.',
        'The profile address (slug) is chosen by you at signup and cannot be changed afterwards, because it is used in links and QR codes. Names that infringe the rights of others or are misleading are not allowed.',
      ] },
      { h: '3. Plans and fees', p: [
        'The Starter plan is free and has limits on customers, locations, staff and features. The other plans (Business, Pro, Enterprise) and add-ons are activated on request, at the price agreed in writing. Plan limits are enforced automatically by the system.',
        'We may change plan features and limits with reasonable notice. At present we do not collect payments through the platform.',
      ] },
      { h: '4. Your obligations', p: [
        'You use the service lawfully, honour the rewards you offer to customers, keep your and your staff\'s credentials safe and are responsible for what happens with your accounts.',
        'You do not upload unlawful or misleading content or content that infringes third-party rights (including logos and trademarks) and you do not use the service to send unsolicited messages. Notifications to customers are limited to one per day.',
        'You must inform your customers about how their data is processed and have a legal basis for any promotional messages you send.',
      ] },
      { h: '5. Customer data', p: [
        'The personal data of customers who use your Business\'s card is processed as described in Part B (data processing agreement) and in our privacy policy.',
      ] },
      { h: '6. Availability', p: [
        'The service is provided "as is". We do our best to keep it running but do not guarantee it will be free of interruptions, errors or data loss, and we may suspend it for maintenance. We recommend exporting your data regularly where your plan allows.',
      ] },
      { h: '7. Suspension and closing', p: [
        'We may suspend or close a profile for breach of these terms, abuse or risk to other users. For the free plan we may terminate with 30 days\' notice.',
        'You can close your profile at any time from Settings > Delete business (website and app). Deletion becomes permanent after 14 days, during which you can cancel it. The business, its locations, products, rewards, the customer cards for that business and the login accounts of the owner and staff are deleted. Customer accounts are not deleted.',
      ] },
      { h: '8. Intellectual property', p: [
        'The software, brand and content of LoyalCard remain ours. We grant you a non-exclusive, non-transferable right to use the service while your profile is active.',
        'Your name, logo and the content you enter remain yours; you authorise us to display them in the service and in the partners list.',
      ] },
      { h: '9. Liability', p: [
        'To the extent permitted by law we are not liable for indirect damages, lost profits or data loss. Our total liability to you does not exceed what you paid in the previous 12 months (or 100 euro for the free plan). Liability that cannot be excluded by law remains unaffected.',
      ] },
      { h: '10. Changes', p: [
        'We may update these terms; significant changes will be communicated in the app or by email and the version you accepted is recorded with your profile. If you do not accept them you can close your profile.',
      ] },
      { h: '11. Governing law and jurisdiction', p: [
        'These terms are governed by Italian law. Any dispute falls under the courts of the place where the provider resides, unless mandatory law provides otherwise.',
      ] },
    ],
    partB: 'Part B - Data processing agreement (Art. 28 GDPR)',
    b: [
      { h: '1. Roles', p: [
        'For customer data collected through your Business\'s loyalty card, you are the controller and LoyalCard is the processor acting on your behalf. For the customer\'s personal account on the platform (name, access recovery, notifications, automatic deletion of inactive accounts) LoyalCard also acts as an independent controller, as described in the privacy policy.',
      ] },
      { h: '2. Subject matter, duration, data and data subjects', p: [
        'Subject matter: providing the loyalty card service (creating the card, recording stamps and rewards, statistics, notifications). Duration: while the profile is active, plus the time needed for deletion (14-day grace period).',
        'Data: the customer\'s name or nickname, phone number and email if provided, card identifier, scan and reward history, notification token. Data subjects: the Business\'s customers; for logins, the owner and staff.',
      ] },
      { h: '3. Instructions', p: [
        'We process data only to provide the service and on your instructions, which are these terms and the way you use the platform\'s features, unless the law requires otherwise. We will tell you if an instruction appears to infringe data protection law.',
      ] },
      { h: '4. Confidentiality and security', p: [
        'People authorised to process data are bound by confidentiality. We apply appropriate measures (Art. 32 GDPR): encrypted connections, access control by business and role, separation of data between businesses, limits on login attempts, backups by our infrastructure providers.',
      ] },
      { h: '5. Sub-processors', p: [
        'You give general authorisation to use infrastructure providers: Supabase (database and authentication), Netlify (website hosting) and the Expo, Apple and Google push notification services. These providers may process data outside the European Economic Area with appropriate safeguards (standard contractual clauses). If we change a provider we will tell you by updating this page and you may object by closing your profile.',
      ] },
      { h: '6. Assistance with data subject rights', p: [
        'We help you respond to customer requests (access, rectification, erasure). Customers can delete their account from the app; accounts unused for 10 months and cards not scanned for 3 months are deleted automatically.',
      ] },
      { h: '7. Personal data breaches', p: [
        'If we become aware of a personal data breach affecting your Business\'s data, we will tell you without undue delay, with the information you need to notify the supervisory authority.',
      ] },
      { h: '8. Deletion and return of data', p: [
        'When the profile is closed we delete the Business\'s data at the end of the 14-day grace period. Before closing, you can export your data where your plan allows. We may keep data only where the law requires it.',
      ] },
      { h: '9. Audits', p: [
        `On request we provide the information needed to show compliance with this agreement. For privacy requests write to ${CONTACT}.`,
      ] },
    ],
  },
}

export default function BusinessTerms() {
  const navigate = useNavigate()
  const { language } = useClientStore()
  const d = DOCS[(language as Lang) in DOCS ? (language as Lang) : 'en']

  return (
    <div className="min-h-screen bg-gray-50">
      <LegalBackdrop />
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{d.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-gray-900">
          <p className="text-sm text-gray-500 mb-6">{d.updated}</p>

          <h2 className="text-2xl font-bold mt-2 mb-4">{d.partA}</h2>
          {d.a.map((s) => (
            <section key={s.h}>
              <h3 className="text-lg font-semibold mt-6 mb-2">{s.h}</h3>
              {s.p.map((t, i) => (
                <p key={i} className="mb-3 leading-relaxed">{t}</p>
              ))}
            </section>
          ))}

          <h2 className="text-2xl font-bold mt-10 mb-4">{d.partB}</h2>
          {d.b.map((s) => (
            <section key={s.h}>
              <h3 className="text-lg font-semibold mt-6 mb-2">{s.h}</h3>
              {s.p.map((t, i) => (
                <p key={i} className="mb-3 leading-relaxed">{t}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
