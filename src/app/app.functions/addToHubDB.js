const axios = require("axios");
// Define HubSpot API endpoints for contact creation and contact search
const HubDBAPI = "https://api.hubapi.com/cms/v3/hubdb/tables/800778470/rows";

// Main serverless function for syncing details with HubDB Table
exports.main = async (context = {}) => {
    const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];
    const companyNumber = context.parameters?.companyNumber || "12345678";
    const companyId = context.parameters?.companyId || "";
    const companyStatus = context.parameters?.status || "InActive";
    const companyIncorporationDate = context.parameters?.incorporationDate || "2025-10-10";
    const companySicCode = context.parameters?.sicCode || "12345";
    const companyOfficeAddress = context.parameters?.officeAddress || "123 Main Lane";
    const companyOfficers = context.parameters?.officers;
    const companyType = context.parameters?.type;

}