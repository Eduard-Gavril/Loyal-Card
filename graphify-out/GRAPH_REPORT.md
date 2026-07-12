# Graph Report - C:\Users\a5861\Documents\GitHub\LoyalCard  (2026-07-12)

## Corpus Check
- 144 files · ~155,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 691 nodes · 1117 edges · 64 communities (50 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.86)
- Token cost: 238,738 input · 0 output

## Community Hubs (Navigation)
- Frontend Client & Admin App
- Project Docs & Architecture
- Mobile App Expo Dependencies
- Frontend Dev Tooling
- Mobile App Config (app.json)
- Frontend Runtime Dependencies
- Frontend TS Config
- Mobile Admin Screens & Store
- Frontend App Routes
- Frontend Scanner Components
- Mobile Package & Babel Deps
- Mobile Home/i18n & Layout
- Mobile Card & Tenant Screens
- Frontend Card Components
- Mobile Scan History & Theme
- Mobile Admin Reports & Excel Export
- Mobile Profile Screen
- SEO & Meta Tags
- Frontend Node TS Config
- Mobile Dashboard Screen
- Root Package & Xlsx Deps
- generate-client-id Function Config
- register-scan Function Config
- Mobile Admin Scanner Screen
- Mobile App TS Config
- link-phone Edge Function Logic
- Mobile App Config Core
- Supabase Functions Base Config
- recover-client Edge Function Logic
- LoyalCard Logo Brand Assets
- App Screenshot (QR Code Feature)
- Frontend Vite Env Types
- Mobile Admin Dashboard Screen
- Frontend Phone Input Component
- Mobile Splash Screen Assets
- App Icon Brand Identity
- Favicon & Logo Assets
- Mobile Error Boundary
- Mobile App Icon Assets
- Mobile Metro Config
- delete-account Edge Function Deno Config
- generate-client-id Index Function
- link-email Edge Function Deno Config
- link-phone Edge Function Deno Config
- recover-client Edge Function Deno Config
- redeem-reward Edge Function Deno Config
- register-scan Index Function
- Shared Phone Utils
- update-client-profile Edge Function Deno Config
- OG Image Social Preview
- link-email Index Function
- redeem-reward Index Function

