const axios = require("axios");
exports.main = async (context = {}) => {
  const baseApiEndpoint = `https://api.hubapi.com/crm/v3/objects/companies/`;

  const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];
  if (!ACCESS_TOKEN) {
    return {
      statusCode: 400,
      body: { ok: false, error: "Access Token is required" },
    };
  }

  const companyNumber = context.parameters?.companyNumber;
  const companyId = context.parameters?.companyId;

  if (!companyNumber || !companyId) {
    return {
      statusCode: 400,
      body: { ok: false, error: "Company number and company ID is required" },
    };
  }

  const companyStatus = context.parameters?.status || "No Status available";
  const companyIncorporationDate =
    context.parameters?.incorporationDate || "No Date available";
  const companySicCode = context.parameters?.sicCode || "No SIC Code available";
  const companyOfficeAddress =
    context.parameters?.officeAddress || "No Address available";
  const companyOfficers =
    context.parameters?.officers || "No Officers available";
  const companyType = context.parameters?.type || "No Type available";

  const config = {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  const payload = {
    properties: {
      companies_house_number: companyNumber,
      ch_incorporation_date: companyIncorporationDate,
      ch_officer_s: companyOfficers,
      ch_sic_code: companySicCode,
      ch_company_type: companyType,
      ch_company_status: companyStatus,
      ch_registered_office_address: companyOfficeAddress,
    },
  };
  // Attempt to send the update request to HubSpot
  try {
    const updateResponse = await axios.patch(
      `${baseApiEndpoint}${companyId}`,
      payload,
      config,
    );
    if (updateResponse.status !== 200) {
      console.error(`Failed to add properties to the CRM`);
    } else {
      console.log(`Added properties to the CRM`);
    }
    return {
      statusCode: updateResponse.status || 200,
      body: { ok: true, message: "Properties added to the CRM!" },
    };
  } catch (error) {
    return {
      statusCode: error?.response?.status || 500,
      body: { ok: false, error: error.message || "Unknown Error" },
    };
  }
};
