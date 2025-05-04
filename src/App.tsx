import React, { useState, useCallback } from 'react';
import { 
  ChakraProvider, 
  Box, 
  Container, 
  Heading, 
  VStack, 
  HStack, 
  Button, 
  useDisclosure, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel 
} from '@chakra-ui/react';
import DeviceList from './components/DeviceList';
import PaymentForm from './components/PaymentForm';
import DeviceManagement from './components/DeviceManagement';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const handleRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <HStack justifyContent="space-between">
              <Heading color="blue.600">
                SolarFlow
              </Heading>
              <Button colorScheme="green" onClick={onOpen}>
                Add New Device
              </Button>
            </HStack>
            
            <DeviceManagement 
              isOpen={isOpen} 
              onClose={onClose} 
              onDeviceAdded={handleRefresh} 
            />
            
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Dashboard</Tab>
                <Tab>Devices</Tab>
                <Tab>Payments</Tab>
                <Tab>Transaction History</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Dashboard key={`dashboard-${refreshCounter}`} />
                </TabPanel>
                <TabPanel>
                  <DeviceList key={`devices-${refreshCounter}`} onRefresh={handleRefresh} />
                </TabPanel>
                <TabPanel>
                  <PaymentForm key={`payments-${refreshCounter}`} />
                </TabPanel>
                <TabPanel>
                  <TransactionHistory key={`transactions-${refreshCounter}`} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
