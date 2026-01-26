# Fidelix - Product Roadmap

## 📋 MVP (Fase 1) - 4-6 settimane

**Obiettivo**: Sistema funzionante per single tenant con features core

### Backend ✅
- [x] Schema DB PostgreSQL multi-tenant
- [x] Row Level Security policies
- [x] Seed data per testing
- [x] Edge Function: generate-client-id
- [x] Edge Function: register-scan
- [ ] Rate limiting su Edge Functions
- [ ] Audit logging automatico

### Frontend ✅
- [x] PWA setup con Vite
- [x] Client Card view (QR + progress)
- [x] Admin login
- [x] Admin dashboard base
- [x] QR Scanner (WebRTC)
- [x] Product selection per scan
- [ ] Responsive design polish
- [ ] Offline mode PWA

### Testing
- [ ] Unit tests Edge Functions
- [ ] E2E tests con Playwright
- [ ] RLS policy tests
- [ ] Load testing (100 scans/sec)

### Deploy
- [ ] Supabase produzione setup
- [ ] Frontend deploy Vercel
- [ ] CI/CD pipeline
- [ ] Monitoring & alerts

**Deliverable**: Demo funzionante con tenant demo

---

## 🚀 Fase 2 - Wallet Integration (3-4 settimane)

### Apple Wallet
- [ ] Edge Function: generate-apple-pass
- [ ] Certificato Apple Developer
- [ ] PassKit signing
- [ ] Pass upload su Storage
- [ ] Update push via APNs
- [ ] Add to Wallet button

### Google Wallet
- [ ] Google Wallet API setup
- [ ] OAuth2 flow
- [ ] Edge Function: generate-google-pass
- [ ] Loyalty Object creation
- [ ] Update via API
- [ ] Add to Google Wallet button

### Frontend
- [ ] Device detection (iOS/Android)
- [ ] Wallet status tracking
- [ ] Fallback per browser desktop

**Deliverable**: Card salvabile in Wallet con sync real-time

---

## 📈 Fase 3 - Multi-tenant & White-label (4 settimane)

### Admin Features
- [ ] Owner: gestione staff
- [ ] Creazione prodotti/categorie
- [ ] Configurazione reward rules (UI)
- [ ] Store management (multi-location)
- [ ] Inviti staff via email

### White-label
- [ ] Tenant settings (logo, colori, nome)
- [ ] Custom domain per tenant
- [ ] Email templates personalizzabili
- [ ] Branding su card digitale

### Onboarding
- [ ] Wizard setup nuovo tenant
- [ ] Quick start guide
- [ ] Demo interattivo

**Deliverable**: SaaS pronto per primi 10 clienti beta

---

## 💰 Fase 4 - Billing & Monetizzazione (3 settimane)

### Piani
- [ ] Freemium (100 scans/mese)
- [ ] Starter (€29/mese - 1000 scans)
- [ ] Professional (€99/mese - 10k scans)
- [ ] Enterprise (custom)

### Billing System
- [ ] Integrazione Stripe
- [ ] Metering scans per tenant
- [ ] Subscription management
- [ ] Invoice automatiche
- [ ] Usage dashboard

### Limiti & Enforcement
- [ ] Soft limit con notifiche
- [ ] Hard limit con blocco
- [ ] Upgrade flow

**Deliverable**: Sistema billing funzionante

---

## 📊 Fase 5 - Analytics & Insights (4 settimane)

### Admin Dashboard
- [ ] Grafici scan nel tempo
- [ ] Top prodotti
- [ ] Client retention rate
- [ ] Redemption rate premi
- [ ] Heatmap orari/giorni
- [ ] Export dati CSV/Excel

### Client Insights
- [ ] Storico acquisti
- [ ] Premi guadagnati/usati
- [ ] Statistiche personali

### Business Intelligence
- [ ] Segmentazione clienti
- [ ] RFM analysis
- [ ] Predictive churn
- [ ] A/B testing regole loyalty

**Deliverable**: Dashboard analytics completa

---

## 🔧 Fase 6 - Optimizations & Scale (ongoing)

### Performance
- [ ] Query optimization
- [ ] Caching Redis (opzionale)
- [ ] CDN per asset
- [ ] Image optimization
- [ ] Edge caching

### Scalabilità
- [ ] Database indexing avanzato
- [ ] Partitioning tabelle grandi
- [ ] Queue per scan processing
- [ ] Background jobs

### Security
- [ ] Penetration testing
- [ ] GDPR compliance full
- [ ] Backup automatici testati
- [ ] Disaster recovery plan

**Deliverable**: Sistema pronto per 1000+ tenant

---

## 🌟 Fase 7 - Advanced Features (nice-to-have)

### Loyalty Avanzato
- [ ] Stamping (punti con scadenza)
- [ ] Tier levels (bronze/silver/gold)
- [ ] Premi multipli combinabili
- [ ] Gift cards digitali
- [ ] Referral program

### Integrazioni
- [ ] POS integration (REST API)
- [ ] Webhook per eventi
- [ ] Zapier integration
- [ ] eCommerce plugins (WooCommerce, Shopify)

### Marketing
- [ ] Push notifications
- [ ] Email marketing automation
- [ ] SMS campaigns
- [ ] Geofencing

### Mobile Native (se necessario)
- [ ] React Native app
- [ ] NFC card support
- [ ] Beacon integration

**Deliverable**: Platform completa enterprise-ready

---

## 📅 Timeline Complessiva

```
Mese 1-2:  MVP ✅
Mese 3:     Wallet Integration
Mese 4-5:   Multi-tenant & White-label
Mese 6:     Billing
Mese 7-8:   Analytics
Mese 9+:    Scale & Advanced Features
```

**Total time to market**: ~6-9 mesi per prodotto vendibile

---

## 🎯 Metriche di Successo

### MVP
- [ ] 5 tenant beta attivi
- [ ] 100+ scan/giorno totali
- [ ] <1% error rate
- [ ] 99% uptime

### Fase Growth
- [ ] 50 tenant paganti
- [ ] 10k+ scan/giorno
- [ ] MRR €5k+
- [ ] Churn <5%

### Fase Scale
- [ ] 500+ tenant
- [ ] 100k+ scan/giorno
- [ ] MRR €50k+
- [ ] <100ms API response time

---

## 🔄 Backlog Prioritizzato

### P0 (Blocking per MVP)
1. RLS testing
2. Admin auth flow completo
3. Error handling robusto
4. Production deploy

### P1 (Nice-to-have MVP)
1. Email recovery cliente
2. Admin: visualizza singola card
3. Redemption tracking manuale
4. Basic analytics

### P2 (Post-MVP)
1. Multi-store per tenant
2. Staff permissions granulari
3. Export dati
4. Dark mode

### P3 (Future)
1. Mobile app nativa
2. API pubblica per partner
3. Marketplace regole loyalty
4. AI-powered insights

---

**Nota**: Roadmap flessibile, priorità basate su feedback beta users.
