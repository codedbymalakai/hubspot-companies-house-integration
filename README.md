# Companies House → HubSpot CRM Automation

A HubSpot CRM card that retrieves company data from the UK Companies House API and automatically populates HubSpot records. The tool also creates HubSpot contacts for company officers and associates them with the company.

This project demonstrates API integration, serverless functions, and CRM automation within HubSpot.

---

## Features

- Search Companies House by company number
- Display company information inside a HubSpot CRM card
- Automatically create HubSpot contacts for company officers
- Associate officers with the company record
- Populate HubSpot company properties with Companies House data

---

## Tech Stack

- JavaScript
- React (HubSpot UI Extensions)
- Node.js serverless functions
- Axios
- HubSpot CRM API
- Companies House API

---

## Architecture

HubSpot CRM Card (React)
->
Serverless Functions
->
Companies House API
->
HubSpot CRM API

### Flow

1. User enters a Companies House number.
2. A serverless function retrieves company data from the Companies House API.
3. The UI card displays the retrieved company information.
4. The user can:
   - create HubSpot contacts for company officers
   - populate HubSpot company properties with Companies House data
5. Contacts are automatically associated with the HubSpot company record.

---

## Running the Project Locally

### Requirements

- A HubSpot account
- HubSpot CLI installed
- Access to HubSpot developer projects

Install the HubSpot CLI if needed:
npm install -g @hubspot/cli

npm install -g @hubspot/cli
hs project dev

This will start the development environment and allow the CRM card and serverless functions to run inside HubSpot.

---

## Learning Outcomes

This project demonstrates:

- Integrating external APIs into CRM systems
- Automating data entry workflows
- Building HubSpot UI extensions with React
- Writing serverless backend logic
- Handling asynchronous frontend–backend communication
- Structuring API responses and error handling

---

## Future Improvements

Possible improvements for the project include:

- Searching companies by name instead of only company number
- Improved validation and formatting of officer data
- Enhanced UI feedback (loading states, error messages, etc.)
- Additional automation features for CRM workflows
