const axios = require("axios");

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function firstNameLastNameFormatter(arr) {
  const officerNames = arr.map((element) => {
    if (element.includes(",")) {
      const [last, first] = element.split(",");
      return `${first.trim()} ${toTitleCase(last)}`;
    } else {
      return toTitleCase(element);
    }
  });
  return officerNames;
}

exports.main = async (context = {}) => {
  const BASE_URL = "https://api.company-information.service.gov.uk";
  const COMPANIES_HOUSE_API_KEY = process.env["COMPANIES_HOUSE_API_KEY"];

  try {
    const companyNumber = context.parameters?.companyNumber;
    if (!companyNumber) {
      return {
        statusCode: 400,
        body: { ok: false, error: "Company number is required" },
      };
    }

    const companyResponse = await axios.get(
      `${BASE_URL}/company/${companyNumber}`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );

    const statusCode = companyResponse.status;
    const data = companyResponse.data;
    const status = capitalizeFirst(data.company_status) || "N/A";
    const type = capitalizeFirst(data.type) || "N/A";
    const incorporationDate = data.date_of_creation || "N/A";

    const address = data.registered_office_address;
    const office_address =
      [
        address?.address_line_1,
        address?.address_line_2,
        address?.locality,
        address?.postal_code,
        address?.country,
      ]
        .filter(Boolean)
        .join(", ") || "No registered office address available";

    const sicCode = data.sic_codes?.[0] || "No SIC code available";

    const officersResponse = await axios.get(
      `${BASE_URL}/company/${companyNumber}/officers`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );

    const officersArray =
      officersResponse?.data?.items?.map((officer) => officer.name) || [];

    const officerString = firstNameLastNameFormatter(officersArray).join(`, `);

    // Return a structured response containing all company details and officer information.
    return {
      statusCode,
      body: {
        ok: true,
        status,
        type,
        incorporationDate,
        office_address,
        sicCode,
        officerString,
      },
    };
    // Catch and log any errors that occur during API calls or data processing for debugging.
  } catch (error) {
    return {
      statusCode: error?.response?.status || 500,
      body: { ok: false, error: error.message || "Unknown Error" },
    };
  }
};
