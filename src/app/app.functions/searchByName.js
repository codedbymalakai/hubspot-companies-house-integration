const axios = require('axios');

function toTitleCase(str) {
  if (typeof str !== 'string') {
    return '';
  }
  const newStr = str.slice(0, 1).toUpperCase() + str.toLowerCase().slice(1);
  return newStr;
}

exports.main = async (context = {}) => {
  const URL = `https://api.company-information.service.gov.uk/advanced-search/companies`;
  const COMPANIES_HOUSE_API_KEY = process.env['COMPANIES_HOUSE_API_KEY'];
  if (!COMPANIES_HOUSE_API_KEY) {
    return {
      statusCode: 400,
      body: { ok: false, error: 'Companies House API key is required' },
    };
  }

  const companyName = context?.parameters?.companyName;
  if (!companyName) {
    return {
      statusCode: 400,
      body: { ok: false, error: 'Company name is required' },
    };
  }

  try {
    const searchResponse = await axios.get(
      `${URL}?company_name_includes=${encodeURIComponent(companyName)}&company_status=active`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: '' },
      },
    );

    const companyArray = (searchResponse?.data?.items || []).map((element) => {
      return {
        title: element.title || 'Company has no title',
        companyNumber: element.company_number,
        status: toTitleCase(element.company_status) || 'Company has no status',
        locality: element.address?.locality || 'Company has no locality',
      };
    });
    return {
      statusCode: searchResponse.status || 200,
      body: { ok: true, data: companyArray },
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: {
        ok: false,
        error:
          error.message ||
          error.response?.data?.message ||
          'Could not search for company',
      },
    };
  }
};
