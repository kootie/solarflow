import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Spinner, 
  Button,
  Flex, 
  useToast,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { getConnectedDevices, updateDeviceStatus, Device } from '../utils/kernl';

const DeviceList: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const fetchDevices = async () => {
    try {
      const deviceData = await getConnectedDevices();
      setDevices(deviceData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleStatusChange = async (address: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateDeviceStatus(address, newStatus);
      
      toast({
        title: 'Status Updated',
        description: `Device ${address} is now ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh device list
      await fetchDevices();
      
      // Notify parent if needed
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update device status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getDeviceEmoji = (type: string): string => {
    switch (type) {
      case 'solar_panel':
        return '☀️'; // sun with rays
      case 'battery':
        return '🔋'; // battery
      case 'ev_charger':
        return '🚗'; // car
      case 'home':
        return '🏠'; // house
      case 'grid':
        return '🔌'; // electric plug
      default:
        return '⚡'; // high voltage
    }
  };

  const getDeviceTypeLabel = (type: string): string => {
    switch (type) {
      case 'solar_panel':
        return 'Solar Panel';
      case 'battery':
        return 'Battery';
      case 'ev_charger':
        return 'EV Charger';
      case 'home':
        return 'Home';
      case 'grid':
        return 'Grid';
      default:
        return type;
    }
  };

  const getDeviceColor = (type: string): string => {
    switch (type) {
      case 'solar_panel':
        return 'yellow';
      case 'battery':
        return 'blue';
      case 'ev_charger':
        return 'green';
      case 'home':
        return 'orange';
      case 'grid':
        return 'purple';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md" textAlign="center">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md">
      <Heading size="md" mb={6}>Connected Devices</Heading>
      
      {devices.length === 0 ? (
        <Box p={4} textAlign="center">
          <Text>No devices found</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {devices.map((device) => {
            const colorScheme = getDeviceColor(device.type);
            const deviceEmoji = getDeviceEmoji(device.type);
            
            return (
              <Box
                key={device.address}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg={device.status === 'active' ? `${colorScheme}.50` : cardBg}
                position="relative"
                overflow="hidden"
                boxShadow="sm"
              >
                <Badge
                  position="absolute"
                  top={0}
                  right={0}
                  m={2}
                  colorScheme={device.status === 'active' ? 'green' : 'red'}
                >
                  {device.status}
                </Badge>
                
                <Flex align="center" mb={3}>
                  <Text fontSize="24px" mr={3}>{deviceEmoji}</Text>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">{device.name}</Text>
                    <Text color="gray.500" fontSize="sm">{getDeviceTypeLabel(device.type)}</Text>
                  </Box>
                </Flex>
                
                <Text fontWeight="bold" color="green.600">
                  ${device.balance} KRNL
                </Text>
                
                <Text fontSize="sm" my={3} color="gray.600">
                  {device.address}
                </Text>
                
                {device.energyProduced && (
                  <Text fontSize="sm" color="yellow.600">
                    Energy Produced: {device.energyProduced} kWh
                  </Text>
                )}
                
                {device.energyConsumed && (
                  <Text fontSize="sm" color="blue.600">
                    Energy Consumed: {device.energyConsumed} kWh
                  </Text>
                )}
                
                <Button
                  mt={4}
                  size="sm"
                  width="full"
                  colorScheme={device.status === 'active' ? 'red' : 'green'}
                  variant="outline"
                  onClick={() => handleStatusChange(
                    device.address, 
                    device.status === 'active' ? 'inactive' : 'active'
                  )}
                >
                  {device.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default DeviceList; 