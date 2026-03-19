import React, { useState } from 'react';
import {
  Divider,
  Button,
  Text,
  Input,
  Flex,
  hubspot,
  Form,
  Box,
  Tile,
  LoadingSpinner,
} from '@hubspot/ui-extensions';

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const Extension = ({ runServerless, sendAlert, context }) => {
  const [searchNameValue, setSearchNameValue] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [mood, setMood] = useState('idle');
  const [lastSearchedCompanyNumber, setLastSearchedCompanyNumber] =
    useState('');
  const [companyArray, setCompanyArray] = useState([]);

  const handleSubmit = async (companyNumber) => {
    if (!companyNumber) {
      setMood('error');
      sendAlert({ message: 'Company number is not valid', type: 'danger' });
      return;
    }
    setMood('loading');
    setCompanyData(null);

    try {
      const { response } = await runServerless({
        name: 'getData',
        parameters: { companyNumber },
      });
      if (!response?.body?.ok) {
        setMood('error');
        return;
      }
      setCompanyData(response.body);
      setMood('success');
      setLastSearchedCompanyNumber(companyNumber);
    } catch (error) {
      console.error('Error fetching company data:', error);
      sendAlert({ message: 'Error fetching company data', type: 'danger' });
      setMood('error');
    }
  };

  const handleCompanySelect = async (companyNumber) => {
    const dealId = context?.crm?.objectId;
    try {
      const { response } = await runServerless({
        name: 'updateCompanyNumber',
        parameters: { companyNumber, dealId },
      });
      if (!response?.body?.ok) {
        sendAlert({
          message: response?.body?.error || 'Error!',
          type: 'danger',
        });
        setMood('error');
        return;
      }
      sendAlert({
        message:
          'Successfully updated the company registration number (CRN) property',
        type: 'success',
      });
      await handleSubmit(companyNumber);
    } catch (error) {
      console.error('Error selecting company:', error);
      setMood('error');
    }
  };

  const handleNameSubmit = async () => {
    const companyName = searchNameValue.trim();
    if (!companyName) {
      sendAlert({ message: 'Company name is not valid', type: 'danger' });
      return;
    }
    try {
      const { response } = await runServerless({
        name: 'searchByName',
        parameters: { companyName },
      });
      if (!response?.body?.ok) {
        sendAlert({
          message: response?.body?.error || 'Request Failed',
          type: 'danger',
        });
        setMood('error');
        return;
      }
      setCompanyArray(response.body.data);
      setMood('successName');
    } catch (error) {
      console.error('Error searching by name:', error);
      setMood('error');
    }
  };

  return (
    <Box>
      <Tile>
        <Form onSubmit={handleNameSubmit}>
          <Flex direction='row' gap='md' align='end'>
            <Input
              name='companyName'
              label='Enter the Company Name'
              placeholder='e.g. Apple Ltd'
              value={searchNameValue}
              onChange={(value) => setSearchNameValue(value)}
            />
            <Button type='submit'>Search</Button>
          </Flex>
        </Form>
      </Tile>

      <Divider size='medium' />

      {mood === 'loading' && (
        <Tile>
          <Box padding='md' border='default' textAlign='center'>
            <LoadingSpinner
              label='Loading company data...'
              layout='centered'
              size='md'
              showLabel={true}
            />
          </Box>
        </Tile>
      )}

      {mood === 'successName' && (
        <Tile>
          <Box padding='md' border='default'>
            <Flex direction='row' justify='between' align='center'>
              <Text
                format={{ fontWeight: 'bold', lineDecoration: 'underline' }}
              >
                Search Results:
              </Text>
              <Text>
                {companyArray.length}{' '}
                {companyArray.length === 1 ? 'company' : 'companies'} found
              </Text>
            </Flex>
            <Box marginTop='sm'>
              {companyArray.length > 0 ? (
                companyArray.map((company) => (
                  <Tile compact={true} key={company.companyNumber}>
                    <Box marginBottom='sm'>
                      <Text format={{ fontWeight: 'bold' }}>
                        {company.title}
                      </Text>
                      <Text>
                        Company number: {company.companyNumber} •{' '}
                        {company.status}
                      </Text>
                      <Button
                        onClick={() =>
                          handleCompanySelect(company.companyNumber)
                        }
                      >
                        Select
                      </Button>
                    </Box>
                  </Tile>
                ))
              ) : (
                <Text>No Companies Found</Text>
              )}
            </Box>
          </Box>
        </Tile>
      )}

      {mood === 'success' && (
        <Tile>
          <Box padding='md' border='default'>
            <Text format={{ fontWeight: 'bold', lineDecoration: 'underline' }}>
              Company Information
            </Text>
            <Text>Company Name: {companyData?.companyName}</Text>
            <Text>Company Number: {lastSearchedCompanyNumber}</Text>
            <Text>Status: {companyData?.status}</Text>
            <Text>Type: {companyData?.type}</Text>
            <Text>Officers: {companyData?.officerString}</Text>
            <Text>Incorporation Date: {companyData?.incorporationDate}</Text>
            <Text>
              Registered Office Address: {companyData?.office_address}
            </Text>
            <Text>SIC Code: {companyData?.sicCode}</Text>
          </Box>
        </Tile>
      )}

      {mood === 'error' && (
        <Tile>
          <Box padding='md' border='default'>
            <Text>
              Something went wrong. Please check the details and try again.
            </Text>
          </Box>
        </Tile>
      )}
    </Box>
  );
};
