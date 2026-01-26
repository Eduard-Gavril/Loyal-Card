# Contributing to Fidelix

Grazie per il tuo interesse a contribuire a Fidelix! 🎉

## 🤝 Come Contribuire

### Reporting Bugs

Se trovi un bug:
1. Controlla se è già stato segnalato nelle Issues
2. Crea una nuova issue con:
   - Descrizione chiara del problema
   - Steps per riprodurlo
   - Comportamento atteso vs attuale
   - Screenshot se utili
   - Environment (browser, OS, versione)

### Suggesting Features

Per nuove feature:
1. Controlla la roadmap in `docs/ROADMAP.md`
2. Crea una issue con label `enhancement`
3. Descrivi use case e benefici
4. Proponi implementazione (opzionale)

### Pull Requests

1. **Fork** il repository
2. **Crea branch** da `main`: `git checkout -b feature/nome-feature`
3. **Commit** con messaggi chiari
4. **Push** al tuo fork
5. **Apri PR** con descrizione dettagliata

## 📝 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
export async function generateClientId(tenantId: string): Promise<ClientData> {
  if (!tenantId) {
    throw new Error('tenant_id is required')
  }
  // ...
}

// ❌ Bad
export async function generate(id) {
  // ...
}
```

### SQL

```sql
-- ✅ Good
CREATE INDEX idx_scan_events_tenant 
  ON scan_events(tenant_id, scanned_at DESC);

-- ❌ Bad
create index idx1 on scan_events(tenant_id);
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **DB tables**: `snake_case`

## 🧪 Testing

Prima di submit PR:

```bash
# Run linter
npm run lint

# Run tests (quando disponibili)
npm test

# Build check
npm run build
```

## 🔒 Security

**NON** includere mai:
- API keys, secrets, passwords
- Dati personali reali
- Certificati privati

Se trovi vulnerabilità di sicurezza, contatta privatamente via email (non public issues).

## 📄 License

Contribuendo accetti che il tuo codice sarà rilasciato sotto la stessa licenza del progetto.

## ❓ Domande

Per domande:
- Apri una Discussion su GitHub
- Controlla la documentazione in `docs/`
- Chiedi nella community

---

**Grazie per contribuire a Fidelix!** 🚀
