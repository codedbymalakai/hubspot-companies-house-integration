const axios = require("axios");
// Define HubSpot API endpoints for contact creation and contact search
const contactsAPI = "https://api.hubapi.com/crm/v3/objects/contacts";
const searchContactsAPI =
  "https://api.hubapi.com/crm/v3/objects/contacts/search";

// Main serverless function for syncing Companies House officers with HubSpot contacts
exports.main = async (context = {}) => {
  // Securely retrieve access tokens and API keys from environment variables
  const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];
  const COMPANIES_HOUSE_API_KEY = process.env["COMPANIES_HOUSE_API_KEY"];
  // Define the Companies House API base URL
  const BASE_COMPANIES_HOUSE_URL =
    "https://api.company-information.service.gov.uk";
  // Retrieve company and officer details from context parameters or use fallback values
  const companyNumber = context.parameters?.companyNumber || "14617299";
  const companyId = context.parameters?.companyId;

  // Arrays to hold officer names and newly created contact IDs
  let officerList = [];
  let created_contacts = [];

  // Fetch company officers from the Companies House API
  try {
    // Officers Info
    const officersResponse = await axios.get(
      `${BASE_COMPANIES_HOUSE_URL}/company/${companyNumber}/officers`,
      {
        auth: { username: COMPANIES_HOUSE_API_KEY, password: "" },
      },
    );
    // Extract and clean officer names from API data
    // Format names as "First Last" and store them in officerList

    const officers = (officersResponse.data.items || [])
      .map((o) => {
        const [last, firstPart] = o.name.split(",");
        if (!firstPart) return last.trim(); // Handles names without commas
        const first = firstPart.trim();
        const formattedLast = last
          .trim()
          .toLowerCase()
          .replace(/^\w/, (c) => c.toUpperCase());
        return `${first} ${formattedLast}`;
      })
      .join("\n");
    officerList = officers.split("\n");
  } catch (error) {
    // Handle API or network errors
    // console.error(error, "Could not retrieve officers");
    console.error("Error: " + error.message);
    return { ok: false, error: error.message || "Unknown Error" };
  }
  try {
    // Create a contact for each officer

    for (let i = 0; i < officerList.length; i++) {
      const name = officerList[i];
      const parts = name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${companyNumber}@example.com`;

      // Prepare payload to search if the contact already exists by email
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

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      // Search existing HubSpot contacts by email
      console.log("before search api");
      const response = await fetch(searchContactsAPI, options);
      console.log("after search api");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const existingContacts = data.results || [];

      if (existingContacts.length === 0) {
        console.log("No existing contacts found. You can create a new one.");
        // Create contact IF contact isn't found.
        const contactData = {
          properties: {
            email: email,
            firstname: firstName,
            lastname: lastName,
          },
        };

        const options1 = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactData),
        };

        const contactResponse = await fetch(contactsAPI, options1);
        if (contactResponse.status === 201) {
          console.log(`Created contact: ${firstName} ${lastName} (${email})`);
          console.log(companyId);

          const createdContactData = await contactResponse.json();
          const contactID = createdContactData.id;
          created_contacts.push(contactID);
        }
      } else {
        // If contact already exists, skip creation
        console.log("Contact(s) already exist:", existingContacts);
      }
    }
  } catch (error) {
    // Handle any errors during the search or contact creation process
    console.log(error);
    console.error("Error searching contacts:", error);
    return { ok: false, error: error.message || "Unknown Error" };
  }

  // Associate newly created contacts with the corresponding HubSpot company record
  try {
    if (companyId && created_contacts.length > 0) {
      for (let contactId of created_contacts) {
        const associationUrl = `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/default/company/${companyId}`;

        const assocOptions = {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        };

        const assocResponse = await fetch(associationUrl, assocOptions);
        if (!assocResponse.ok) {
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
    return { ok: false, error: error.message || "Unknown Error" };
  }

  // Return success response
  return {
    statusCode: 200,
    body: {},
  };
};
