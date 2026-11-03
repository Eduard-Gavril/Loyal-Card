# Piano: registrazione autonoma e cancellazione del profilo aziendale

Stato: **da fare** (valutato e deciso, non ancora implementato). Sito web e app mobile devono restare allineati.

## Cosa c'è oggi (novembre 2026)
- Le attività (`tenants`) si creano a mano nel database. Il pulsante "crea attività" del pannello super-admin porta a `/super-admin/create-tenant`, che non esiste.
- Un'attività si può solo disattivare (super-admin). Nessuno può cancellarla.
- Cancellare una riga `tenants` elimina a cascata: sedi, admin, prodotti, categorie, regole, carte, scansioni, notifiche inviate. Gli `audit_logs` restano (collegamento azzerato).
  Non si cancellano da soli: gli utenti di Supabase Auth (titolare e staff) e l'eventuale logo.
- I limiti dei piani (Starter, Business, Pro, Enterprise) sono già applicati dal database. Un tenant nuovo parte come Starter.

## Decisioni prese
1. **Registrazione aperta a tutti**, ma l'attività resta **in attesa** finché non la approva il super-admin.
2. **Approvazione manuale:** il super-admin ha una sezione **Notifiche** (nuova) dove vede le richieste e le **approva o nega**.
3. **Verifica email obbligatoria**, con la verifica di Supabase Auth (conferma via link).
4. **Lo slug (indirizzo) lo sceglie l'utente**: va validato (solo minuscole, numeri e trattini), reso univoco e con una lista di nomi riservati (admin, api, www, ...).
5. **Termini e privacy per le attività:** servono clausole apposite (contratto tra LoyalCard e l'attività; l'attività è titolare dei dati dei suoi clienti e LoyalCard è responsabile del trattamento, con un breve accordo sul trattamento dei dati accettato con una casella alla registrazione). Va scritto/controllato da chi segue la privacy, non è codice.
6. Va fatto **con criterio e rispettando le regole di Apple e Google** (vedi sotto).

## Ordine di lavoro consigliato
1. **Cancellazione dell'attività** (prima, perché serve comunque per gli store).
2. **Registrazione Starter** con approvazione.
3. **Allineamento** di privacy, termini e app mobile.

## 1. Cancellazione del profilo aziendale
- Voce **"Elimina attività"** in Impostazioni admin (sito e app), solo per il titolare, con conferma forte (digitare il nome dell'attività).
- **Periodo di grazia di 7-30 giorni:** l'attività risulta "in cancellazione" e il titolare può annullare; allo scadere un job cancella davvero.
- Funzione server (service role) che cancella: dati dell'attività (cascata), utenti Supabase Auth del titolare e dello staff, logo.
- Clienti: i loro account non si toccano, spariscono solo le carte di quell'attività. Valutare una notifica prima della cancellazione.
- Piano a pagamento: gestire fine abbonamento / rimborso.
- Aggiornare informativa privacy e termini (diritto alla cancellazione).

## 2. Registrazione autonoma (piano Starter)
- Schermata "Crea la tua attività": nome, email del titolare, password, tipo di attività, lingua, slug, accettazione di termini, privacy e accordo sul trattamento dati.
- Funzione server (service role) in **un solo passaggio**, con annullamento in caso di errore: crea utente Auth, riga `tenants` (piano Starter, **stato in attesa**), riga `admins` con ruolo owner, una sede e una regola di esempio.
- Verifica email di Supabase prima di poter accedere.
- **Anti-abuso:** limite di richieste per IP, controllo di slug e nome già usati, nomi riservati.
- **Approvazione:** nuova sezione **Notifiche** nel super-admin con le richieste in attesa (nome, email, slug, data), pulsanti Approva / Nega (con motivo opzionale). Finché non è approvata l'attività non può usare scansioni e non è visibile ai clienti; il titolare vede una pagina "richiesta in attesa". Email di esito al titolare.
- Pensare anche a un avviso al super-admin (email o notifica push) quando arriva una richiesta.
- Upgrade del piano: come oggi (contatto manuale) finché non c'è un pagamento.

## Regole Apple e Google da rispettare
- **Apple (App Store, regola 5.1.1(v)) e Google Play:** se l'app permette di creare un account, **deve permettere di cancellarlo dall'interno dell'app**. Google richiede anche un **link web** per chiedere la cancellazione e la dichiarazione nella scheda "Sicurezza dei dati".
- **Cancellazione effettiva:** quando l'utente la richiede, i dati vanno davvero eliminati (il periodo di grazia è ammesso se spiegato).
- **Informativa privacy:** link pubblico, coerente con quello che l'app fa (periodi di conservazione, cancellazione automatica degli account inattivi, contatti).
- **App Privacy / Data safety:** compilare le dichiarazioni sui dati raccolti (email, telefono, token notifiche, posizione se usata).
- **Accesso con terze parti:** non c'è, quindi "Sign in with Apple" non è richiesto.
- **Account di prova per i revisori:** serve un'attività già approvata con credenziali di test (la registrazione con approvazione manuale può bloccare la revisione se non prevista).
- Nell'app: schermate di registrazione ed eliminazione che chiamano **le stesse due funzioni server** del sito.

## Da decidere / da fare con consulente
- Testo di termini e accordo sul trattamento dei dati per le attività.
- Durata del periodo di grazia per la cancellazione (7 o 30 giorni).
- Allineare l'informativa al periodo di conservazione reale: oggi il testo dice "3 anni dopo l'ultimo accesso", mentre la pulizia automatica cancella gli account clienti inattivi (funzione `cleanup_inactive_users`, 10 mesi, regola su cron-job.org ancora da creare).

## Stima indicativa
- Cancellazione: circa 1 giorno. Registrazione con approvazione: circa 2-3 giorni. Più allineamento di app e testi.
