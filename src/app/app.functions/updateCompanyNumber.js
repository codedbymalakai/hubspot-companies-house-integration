const axios = require('axios');
exports.main = async (context = {}) => {
  const baseApiEndpoint = `https://api.hubapi.com/crm/v3/objects/deals/`;

  const ACCESS_TOKEN = process.env['ACCESS_TOKEN'];
  console.log(ACCESS_TOKEN);
  if (!ACCESS_TOKEN) {
    return {
      statusCode: 400,
      body: { ok: false, error: 'Access Token is required' },
    };
  }

  const companyNumber = context.parameters?.companyNumber;
  const dealId = context.parameters?.dealId;

  if (!companyNumber || !dealId) {
    return {
      statusCode: 400,
      body: { ok: false, error: 'Company number and company ID is required' },
    };
  }

  const config = {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  const payload = {
    properties: {
      company_registration_number_crn: companyNumber,
    },
  };
  // Attempt to send the update request to HubSpot
  console.log('BEFORE API CALL');
  try {
    const updateResponse = await axios.patch(
      `${baseApiEndpoint}${dealId}`,
      payload,
      config,
    );
    console.log(updateResponse);
    if (updateResponse.status !== 200) {
      console.error(`Failed to add properties to the CRM`);
    } else {
      console.log(`Added properties to the CRM`);
    }
    return {
      statusCode: updateResponse.status || 200,
      body: { ok: true, message: 'Properties added to the CRM!' },
    };
  } catch (error) {
    console.log(error.message);
    return {
      statusCode: error?.response?.status || 500,
      body: { ok: false, error: error.message || 'Unknown Error' },
    };
  }
};