## God Nodes (most connected - your core abstractions)
1. `useClientStore` - 41 edges
2. `useClientStore` - 32 edges
3. `getTranslation()` - 29 edges
4. `getTranslation()` - 29 edges
5. `useAuthStore` - 19 edges
6. `useAdminStore` - 19 edges
7. `compilerOptions` - 18 edges
8. `expo-router` - 18 edges
9. `colors` - 18 edges
10. `radius` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Fidelix Setup Guide` --semantically_similar_to--> `Netlify Deployment`  [INFERRED] [semantically similar]
  docs/SETUP.md → README.md
- `Expo Mobile App Project` --semantically_similar_to--> `React PWA Frontend`  [INFERRED] [semantically similar]
  mobile_app/.expo/README.md → README.md
- `POST /generate-client-id Endpoint` --implements--> `generate-client-id Edge Function`  [INFERRED]
  docs/API.md → README.md
- `Deploy Edge Functions Guide` --references--> `generate-client-id Edge Function`  [EXTRACTED]
  DEPLOY_FUNCTIONS.md → README.md
- `Deploy Edge Functions Guide` --references--> `register-scan Edge Function`  [EXTRACTED]
  DEPLOY_FUNCTIONS.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Loyalty Edge Functions Flow** — readme_generate_client_id_function, readme_register_scan_function, readme_redeem_reward_function [EXTRACTED 0.90]
- **Redundant Setup Documentation Set** — quickstart_guide, supabase_setup_guide, docs_setup_guide [INFERRED 0.85]
- **Multi-Tenant Security & Isolation Model** — docs_architecture_multi_tenancy, readme_row_level_security, docs_architecture_scan_events_rls_policy, docs_super_admin_role [INFERRED 0.85]

## Communities (64 total, 14 thin omitted)

### Community 0 - "Frontend Client & Admin App"
Cohesion: 0.06
Nodes (63): html5-qrcode, qrcode, CookieBanner(), LanguageSelector(), RewardRedemptionProps, LoyaltyProgressItem, useClientCard(), useScanner() (+55 more)

### Community 1 - "Project Docs & Architecture"
Cohesion: 0.05
Nodes (56): Fidelix Changelog, Release 0.1.0 (MVP), Coding Standards (TS/SQL/naming conventions), CONTRIBUTING.md Guide, Deploy Edge Functions Guide, Fidelix API Documentation, FidelixClient SDK (Future), POST /generate-client-id Endpoint (+48 more)

### Community 2 - "Mobile App Expo Dependencies"
Cohesion: 0.04
Nodes (49): expo, expo-camera, expo-clipboard, expo-constants, expo-file-system, expo-linking, expo-localization, expo-location (+41 more)

### Community 3 - "Frontend Dev Tooling"
Cohesion: 0.06
Nodes (33): autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks (+25 more)

### Community 4 - "Mobile App Config (app.json)"
Cohesion: 0.06
Nodes (31): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, versionCode, projectId, expo (+23 more)

### Community 5 - "Frontend Runtime Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, ogl, react, react-dom, react-router-dom, @supabase/supabase-js, xlsx (+18 more)

### Community 6 - "Frontend TS Config"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+17 more)

### Community 7 - "Mobile Admin Screens & Store"
Cohesion: 0.12
Nodes (20): AdminLayout(), AdminLoginScreen(), s, AdminProductsScreen(), EMOJIS, emptyProduct, emptyRule, Product (+12 more)

### Community 8 - "Frontend App Routes"
Cohesion: 0.09
Nodes (20): AcceptableUsePolicy, AdminDashboard, AdminProducts, AdminReports, AdminRewards, AdminScanner, AdminSettings, App() (+12 more)

### Community 9 - "Frontend Scanner Components"
Cohesion: 0.13
Nodes (13): CartConfirmationProps, ProductSelectorProps, QRScannerProps, ScanResultProps, Product, CameraPermission, CartItem, MACRO_CATEGORIES (+5 more)

### Community 10 - "Mobile Package & Babel Deps"
Cohesion: 0.10
Nodes (20): @babel/core, @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods, babel-preset-expo, devDependencies, @babel/core, @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods (+12 more)

### Community 11 - "Mobile Home/i18n & Layout"
Cohesion: 0.19
Nodes (13): ClientRecord, ClientsScreen(), s, s, WelcomeScreen(), getTimeGreeting(), HomeScreen(), s (+5 more)

### Community 12 - "Mobile Card & Tenant Screens"
Cohesion: 0.16
Nodes (13): CardScreen(), cleanRuleName(), RuleTagline(), s, CATEGORIES, CATEGORY_ICONS, s, TenantSelectorScreen() (+5 more)

### Community 13 - "Frontend Card Components"
Cohesion: 0.14
Nodes (6): LoyaltyProgressCardProps, BeforeInstallPromptEvent, PWAInstallPromptProps, QRCodeDisplay(), QRCodeDisplayProps, StampsVisualizationProps

### Community 14 - "Mobile Scan History & Theme"
Cohesion: 0.23
Nodes (8): s, ScanEvent, ScanHistoryScreen(), eb, radius, shadows, spacing, type

### Community 15 - "Mobile Admin Reports & Excel Export"
Cohesion: 0.20
Nodes (8): AdminReportsScreen(), DayStat, ProductStat, Range, RANGE_DAYS, RANGE_LABELS, s, exportExcel()

### Community 16 - "Mobile Profile Screen"
Cohesion: 0.31
Nodes (9): LANGUAGES, LinkPhoneSection(), maskPhone(), NameSection(), PREFIXES, ProfileScreen(), RecoverySection(), s (+1 more)

### Community 17 - "SEO & Meta Tags"
Cohesion: 0.25
Nodes (9): frontend/index.html Entry Page, Schema.org JSON-LD Blocks (SoftwareApplication, Organization, Service, FAQPage), SEO Meta Tags in index.html, Google Search Console Verification File, frontend/public/robots.txt, SEO Optimization Guide, robots.txt File, Schema.org JSON-LD Markup (+1 more)

### Community 18 - "Frontend Node TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.ts

### Community 19 - "Mobile Dashboard Screen"
Cohesion: 0.25
Nodes (7): CardItem(), CardProgress, CATEGORY_ICONS, DashboardScreen(), relativeDate(), s, TenantMeta

### Community 20 - "Root Package & Xlsx Deps"
Cohesion: 0.22
Nodes (8): dependencies, @types/xlsx, xlsx, devDependencies, supabase, xlsx, supabase, @types/xlsx

### Community 21 - "generate-client-id Function Config"
Cohesion: 0.22
Nodes (8): compilerOptions, lib, strict, imports, @supabase/supabase-js, deno.window, tasks, dev

### Community 22 - "register-scan Function Config"
Cohesion: 0.22
Nodes (8): compilerOptions, lib, strict, imports, @supabase/supabase-js, deno.window, tasks, dev

### Community 23 - "Mobile Admin Scanner Screen"
Cohesion: 0.25
Nodes (7): AdminScannerScreen(), CardInfo, CartItem, Mode, Product, RewardRule, s

### Community 24 - "Mobile App TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, ./src/*, @/*, expo/tsconfig.base

### Community 25 - "link-phone Edge Function Logic"
Cohesion: 0.29
Nodes (3): isValidPhoneNumber(), LinkPhoneRequest, normalizePhoneNumber()

### Community 26 - "Mobile App Config Core"
Cohesion: 0.29
Nodes (6): package, projectId, expo, android, extra, eas

### Community 27 - "Supabase Functions Base Config"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, noImplicitAny, strict, target, deno.window

### Community 28 - "recover-client Edge Function Logic"
Cohesion: 0.33
Nodes (3): isValidPhoneNumber(), normalizePhoneNumber(), RecoverClientRequest

### Community 29 - "LoyalCard Logo Brand Assets"
Cohesion: 0.50
Nodes (5): LoyalCard Brand Logo (LC Shield with Crown), Crown icon atop shield (royalty/VIP/reward status motif), LC monogram (interlocking L and C letters, stands for LoyalCard), Purple/violet gradient color palette (light lavender to deep indigo), Shield emblem shape (loyalty/protection motif)

### Community 30 - "App Screenshot (QR Code Feature)"
Cohesion: 0.50
Nodes (5): LoyalCard QR Code Screen Screenshot, Dark Themed Branding with Gold Accent Background, EN/RO Language Toggle, Loyalty Card Unique Identifier, QR Code Display Feature

### Community 31 - "Frontend Vite Env Types"
Cohesion: 0.40
Nodes (4): ImportMeta, ImportMetaEnv, ReturnType, virtual:pwa-register/react

### Community 32 - "Mobile Admin Dashboard Screen"
Cohesion: 0.40
Nodes (4): AdminDashboardScreen(), RecentEvent, s, Stats

### Community 33 - "Frontend Phone Input Component"
Cohesion: 0.67
Nodes (3): NAMED_CODES, PhoneInput(), PhoneInputProps

### Community 34 - "Mobile Splash Screen Assets"
Cohesion: 0.67
Nodes (4): Dark navy/indigo background color, 'L' logo mark (white letter L in purple circle), Purple/violet accent color (brand color), Splash Screen (LoyalCard mobile app)

### Community 35 - "App Icon Brand Identity"
Cohesion: 0.67
Nodes (3): LoyalCard Apple Touch Icon (LC shield-and-crown logo), LoyalCard Brand Identity (purple gradient, shield, crown, LC monogram), Adaptive Icon (Android) - Purple Circle with White 'L' Monogram

### Community 36 - "Favicon & Logo Assets"
Cohesion: 0.67
Nodes (3): LoyalCard Favicon Icon (LC Shield with Crown), LoyalCard Project, LoyalCard App Logo (LC Shield with Crown)

### Community 38 - "Mobile App Icon Assets"
Cohesion: 0.67
Nodes (3): LoyalCard App Icon, Dark navy background with purple circle and white accent color scheme, Stylized 'L' letterform (white, blocky)

## Knowledge Gaps
- **287 isolated node(s):** `projectId`, `package`, `name`, `version`, `private` (+282 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Runtime Dependencies` to `Frontend Client & Admin App`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Frontend Dev Tooling` to `Frontend Runtime Dependencies`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `html5-qrcode` connect `Frontend Client & Admin App` to `Frontend Runtime Dependencies`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `projectId`, `package`, `name` to the rest of the system?**
  _291 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Client & Admin App` be split into smaller, more focused modules?**
  _Cohesion score 0.060812203669346525 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.05389610389610389 - nodes in this community are weakly interconnected._
- **Should `Mobile App Expo Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._