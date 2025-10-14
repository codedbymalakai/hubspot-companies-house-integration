exports.main = async (context = {}) => {
    // Base HubSpot API endpoint for updating company records
    const baseApiEndpoint = `https://api.hubapi.com/crm/v3/objects/companies/`;
    // Securely retrieve the HubSpot access token from environment variables (HubSpot injects this automatically)
    const ACCESS_TOKEN = process.env["ACCESS_TOKEN"];
    // Extract company-related parameters passed from the front end or use default placeholder values for testing
    const companyNumber = context.parameters?.companyNumber || "12345678";
    const companyId = context.parameters?.companyId || "";
    const companyStatus = context.parameters?.status || "InActive";
    const companyIncorporationDate = context.parameters?.incorporationDate || "2025-10-10";
    const companySicCode = context.parameters?.sicCode || "12345";
    const companyOfficeAddress = context.parameters?.officeAddress || "123 Main Lane";
    const companyOfficers = context.parameters?.officers;
    console.log("companyOfficers = ", companyOfficers);
    console.log("context.parameters?.officers = ", context.parameters?.officers);
    const companyType = context.parameters?.type;

    // Define the PATCH request options for updating HubSpot company properties  
    // Includes authentication headers and the request body with updated company details
    const Options = {
        method: "PATCH",
        headers: {Authorization: `Bearer ${ACCESS_TOKEN}`, 
            'Content-Type': 'application/json',
        },
        body: `{"properties":{"companies_house_number":"${companyNumber}","ch_incorporation_date":"${companyIncorporationDate}","ch_officer_s":"${companyOfficers}","ch_sic_code":"${companySicCode}","ch_company_type":"${companyType}","ch_company_status":"${companyStatus}","ch_registered_office_address":"${companyOfficeAddress}"}}`
    }
     // Attempt to send the update request to HubSpot
    try {
    const updateResponse = await fetch(`${baseApiEndpoint}${companyId}`, Options);
    const data = await updateResponse.json();

    // Log success or failure messages depending on the API response
    if (!updateResponse.ok) {
        console.error("Failed to update properties:", data);
    } else {
        console.log("Updated properties successfully:", data);
    }
    // Catch and log any unexpected errors during the API request
    } catch (error) {
        console.error("Error updating properties:", error);
    }
     // Return a 200 status code to confirm the function executed successfully
    return {
        statusCode: 200,
        body: {
        }
    }
}