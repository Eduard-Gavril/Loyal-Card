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
- **Non promettere** registrazione autonoma né "Gata în 2 minute": le attività non si iscrivono da sole (il pulsante Starter porta a `/contact`, l'account lo crea l'amministratore). Non pubblicizzare Apple/Google Wallet finché non esiste.
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
- [x] Frizerie / barbershop: 5 tunsori → a 6-a gratuită (2026-10-19, anche taglio corto da 10 s)
- [x] Salon de înfrumusețare / unghii: 6 vizite → 20% reducere (2026-10-26, sconto percentuale = reward_type `percentage_discount`; anche taglio da 10 s)
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
- [x] Trebuie să descarc o aplicație? (2026-10-20)
- [x] Cum îmi obțin cardul de fidelitate? (2026-10-27: flusso reale loyalcard.net → "Alege magazinul tău" → card creato in automatico → scansione; la risposta del sito `faq.a3` dice che il card si crea alla scansione, nel codice si crea quando il cliente apre la pagina del negozio)
- [ ] Datele mele sunt în siguranță?
- [ ] Ce se întâmplă dacă îmi schimb telefonul?
- [ ] Pot să-l folosesc la orice magazin?
- [ ] Cum funcționează premiile?
- [ ] Ce se întâmplă dacă magazinul se închide?

**Il dato** (sezione "Rezultate Dovedite", con fonte a schermo)
- [x] +27% retenție clienți (Accenture 2020) (2026-10-14)
- [x] +60% vizite recurente (Bond Brand Loyalty 2023) (2026-10-21)
- [x] ~~+25% venituri per client (Harvard Business Review)~~ → +5% clienți care revin = +25% până la +95% profit (2026-10-28). L'articolo HBR linkato dal sito (2014, "The Value of Keeping the Right Customers") riporta questo dato di Frederick Reichheld / Bain, non "+25% venituri per client": la frase del sito va corretta
- [ ] +30% valoare pe viață client (Bain & Company): prima di usarlo trovare lo studio preciso, il link del sito porta solo alla pagina generica di Bain sulla fedeltà

