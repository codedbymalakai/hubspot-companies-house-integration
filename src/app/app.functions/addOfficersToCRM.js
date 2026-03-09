const axios = require("axios");

const contactsAPI = "https://api.hubapi.com/crm/v3/objects/contacts";
const searchContactsAPI =
  "https://api.hubapi.com/crm/v3/objects/contacts/search";
const BASE_COMPANIES_HOUSE_URL =
  "https://api.company-information.service.gov.uk";

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseOfficerName(name = "") {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { firstName: "", lastName: "" };
  }

  if (trimmedName.includes(",")) {
    const [last = "", firstPart = ""] = trimmedName.split(",");
    const firstName = toTitleCase(firstPart.trim());
    const lastName = toTitleCase(last.trim());

    return { firstName, lastName };
  }

  const parts = trimmedName.split(/\s+/).filter(Boolean);
  const firstName = toTitleCase(parts[0] || "");
  const lastName = toTitleCase(parts[parts.length - 1] || "");

  return { firstName, lastName };
}

exports.main = async (context = {}) => {
  const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];
  if (!ACCESS_TOKEN) {
    return {
      statusCode: 400,
      body: { ok: false, error: "Access Token is required" },
    };
  }
  const COMPANIES_HOUSE_API_KEY = process.env["COMPANIES_HOUSE_API_KEY"];
  if (!COMPANIES_HOUSE_API_KEY) {
    return {
      statusCode: 400,
      body: { ok: false, error: "Companies House API key is required" },
    };
  }
  const config = {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  const companyNumber = context.parameters?.companyNumber;
  const companyId = context.parameters?.companyId;
  if (!companyNumber || !companyId) {
    return {
      statusCode: 400,
      body: { ok: false, error: "Company number and companyId are required" },
    };
  }
  // Arrays to hold officer names and newly created contact IDs
  const createdContacts = [];

  // Fetch company officers from the Companies House API
  try {
    // Officers Info
    const officersResponse = await axios.get(
      `${BASE_COMPANIES_HOUSE_URL}/company/${companyNumber}/officers`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );

    const officers = (officersResponse.data.items || []).map((officer) =>
      parseOfficerName(officer.name),
    );

    for (const officer of officers) {
      const { firstName, lastName } = officer;

      if (!firstName) {
        continue;
      }

      const email = lastName
        ? `${firstName.toLowerCase().replaceAll(" ", "")}.${lastName.toLowerCase()}.${companyNumber}@example.com`
        : `${firstName.toLowerCase().replaceAll(" ", "")}.${companyNumber}@example.com`;

      const payload = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
      };

      const searchResponse = await axios.post(
        searchContactsAPI,
        payload,
        config,
      );
      const existingContacts = searchResponse.data?.results || [];

      if (existingContacts.length > 0) {
        continue;
      }
      // Create contact IF contact isn't found.
      const contactData = {
        properties: {
          email: email || "",
          firstname: firstName || "",
          lastname: lastName || "",
        },
      };

      const contactResponse = await axios.post(
        contactsAPI,
        contactData,
        config,
      );

      const contactId = contactResponse.data?.id;
      if (contactId) {
        createdContacts.push(contactId);
      }
    }
  } catch (error) {
    return {
      statusCode: error?.response?.status || 500,
      body: {
        ok: false,
        error: error.message || "Unknown Error",
      },
    };
  }

  try {
    if (companyId && createdContacts.length > 0) {
      for (let contactId of createdContacts) {
        const associationUrl = `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/default/company/${companyId}`;

        const assocResponse = await axios.put(associationUrl, null, config);
        if (assocResponse.status !== 200) {
          console.error(
            `Failed to associate contact ${contactId} with company ${companyId}`,
          );
        } else {
          console.log(
            `Associated contact ${contactId} with company ${companyId}`,
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
    console.error("Error associating contacts:", error);
    return {
      statusCode: 500,
      body: {
        ok: false,
        error: error.message || "Unknown Error",
      },
    };
  }

  // Return success response
  return {
    statusCode: 200,
    body: {
      ok: true,
      message: "Contacts are in the CRM!",
    },
  };
};
