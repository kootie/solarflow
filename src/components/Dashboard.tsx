import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Text,
  useColorModeValue,
  Flex,
  Divider
} from '@chakra-ui/react';
import { getDashboardSummary, getEnergyRate } from '../utils/kernl';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<{
    totalDevices: number;
    activeDevices: number;
    totalBalance: string;
    totalTransactions: number;
    totalEnergyProduced: string;
    totalEnergyConsumed: string;
  } | null>(null);
  
  const [energyRate, setEnergyRate] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, rateData] = await Promise.all([
          getDashboardSummary(),
          getEnergyRate()
        ]);
        
        setSummary(summaryData);
        setEnergyRate(rateData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !summary) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Text color="red.500">{error || 'Failed to load data'}</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md">
      <Heading size="md" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
        <Stat p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
          <StatLabel color={textColor}>Total Devices</StatLabel>
          <StatNumber>{summary.totalDevices}</StatNumber>
          <StatHelpText>{summary.activeDevices} active</StatHelpText>
        </Stat>
        
        <Stat p={4} bg="green.50" borderRadius="md" boxShadow="sm">
          <StatLabel color={textColor}>Total Balance</StatLabel>
          <StatNumber>${summary.totalBalance} KRNL</StatNumber>
          <StatHelpText>{summary.totalTransactions} transactions</StatHelpText>
        </Stat>
        
        <Stat p={4} bg="yellow.50" borderRadius="md" boxShadow="sm">
          <StatLabel color={textColor}>Energy Conversion Rate</StatLabel>
          <StatNumber>${energyRate}/kWh</StatNumber>
          <StatHelpText>Current market rate</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      <Divider mb={6} />
      
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        p={4}
        bg="teal.50"
        borderRadius="md"
        boxShadow="sm"
      >
        <Box flex="1" textAlign={{ base: 'center', md: 'left' }} mb={{ base: 4, md: 0 }}>
          <Heading size="sm" mb={2}>Energy Produced</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            {summary.totalEnergyProduced} kWh
          </Text>
          <Text fontSize="sm" color={textColor}>
            Value: ${(parseFloat(summary.totalEnergyProduced) * parseFloat(energyRate)).toFixed(2)} KRNL
          </Text>
        </Box>
        
        <Box flex="1" textAlign={{ base: 'center', md: 'right' }}>
          <Heading size="sm" mb={2}>Energy Consumed</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            {summary.totalEnergyConsumed} kWh
          </Text>
          <Text fontSize="sm" color={textColor}>
            Value: ${(parseFloat(summary.totalEnergyConsumed) * parseFloat(energyRate)).toFixed(2)} KRNL
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default Dashboard; 