// Import the axios library to make HTTP requests to external APIs (like Companies House)
const axios = require("axios");

// Takes a string and returns it with the first letter is capitalised
// and the rest of the string in lowercase
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Converts a full string into title case by capitalising the first letter of each word
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Defines the main entry point for the HubSpot serverless function.
// 'context' object contains data passed from the front end (like CRM info)
exports.main = async (context = {}) => {
  const BASE_URL = "https://api.company-information.service.gov.uk";
  const COMPANIES_HOUSE_API_KEY = process.env["COMPANIES_HOUSE_API_KEY"];
  try {
    // Retreive company number from request parameter or use default value.
    const companyNumber = context.parameters?.companyNumber || "14617299";

    // Fetch general information from Companies House API
    const companyResponse = await axios.get(
      `${BASE_URL}/company/${companyNumber}`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );

    const statusCode = companyResponse.status;
    // Extract and format key company details
    const data = companyResponse.data;
    const status = capitalizeFirst(data.company_status);
    const type = capitalizeFirst(data.type);
    const incorporationDate = data.date_of_creation;

    const address = data.registered_office_address;
    const office_address = [
      address?.address_line_1,
      address?.address_line_2,
      address?.locality,
      address?.postal_code,
      address?.country,
      // The filter(Boolean) removes any undefined or empty address fields.
    ]
      .filter(Boolean)
      .join(", ");

    const sicCode = data.sic_codes?.[0] || "No SIC code available";

    // Fetch company officers from the Companies House API.
    // Loop through and collect all officer names.
    const officersArray = [];
    const officersResponse = await axios.get(
      `${BASE_URL}/company/${companyNumber}/officers`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );
    // console.log(officersResponse.response.status);
    // console.log("HELLOOOOOOOOOOOOOOOOOOOO");

    for (let i = 0; i < officersResponse.data.items.length; i++) {
      officersArray.push(officersResponse.data.items[i].name);
    }

    const officerNames = [];
    // Format each officer’s name into "FirstName LastName" format using string splitting and title casing.
    // Join all formatted names into a single string for display.
    for (let i = 0; i < officersArray.length; i++) {
      const parts = officersArray[i].split(",");
      const firstName = parts[1].trim();
      const lastName = toTitleCase(parts[0]);
      officerNames.push(`${firstName} ${lastName}`);
    }

    const officerString = officerNames.join(`, `);
    console.log(officerString);


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
