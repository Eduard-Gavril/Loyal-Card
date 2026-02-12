# Fidelix - Digital Loyalty Platform

A modern, app-less digital loyalty platform built with React PWA + QR codes + Supabase.

## Overview

Fidelix is a multi-tenant SaaS platform for digital loyalty programs that:

- **Zero friction for customers** - No login or app download required
- **Product-based rewards** - Track purchases per product/category (e.g., "Buy 5 espressos, get 1 free")
- **Simple for businesses** - Admin scans customer QR to record purchases
- **Multi-tenant architecture** - One platform serves multiple independent businesses

## How It Works

### Customer Experience
1. Visit the website and get an instant digital loyalty card (no signup)
2. Show your QR code when making a purchase
3. Staff scans your QR and selects the product you bought
4. Your loyalty counter updates automatically
5. When you reach the threshold, claim your free reward!

### Admin/Staff Experience
1. Login to the admin panel
2. Use the built-in QR scanner to scan customer cards
3. Select purchased products (supports cart with multiple items)
4. System automatically tracks loyalty progress and rewards
5. Redeem rewards when customers earn them

## Key Features

- **Anonymous Client System** - Customers get a persistent client ID stored in browser, no registration needed
- **Multi-card Wallet** - Customers can have loyalty cards from multiple businesses
- **Product/Category Rules** - Flexible loyalty rules tied to specific products or categories
- **Real-time Updates** - Instant loyalty state updates via Supabase
- **Geolocation** - Find nearby participating businesses
- **PWA Support** - Installable on mobile devices
- **Multi-language** - Internationalization support

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Zustand** for state management
- **html5-qrcode** for QR scanning via WebRTC
- **React Router** for navigation
- **PWA** with vite-plugin-pwa

### Backend (Supabase)
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Auth** for admin authentication
- **Edge Functions** (Deno) for business logic:
  - `generate-client-id` - Creates anonymous clients and cards
  - `register-scan` - Records purchases and updates loyalty state
  - `redeem-reward` - Processes reward redemptions

### Deployment
- **Netlify** for frontend hosting
- **Supabase** cloud for backend

## Project Structure

```
fidelix/
├── frontend/                # React PWA application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Supabase client & utilities
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin dashboard, scanner, reports
│   │   │   └── client/      # Customer card & wallet views
│   │   ├── store/           # Zustand state stores
│   │   └── types/           # TypeScript types
│   └── ...config files
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   ├── generate-client-id/
│   │   ├── register-scan/
│   │   └── redeem-reward/
│   └── config.toml
├── docs/                    # Additional documentation
└── netlify.toml             # Netlify deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- Supabase CLI (optional, for local development)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd Fidelix

# Install frontend dependencies
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key from Project Settings > API

2. **Configure Environment Variables**
   Edit `frontend/.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Setup Database**
   - In Supabase Dashboard, go to SQL Editor
   - Run the migration scripts from `supabase/migrations/` to create the schema

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy generate-client-id
   supabase functions deploy register-scan
   supabase functions deploy redeem-reward
   ```

## Data Model

| Table | Description |
|-------|-------------|
| **tenants** | Businesses using the platform |
| **stores** | Physical locations (optional, for multi-store tenants) |
| **admins** | Staff/owner accounts with roles |
| **clients** | Anonymous customers (global, cross-tenant) |
| **cards** | Loyalty cards linking clients to tenants |
| **products** | Items sold by tenants |
| **product_categories** | Product groupings |
| **reward_rules** | Loyalty rules (e.g., buy 5 get 1 free) |
| **scan_events** | Immutable log of all scans |

## Routes

### Public (Customer)
- `/` - Landing page
- `/select-tenant` - Choose a business to get a card
- `/wallet` - View all your loyalty cards
- `/card/:qrCode` - View specific card

### Protected (Admin)
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Overview and stats
- `/admin/scan` - QR scanner and product selection
- `/admin/reports` - Transaction history
- `/admin/rewards` - Manage reward rules
- `/admin/settings` - Business settings

## Security

- **Row Level Security (RLS)** - All database queries are tenant-isolated
- **JWT Authentication** - Admin actions require valid session tokens
- **Backend Validation** - All business logic runs on Edge Functions
- **No Sensitive Client Logic** - Frontend only handles display

## Deployment

### Netlify (Frontend)
The project includes `netlify.toml` for automatic deployment:
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- SPA redirects configured

### Supabase (Backend)
- Database and Auth are managed via Supabase dashboard
- Edge Functions deploy via Supabase CLI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Roadmap](docs/ROADMAP.md)

## License

MIT License - See [LICENSE](LICENSE) for details.
