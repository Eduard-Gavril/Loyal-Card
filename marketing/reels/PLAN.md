# Reel LoyalCard: piano editoriale

Un video al giorno per Instagram, lo stesso file vale come **Reel** e come **Storia**.

## Regole fisse
- **Lingua**: rumeno. Testi presi dal sito quando possibile (`frontend/src/lib/i18n.ts`, sezione `ro`; prezzi in `frontend/src/pages/PricingPage.tsx`).
- **Pubblico**: titolari di attività in Romania (bar, ristoranti, saloni, negozi). Obiettivo: provare LoyalCard, piano Starter gratuito.
- **Durata**: 15 s (30 s solo per la serie "Un settore").
- **Formato**: 1080×1920, 30 fps, H.264, traccia audio muta (la musica si aggiunge da Instagram).
- **Zona sicura** (stage 720×1280): il contenuto importante sta in x 40–640, y 170–1000. In basso c'è la didascalia del Reel, a destra i pulsanti, in alto il nome del profilo.
- **Gancio** leggibile già nel primo fotogramma; azione finale chiara: `loyalcard.net` + "Link în bio".
- **Mai inventare** testimonianze, partner, clienti o numeri. Solo dati del sito con la loro fonte.
- Stile: stesso mondo grafico (viola LoyalCard, ambra per i premi), testi grandi in Inter 800, ritmo veloce.

## Calendario settimanale e orari consigliati
Orari in ora della Romania (Europe/Bucharest); in Italia è un'ora in meno.

| Giorno | Serie | Durata | Pubblica verso | Perché |
| --- | --- | --- | --- | --- |
| Lunedì | Un settore al giorno | 30 s | 08:30 | I titolari pianificano la settimana prima di aprire |
| Martedì | Domanda e risposta | 15 s | 14:30 | Pausa dopo il pranzo nei locali |
| Mercoledì | Il dato | 15 s | 12:30 | Pausa pranzo |
| Giovedì | Una funzione in 10 secondi | 15 s | 20:30 | Sera, dopo la chiusura |
| Venerdì | POV / meme | 15 s | 18:00 | Inizio weekend, contenuti da condividere |
| Sabato | Prima e dopo | 15 s | 10:30 | Mattina del weekend, più tempo per scorrere |
| Domenica | L'offerta | 15 s | 20:30 | Domenica sera si pensa alla settimana |

Sono punti di partenza. Dopo 2–3 settimane conviene controllare in Instagram → Dashboard professionale → Pubblico → "Momenti più attivi" e spostare gli orari.

## Backlog per serie
Segnare `[x]` quando un tema è stato usato.

**Un settore al giorno** (regola premio realistica per ogni settore)
- [x] Cafenea: 6 cafele → a 7-a gratuită (2026-10-12)
- [ ] Frizerie / barbershop: 5 tunsori → a 6-a gratuită
- [ ] Salon de înfrumusețare / unghii: 6 vizite → 20% reducere
- [ ] Pizzerie: 8 pizza → o pizza gratuită
- [ ] Patiserie / brutărie: 10 produse → unul gratuit
- [ ] Restaurant: 5 meniuri → desert gratuit (esempio del sito: "5 mese principale → desert GRATUIT sau 20% reducere")
- [ ] Spălătorie auto: 5 spălări → a 6-a gratuită
- [ ] Florărie: 5 buchete → 15% reducere
- [ ] Fast-food / shaorma: 8 meniuri → unul gratuit
- [ ] Bubble tea / ceainărie: 7 băuturi → una gratuită
- [ ] Pet shop: 10 achiziții → 10% reducere

**Domanda e risposta** (FAQ del sito, `faq.q1`–`q8`)
- [x] Costă ceva? (2026-10-13)
- [ ] Trebuie să descarc o aplicație?
- [ ] Cum îmi obțin cardul de fidelitate?
- [ ] Datele mele sunt în siguranță?
- [ ] Ce se întâmplă dacă îmi schimb telefonul?
- [ ] Pot să-l folosesc la orice magazin?
- [ ] Cum funcționează premiile?
- [ ] Ce se întâmplă dacă magazinul se închide?

**Il dato** (sezione "Rezultate Dovedite", con fonte a schermo)
- [x] +27% retenție clienți (Accenture 2020) (2026-10-14)
- [ ] +60% vizite recurente (Bond Brand Loyalty 2023)
- [ ] +25% venituri per client (Harvard Business Review)
- [ ] +30% valoare pe viață client (Bain & Company)

**Una funzione in 10 secondi**
- [ ] Apple Wallet / Google Wallet
- [ ] Scanner multi-produs (coș cu mai multe produse)
- [ ] Dashboard cu analize în timp real
- [ ] Export Excel
- [ ] Parteneri în apropiere (geolocalizare)
- [ ] Toate cardurile într-un singur loc
- [ ] Funcționează și offline
- [ ] Reguli pe produs sau categorie
- [ ] White-label: logo-ul tău (planul Business)
- [ ] Premii pe mai multe niveluri (planul Professional)

**POV / meme**
- [ ] POV: clientul și-a uitat iar cardul de carton acasă
- [ ] POV: ai printat 500 de carduri și apoi ți-ai schimbat logo-ul
- [ ] Clientul cu 9 carduri de carton în portofel
- [ ] Când clientul întreabă „mai am ștampile?”
- [ ] Când ștampila cu pixul e „ușor” falsificată

**Prima e dopo**
- [x] Carton vs telefon (usato il 2026-10-11 dentro l'offerta)
- [ ] Ștampila cu pixul vs scanarea QR
- [ ] Caietul cu clienți vs dashboard
- [ ] Costul tipăririi cardurilor vs 0€
- [ ] „Cine sunt clienții mei fideli?” fără date vs cu date

**L'offerta**
- [x] Începe GRATUIT: planul Starter (1 locație, 50 clienți activi/lună)
- [ ] Gata în 2 minute: crearea programului pas cu pas
- [ ] Planul Business: reguli nelimitate + logo-ul tău
- [ ] Gratuit pentru clienți, mereu

## Come si produce un reel
1. Copiare l'ultimo file `AAAA-MM-GG-*.html` di questa cartella (stesso motore di animazione) e cambiare le scene.
2. Controllo veloce: `TIMES=0,3,7,12 node render.mjs <file> <cartella> sheet`.
3. Fotogrammi: `node render.mjs <file> <cartella> video 30`, poi lo stesso comando `ffmpeg` del `README.md` in `marketing/animations/`.
4. MP4 e copertina restano fuori dal repo (sono pesanti): si inviano in chat.

## Registro
| Data | File | Serie | Tema | Orario consigliato (RO) |
| --- | --- | --- | --- | --- |
| 2026-10-11 (dom) | `2026-10-11-carton-vs-telefon.html` | L'offerta | Carton vs telefon + Starter gratuit | 20:30 |
| 2026-10-12 (lun) | `2026-10-12-cafenea.html` | Un settore al giorno | Cafenea: la tazza si riempie a ogni timbro, stile chiaro "latte" | 20:30 (eccezione: il reel di domenica esce alle 08:30) |
| 2026-10-13 (mar) | `2026-10-13-costa-ceva.html` | Domanda e risposta | Costă ceva? Formato chat: 0€ per i clienti, Starter gratuito per le attività | 14:30 |
| 2026-10-14 (mer) | `2026-10-14-retentie-27.html` | Il dato | +27% retenție clienți: griglia di persone 100 → 127, stile ambra | 12:30 |
