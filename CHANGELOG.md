# Fidelix - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- PostgreSQL database schema with multi-tenant support
- Row Level Security policies for data isolation
- Supabase Edge Functions:
  - `generate-client-id`: Create anonymous clients
  - `register-scan`: Process QR scans and loyalty logic
- React PWA frontend with:
  - Client card view with QR code
  - Admin login and dashboard
  - QR scanner for admin
  - Product selection interface
- Complete documentation:
  - Architecture guide
  - Setup instructions
  - API documentation
  - Product roadmap
- Seed data for demo tenant

### Security
- Multi-tenant isolation via RLS
- JWT-based admin authentication
- QR code validation

## [0.1.0] - 2026-01-26

### Added
- Project initialization
- Core MVP features
- Basic loyalty engine (buy X get Y)
- Demo environment setup

---

**Legend**:
- `Added`: New features
- `Changed`: Changes in existing functionality
- `Deprecated`: Soon-to-be removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security improvements
