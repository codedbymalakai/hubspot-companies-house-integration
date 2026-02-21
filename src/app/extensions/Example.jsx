// Imports React and the useState hook for managing component state
// along with various prebuilt HubSpot UI components
// from the @hubspot/ui-extensions library to build the extension's interface
import React, { useState } from "react";
import {
  Divider,
  Button,
  Text,
  Input,
  Flex,
  hubspot,
  Accordion,
  Form,
  Box,
  Tile,
} from "@hubspot/ui-extensions";

// Define the extension to be run within the Hubspot CRM... HubSpot gives us an object and we destructure its keys into the function
// connecting it to backend functions and in-app actions
// “Take the object HubSpot gives me, and immediately pull out context, runServerlessFunction, and actions from it.”
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

// Defines the main extension component
// logs the HubSpot context for debugging
// and sets up state variables for the search input and retrieved company data
const Extension = ({ runServerless, sendAlert, context }) => {
  const [searchValue, setSearchValue] = useState("");
  const [companyData, setCompanyData] = useState(null);
  const [mood, setMood] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Handles the form submission by getting the entered company number
  // calling the serverless function to fetch company data
  // logging the response, and either displaying the results or showing an error alert
  const handleSubmit = async () => {
    const companyNumber = searchValue.trim();
    if (!companyNumber) {
      setMood("error");
      setErrorMessage("No valid company number");
      sendAlert({ message: "Company number is not valid", type: "danger" });
      return;
    }
    setMood("loading");
    setCompanyData(null);

    try {
      const { response } = await runServerless({
        name: "getData",
        parameters: { companyNumber }, // pass input to serverless
      });

      if (response?.body?.error?.message) {
        sendAlert({ message: response.body.error.message, type: "danger" });
        setMood("error");
        setErrorMessage("Error: " + response.body.error.message);
        return;
      } else {
        setCompanyData(response.body); // store API results
        setMood("success");
        setErrorMessage("");
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      sendAlert({ message: "Error fetching company data", type: "danger" });
      setMood("error");
      setErrorMessage(
        error.message ? `Error: ${error.message}` : "Something went wrong.",
      );
    }
  };

  // Creates new contacts in HubSpot by sending the company number and ID to a serverless function
  // then shows a success alert if the officers are added or logs an error if the process fails
  const createContact = async () => {
    const companyNumber = searchValue.trim();
    const companyId = context.crm.objectId;
    try {
      const { response } = await runServerless({
        name: "addOfficersToCRM",
        parameters: { companyNumber, companyId },
      });

      sendAlert({
        message: `Officers added to the CRM successfully!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error creating contacts:", error);
    }
  };

  // Sends company details from the extension to a serverless function to update HubSpot company properties
  // including type, status, incorporation date, address, SIC code, and officers.
  // while logging any errors that occur in the process
  const addProperties = async () => {
    const companyId = context.crm.objectId;
    const companyNumber = searchValue.trim();
    const status = companyData.status;
    const type = companyData.type;
    const incorporationDate = companyData.incorporationDate;
    const officeAddress = companyData.office_address;
    const sicCode = companyData.sicCode;
    const officers = companyData.officerString;

    try {
      const { response } = await runServerless({
        name: "addToProperties",
        parameters: {
          companyNumber,
          companyId,
          status,
          type,
          incorporationDate,
          officeAddress,
          sicCode,
          officers,
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addToHubDBTable = async () => {
    const companyId = context.crm.objectId;
    const companyNumber = searchValue.trim();
    const status = companyData.status;
    const type = companyData.type;
    const incorporationDate = companyData.incorporationDate;
    const officeAddress = companyData.office_address;
    const sicCode = companyData.sicCode;
    const officers = companyData.officerString;

    try {
      const { response } = await runServerless({
        name: "addToHubDB",
        parameters: {
          companyNumber,
          companyId,
          status,
          type,
          incorporationDate,
          officeAddress,
          sicCode,
          officers,
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Returns the JSX layout for the extension UI
  // displaying a search form for a Companies House number inside an accordion
  // showing the retrieved company details once fetched
  // and providing buttons to sync officers to the CRM or add the data to HubSpot properties
  return (
    <Accordion title="Companies House Data Retrieval">
      <Tile>
        <Form onSubmit={handleSubmit}>
          <Flex direction="row" gap="md" align="end">
            <Input
              name="search"
              label="Enter the Companies House Number"
              placeholder="e.g. 14617299"
              value={searchValue}
              onChange={(value) => setSearchValue(value)}
            />
            <Button type="submit">Search</Button>
          </Flex>
        </Form>
      </Tile>

      <Divider size="medium" />

      {mood === "success" && (
        <Tile>
          <Box padding="md" border="default">
            <Text format={{ fontWeight: "bold", lineDecoration: "underline" }}>
              Company Information
            </Text>
            <Text>Company Number: {searchValue}</Text>
            <Text>Status: {companyData.status}</Text>
            <Text>Type: {companyData.type}</Text>
            <Text>Officers: {companyData.officerString}</Text>
            <Text>Incorporation Date: {companyData.incorporationDate}</Text>
            <Text>Registered Office Address: {companyData.office_address}</Text>
            <Text>SIC Code: {companyData.sicCode}</Text>
            <Button onClick={createContact}>Sync Officers to CRM</Button>
            <Button onClick={addProperties}>
              Add Information to Properties
            </Button>
            <Button onClick={addToHubDBTable}>Add to HubDB Table</Button>
          </Box>
        </Tile>
      )}
    </Accordion>
  );
};
