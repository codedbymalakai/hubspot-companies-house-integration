# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CH-Card for Deals** — A HubSpot CRM UI Extension (platform version 2025.1) that embeds a card in Deal records. It integrates with the UK Companies House API to search for companies, sync company data to deal properties, and create HubSpot contacts from company officers.

## Development Commands

```bash
# Install HubSpot CLI (if not already installed)
npm install -g @hubspot/cli

# Authenticate with HubSpot
hs auth

# Start local development (hot-reloading)
hs project dev

# Upload/deploy to HubSpot
hs project upload
```

There are no test or lint commands configured in this project.

## Architecture

### Structure

```
src/app/
├── extensions/
│   ├── Example.jsx          # Main React UI component
│   └── example-card.json    # CRM card definition (object type: deals)
└── app.functions/
    ├── example-function.js  # Fetch company by number (Companies House)
    ├── searchByName.js      # Search companies by name (Companies House)
    ├── updateCompanyNumber.js  # Update deal with company reg number
    ├── addOfficersToCRM.js  # Create HubSpot contacts from CH officers
    ├── addToProperties.js   # Write CH data to deal/company properties
    └── serverless.json      # Maps function names to files + secrets
```

### Data Flow

The React component (`Example.jsx`) runs inside the HubSpot CRM and calls serverless functions via `hubspot.serverless()`. The serverless functions then call the external APIs server-side (Companies House and HubSpot API).

**Search → Select → Sync flow:**
1. User searches by company name or number → `searchByName` or `getData` serverless function hits Companies House API
2. User selects a result → `updateCompanyNumber` writes `company_registration_number_crn` to the deal
3. User clicks "View Details" → `getData` fetches full company info
4. User clicks "Sync Officers to CRM" → `addOfficersToCRM` creates contacts (or finds existing by email) and associates them with the deal/company
5. User clicks "Add to Properties" → `addToProperties` writes CH fields to deal properties

### State Management

`Example.jsx` uses a `mood` string to drive conditional rendering: `'idle'`, `'loading'`, `'success'`, `'error'`, `'successName'`, `'errorName'`.

### Secrets / Environment Variables

Configured in HubSpot project secrets (not `.env`):
- `COMPANIES_HOUSE_API_KEY` — used as Basic Auth (key + empty password) for Companies House API
- `ACCESS_TOKEN` — HubSpot private app token for CRM API calls

### HubSpot Properties Used

Deal properties written by this app:
- `company_registration_number_crn`
- `companies_house_number`
- `ch_incorporation_date`
- `ch_officer_s`
- `ch_sic_code`
- `ch_company_type`
- `ch_company_status`
- `ch_registered_office_address`

### Officer Contact Generation

Officers are created as HubSpot contacts using a generated email: `firstname.lastname.{companyNumber}@example.com`. Names from Companies House arrive in `"LASTNAME, Firstname"` format and are parsed/converted by `addOfficersToCRM.js`.
