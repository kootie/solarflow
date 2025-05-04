import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Text,
  Flex,
  Select,
  Input,
  Button,
  FormControl,
  FormLabel,
  useColorModeValue
} from '@chakra-ui/react';
import { getTransactions, getConnectedDevices, Transaction, Device } from '../utils/kernl';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDevice, setFilterDevice] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txData, deviceData] = await Promise.all([
          getTransactions(),
          getConnectedDevices()
        ]);
        
        setTransactions(txData);
        setDevices(deviceData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transaction data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilter = async () => {
    setLoading(true);
    
    try {
      const filter: any = {};
      
      if (filterDevice) {
        filter.address = filterDevice;
      }
      
      if (filterType) {
        filter.type = filterType;
      }
      
      if (startDate) {
        filter.fromDate = new Date(startDate).getTime();
      }
      
      if (endDate) {
        filter.toDate = new Date(endDate).getTime();
      }
      
      const filteredTransactions = await getTransactions(filter);
      setTransactions(filteredTransactions);
      setError(null);
    } catch (err) {
      setError('Failed to fetch filtered transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilter = async () => {
    setFilterDevice('');
    setFilterType('');
    setStartDate('');
    setEndDate('');
    
    setLoading(true);
    
    try {
      const txData = await getTransactions();
      setTransactions(txData);
      setError(null);
    } catch (err) {
      setError('Failed to reset transaction data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceName = (address: string): string => {
    const device = devices.find(d => d.address === address);
    return device ? device.name : address;
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'payment':
        return 'blue';
      case 'energy_sale':
        return 'green';
      case 'distribution':
        return 'purple';
      case 'subsidy':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && transactions.length === 0) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md">
      <Heading size="md" mb={6}>Transaction History</Heading>
      
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
          <FormControl>
            <FormLabel>Device</FormLabel>
            <Select 
              placeholder="All Devices"
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
            >
              {devices.map((device) => (
                <option key={device.address} value={device.address}>
                  {device.name} ({device.address})
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Transaction Type</FormLabel>
            <Select 
              placeholder="All Types"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="payment">Payment</option>
              <option value="energy_sale">Energy Sale</option>
              <option value="distribution">Distribution</option>
              <option value="subsidy">Subsidy</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>From Date</FormLabel>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>To Date</FormLabel>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormControl>
          
          <Button colorScheme="blue" onClick={applyFilter} isLoading={loading}>
            Apply Filter
          </Button>
          
          <Button variant="outline" onClick={resetFilter} isLoading={loading}>
            Reset
          </Button>
        </Flex>
      </Box>
      
      {loading && <Spinner size="sm" mr={2} />}
      
      {transactions.length === 0 ? (
        <Box p={4} textAlign="center">
          <Text>No transactions found</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg={headerBg}>
              <Tr>
                <Th>Transaction ID</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th isNumeric>Amount (KRNL)</Th>
                <Th>Type</Th>
                <Th>Energy (kWh)</Th>
                <Th>Date & Time</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((tx) => (
                <Tr key={tx.id}>
                  <Td fontSize="sm" fontFamily="mono">{tx.id.substring(0, 10)}...</Td>
                  <Td>{getDeviceName(tx.fromAddress)}</Td>
                  <Td>{getDeviceName(tx.toAddress)}</Td>
                  <Td isNumeric fontWeight="bold">${tx.amount}</Td>
                  <Td>
                    <Badge colorScheme={getTransactionTypeColor(tx.type)}>
                      {tx.type.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>{tx.energyAmount || '-'}</Td>
                  <Td fontSize="sm">{formatDate(tx.timestamp)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default TransactionHistory; 