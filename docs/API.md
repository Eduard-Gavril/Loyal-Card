# Fidelix - API Documentation

## Base URL

```
Production: https://[project-ref].supabase.co/functions/v1
Local: http://localhost:54321/functions/v1
```

## Authentication

Admin endpoints richiedono JWT token nell'header:

```
Authorization: Bearer <supabase_jwt_token>
```

Client endpoints (generate-client-id) sono pubblici.

---

## 📍 Endpoints

### 1. Generate Client ID

**POST** `/generate-client-id`

Genera un nuovo cliente anonimo con card loyalty.

#### Request

```json
{
  "tenant_id": "uuid",
  "email": "optional@email.com",
  "phone": "+39123456789",
  "name": "Optional Name"
}
```

#### Response

```json
{
  "success": true,
  "client_id": "uuid",
  "card_id": "uuid",
  "qr_code": "FIDELIX-ABCD1234"
}
```

#### Errors

- `400`: Invalid tenant_id
- `500`: Server error

#### Example

```bash
curl -X POST \
  https://[project].supabase.co/functions/v1/generate-client-id \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "11111111-1111-1111-1111-111111111111"}'
```

---

### 2. Register Scan

**POST** `/register-scan`

Registra uno scan QR e applica logica loyalty.

**Richiede autenticazione admin.**

#### Request

```json
{
  "qr_code": "FIDELIX-ABCD1234",
  "product_id": "uuid"
}
```

#### Response (Success)

```json
{
  "success": true,
  "card": {
    "id": "uuid",
    "client_id": "uuid",
    "loyalty_state": {
      "rule-uuid-1": {
        "count": 3,
        "rewards": 0
      }
    }
  },
  "reward_earned": {
    "rule_id": "uuid",
    "rule_name": "5 Espresso = 1 Gratis",
    "reward_count": 1
  }
}
```

#### Response (No reward)

```json
{
  "success": true,
  "card": {
    "id": "uuid",
    "client_id": "uuid",
    "loyalty_state": {
      "rule-uuid-1": {
        "count": 2,
        "rewards": 0
      }
    }
  }
}
```

#### Errors

- `401`: Missing or invalid authentication
- `403`: Admin not found or inactive
- `404`: Card not found or wrong tenant
- `404`: Product not found
- `400`: Card inactive
- `500`: Server error

#### Example

```bash
curl -X POST \
  https://[project].supabase.co/functions/v1/register-scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "qr_code": "FIDELIX-ABCD1234",
    "product_id": "44444444-4444-4444-4444-444444444441"
  }'
```

---

## 🗄️ Database API (Supabase Client)

### Get Card by QR Code

```typescript
const { data, error } = await supabase
  .from('cards')
  .select('*, clients(*)')
  .eq('qr_code', 'FIDELIX-ABCD1234')
  .single()
```

### Get Products for Tenant

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*, product_categories(*)')
  .eq('tenant_id', tenantId)
  .eq('active', true)
  .order('name')
```

### Get Reward Rules

```typescript
const { data, error } = await supabase
  .from('reward_rules')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('active', true)
  .order('priority', { ascending: false })
```

### Get Scan Events for Card

```typescript
const { data, error } = await supabase
  .from('scan_events')
  .select('*, products(name), admins(id)')
  .eq('card_id', cardId)
  .order('scanned_at', { ascending: false })
  .limit(50)
```

### Get Scan Events for Tenant (Admin)

```typescript
const { data, error } = await supabase
  .from('scan_events')
  .select(`
    *,
    clients(name, email),
    products(name),
    admins(id)
  `)
  .eq('tenant_id', tenantId)
  .order('scanned_at', { ascending: false })
  .limit(100)
```

---

## 🔐 Authentication

### Admin Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password123'
})

// Get admin info
const { data: admin } = await supabase
  .from('admins')
  .select('tenant_id, role')
  .eq('user_id', data.user.id)
  .single()
```

### Logout

```typescript
await supabase.auth.signOut()
```

---

## 📊 Data Models

### Loyalty State Structure

```typescript
interface LoyaltyState {
  [ruleId: string]: {
    count: number      // Current progress (0 to buy_count)
    rewards: number    // Available rewards
  }
}
```

Example:

```json
{
  "55555555-5555-5555-5555-555555555551": {
    "count": 3,
    "rewards": 0
  },
  "55555555-5555-5555-5555-555555555552": {
    "count": 5,
    "rewards": 1
  }
}
```

### Reward Rule Logic

```typescript
interface RewardRule {
  id: string
  tenant_id: string
  product_id?: string       // Target product (nullable)
  category_id?: string      // OR target category (nullable)
  buy_count: number         // e.g., 5
  reward_count: number      // e.g., 1
  reward_product_id?: string
}
```

**Logic**:
- Se `product_id` è set: regola si applica solo a quel prodotto
- Se `category_id` è set: regola si applica a tutti i prodotti della categoria
- Quando `count` raggiunge `buy_count`:
  - Incrementa `rewards` di `reward_count`
  - Reset `count` a 0

---

## 🚨 Error Handling

Tutti gli endpoint seguono questo formato error:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad request (missing parameters, invalid data)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (admin not authorized for tenant)
- `404`: Resource not found
- `500`: Internal server error

---

## 🔄 Webhooks (Future)

### Planned Events

```typescript
// scan.completed
{
  "event": "scan.completed",
  "tenant_id": "uuid",
  "client_id": "uuid",
  "product_id": "uuid",
  "reward_earned": boolean,
  "timestamp": "ISO8601"
}

// reward.earned
{
  "event": "reward.earned",
  "tenant_id": "uuid",
  "client_id": "uuid",
  "rule_id": "uuid",
  "reward_count": number,
  "timestamp": "ISO8601"
}
```

---

## 📈 Rate Limits

### Default Limits

- **Public endpoints**: 60 req/min per IP
- **Authenticated endpoints**: 100 req/min per user
- **Edge Functions**: 1000 req/min per tenant

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

---

## 🧪 Testing

### Test Tenant

```
tenant_id: 11111111-1111-1111-1111-111111111111
name: Demo Coffee Shop
```

### Test Products

```
Espresso: 44444444-4444-4444-4444-444444444441
Cappuccino: 44444444-4444-4444-4444-444444444442
```

### Test Reward Rule

```
5 Espresso = 1 Gratis
rule_id: 55555555-5555-5555-5555-555555555551
```

---

## 🛠️ SDK (Future)

```typescript
import { FidelixClient } from '@fidelix/sdk'

const fidelix = new FidelixClient({
  supabaseUrl: 'https://[project].supabase.co',
  supabaseKey: 'anon-key'
})

// Client side
const card = await fidelix.client.generate(tenantId)
const progress = await fidelix.client.getProgress(card.qr_code)

// Admin side
await fidelix.admin.login(email, password)
const result = await fidelix.admin.registerScan(qrCode, productId)
```

---

**Note**: API in evoluzione, versioning futuro con `/v2` endpoint.