**Una funzione in 10 secondi**
- [ ] ~~Apple Wallet / Google Wallet~~ (in sospeso: nel codice ci sono solo i testi, manca la generazione del pass; non pubblicizzare finché non esiste)
- [x] Scanner multi-produs (coș cu mai multe produse) (2026-10-15, indicato come planul Business)
- [x] Dashboard / Rapoarte (2026-10-22: pagina Rapoarte con dati di esempio; non dire "în timp real": i dati si caricano all'apertura, non in diretta)
- [x] Export Excel (già mostrato nel reel "Prima e dopo" del 2026-10-24: pulsante "Download Report Excel" + file LoyalCard_Clients_*.xlsx; non ripetuto)
- [x] Parteneri în apropiere (geolocalizare) (2026-10-29: "Alege magazinul tău" chiede la posizione e mostra i 5 negozi più vicini con la distanza "x.x km"; la posizione del negozio la inserisce il team LoyalCard, il titolare non la imposta dalle Setări)
- [ ] Toate cardurile într-un singur loc
- [ ] Funcționează și offline
- [ ] Reguli pe produs sau categorie
- [ ] White-label: logo-ul tău (planul Business)
- [ ] Premii pe mai multe niveluri (planul Professional)

**POV / meme**
- [x] POV: clientul și-a uitat iar cardul de carton acasă (2026-10-16)
- [x] POV: ai printat 500 de carduri și apoi ți-ai schimbat logo-ul (2026-10-23, Setări → URL Logo, planul Business)
- [ ] Clientul cu 9 carduri de carton în portofel
- [ ] Când clientul întreabă „mai am ștampile?”
- [ ] Când ștampila cu pixul e „ușor” falsificată

**Prima e dopo**
- [x] Carton vs telefon (usato il 2026-10-11 dentro l'offerta)
- [x] Ștampila cu pixul vs scanarea QR (2026-10-17)
- [x] Caietul cu clienți vs dashboard (2026-10-24, export Excel indicato come planul Business)
- [ ] Costul tipăririi cardurilor vs 0€
- [ ] „Cine sunt clienții mei fideli?” fără date vs cu date

**L'offerta**
- [x] Începe GRATUIT: planul Starter (1 locație, 50 clienți activi/lună)
- [x] ~~Gata în 2 minute~~ → "Programul tău de fidelitate în 4 pași" (2026-10-18): ne scrii → produse → regula de premiu → prima scanare
- [x] Planul Business: reguli nelimitate + logo-ul tău (2026-10-25: €30/lună, €24/lună con pagamento annuale, elenco funzioni da PricingPage)
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
| 2026-10-15 (gio) | `2026-10-15-scanner-multi-produs.html` | Una funzione | Scanner multi-produs: 3 produse, 1 scanare (demo con dito), planul Business | 20:30 |
| 2026-10-16 (ven) | `2026-10-16-pov-card-uitat.html` | POV / meme | Portafoglio vuoto, post-it con 4 tacche, faccina; CTA "trimite asta unui patron" | 18:00 |
| 2026-10-17 (sab) | `2026-10-17-pix-vs-qr.html` | Prima e dopo | Schermo diviso: penna (anche una penna "altrui") vs scansione registrata in scan_events | 10:30 |
| 2026-10-18 (dom) | `2026-10-18-4-pasi.html` | L'offerta | Programul de fidelitate în 4 pași (percorso reale), Starter gratuit | 20:30 |
| 2026-10-19 (lun) | `2026-10-19-frizerie.html` | Un settore al giorno | Frizerie: palo da barbiere, 5 tunsori → a 6-a gratuită; 30 s + taglio da 10 s per test | 08:30 (30 s) / Reel di prova (10 s) |
| 2026-10-20 (mar) | `2026-10-20-descarc-aplicatie.html` | Domanda e risposta | Download bloccato al 12% → "NU" → card nel browser; bonus PWA; 15 s + taglio 8 s | 14:30 (15 s) / Reel di prova (8 s) |
| 2026-10-21 (mer) | `2026-10-21-vizite-60.html` | Il dato | +60% vizite recurente: contapersone 100 → 160, 1 icona = 10 visite; 15 s + taglio 9 s | 12:30 (15 s) / Reel di prova (9 s) |
| 2026-10-22 (gio) | `2026-10-22-rapoarte.html` | Una funzione | Pagina Rapoarte (KPI, Scanări pe Zi, Produse Populare, Scanări pe Angajat, 7→30 Zile), "Date de exemplu", Business; 15 s + taglio 8 s | 20:30 (15 s) / Reel di prova (8 s) |
| 2026-10-23 (ven) | `2026-10-23-pov-500-carduri.html` | POV / meme | 500 carduri la coș vs logo cambiato in Setări (URL Logo), Business; 15 s + taglio 9 s | 18:00 (15 s) / Reel di prova (9 s) |
| 2026-10-24 (sab) | `2026-10-24-caiet-vs-dashboard.html` | Prima e dopo | Schermo diviso: quaderno a mano (lente, "Cine a venit de 5 ori luna asta?") vs dashboard (Scanări Totale, Clienți, Premii Date, Scanări Azi) + "Download Report Excel" → LoyalCard_Clients_*.xlsx, "Date de exemplu", Business; 15 s + taglio 9 s | 10:30 (15 s) / Reel di prova (9 s) |
| 2026-10-25 (dom) | `2026-10-25-planul-business.html` | L'offerta | Planul Business: logo nel card cliente (Setări → URL Logo, "Cafeneaua Mea"), Starter 1 regulă vs reguli nelimitate (esempi), €30/lună o €24/lună annuale + 6 funzioni; 15 s + taglio 9 s | 20:30 (15 s) / Reel di prova (9 s) |
| 2026-10-26 (lun) | `2026-10-26-salon.html` | Un settore al giorno | Salon: boccette di smalto, "Salonul de alături are și el oje", telefono con 6 visite → 20% reducere, 3 vantaggi, Starter gratuito; 30 s + taglio 10 s | 08:30 (30 s) / Reel di prova (10 s) |
| 2026-10-27 (mar) | `2026-10-27-cum-obtin-cardul.html` | Domanda e risposta | Fumetto con la domanda, telefono in 4 passi (loyalcard.net, Alege magazinul tău, card creato in automatico, scansione +1 ștampilă), "Tu doar scanezi"; 15 s + taglio 9,5 s | 14:30 (15 s) / Reel di prova (9,5 s) |
| 2026-10-28 (mer) | `2026-10-28-profit-25-95.html` | Il dato | Slider "Clienți care revin" 0 → +5%, "Cât crește profitul?", grafico a barre +25% → +95% con fonte Reichheld/Bain in HBR 2014; 15 s + taglio 9,5 s | 12:30 (15 s) / Reel di prova (9,5 s) |
| 2026-10-29 (gio) | `2026-10-29-magazine-apropiere.html` | Una funzione | Mappa con il cliente e i pin, "Te găsesc clienții din cartier?", telefono con "Alege magazinul tău" → Se caută locația ta... → elenco con 0.3 km (EXEMPLU) → tap → Card nou creat; 15 s + taglio 9,5 s | 20:30 (15 s) / Reel di prova (9,5 s) |
