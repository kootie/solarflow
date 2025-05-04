import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Flex,
} from '@chakra-ui/react';
import { addDevice } from '../utils/kernl';

interface DeviceManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded?: () => void;
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ 
  isOpen, 
  onClose,
  onDeviceAdded 
}) => {
  const [deviceAddress, setDeviceAddress] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'solar_panel' | 'battery' | 'ev_charger' | 'home' | 'grid'>('solar_panel');
  const [initialBalance, setInitialBalance] = useState('');
  const toast = useToast();

  const handleAddDevice = async () => {
    if (!deviceAddress || !deviceName || !initialBalance) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addDevice(deviceAddress, deviceName, deviceType, initialBalance);
      
      toast({
        title: 'Device Added',
        description: `Device ${deviceName} (${deviceAddress}) has been added with ${initialBalance} KRNL`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setDeviceAddress('');
      setDeviceName('');
      setDeviceType('solar_panel');
      setInitialBalance('');
      
      // Notify parent and close modal
      if (onDeviceAdded) {
        onDeviceAdded();
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add device',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const getRandomAddress = () => {
    const hex = '0123456789abcdef';
    let addr = '0x';
    
    for (let i = 0; i < 40; i++) {
      addr += hex[Math.floor(Math.random() * hex.length)];
      if (i === 3 || i === 37) {
        addr += '...';
        i += 3;
      }
    }
    
    setDeviceAddress(addr);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Device</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Device Name</FormLabel>
              <Input
                placeholder="Enter device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Device Type</FormLabel>
              <Select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as any)}
              >
                <option value="solar_panel">Solar Panel</option>
                <option value="battery">Battery Storage</option>
                <option value="ev_charger">EV Charger</option>
                <option value="home">Home</option>
                <option value="grid">Grid Connection</option>
              </Select>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Device Address</FormLabel>
              <Flex>
                <Input
                  placeholder="0x..."
                  value={deviceAddress}
                  onChange={(e) => setDeviceAddress(e.target.value)}
                  mr={2}
                />
                <Button size="sm" onClick={getRandomAddress}>
                  Generate
                </Button>
              </Flex>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Initial Balance (KRNL)</FormLabel>
              <Input
                type="number"
                placeholder="Enter initial balance"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                min="0"
                step="0.01"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleAddDevice}>
            Add Device
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeviceManagement; 