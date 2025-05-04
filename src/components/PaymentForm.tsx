import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Heading,
  useToast,
  Spinner,
  Text,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue
} from '@chakra-ui/react';
import { sendPayment, getConnectedDevices, getEnergyRate, Device } from '../utils/kernl';

interface PaymentFormProps {
  onPaymentSent?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentSent }) => {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'payment' | 'energy_sale' | 'distribution' | 'subsidy'>('payment');
  const [energyAmount, setEnergyAmount] = useState('');
  const [isEnergyTransaction, setIsEnergyTransaction] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [energyRate, setEnergyRate] = useState('0.10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');

  const fetchDevices = async () => {
    try {
      const deviceData = await getConnectedDevices();
      const rate = await getEnergyRate();
      
      setDevices(deviceData);
      setEnergyRate(rate);
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
  
  // Calculate amount based on energy when doing energy transactions
  useEffect(() => {
    if (isEnergyTransaction && energyAmount) {
      const calculatedAmount = (parseFloat(energyAmount) * parseFloat(energyRate)).toFixed(2);
      setAmount(calculatedAmount);
    }
  }, [isEnergyTransaction, energyAmount, energyRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAddress || !toAddress || !amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (isEnergyTransaction && !energyAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please enter energy amount for energy transactions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // Ensure amount is properly formatted
      const formattedAmount = parseFloat(amount).toString();
      
      // Send the payment with appropriate type and energy info
      const txHash = await sendPayment(
        fromAddress, 
        toAddress, 
        formattedAmount, 
        transactionType,
        isEnergyTransaction ? energyAmount : undefined
      );
      
      toast({
        title: 'Transaction Submitted',
        description: `Transaction hash: ${txHash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh device data to update balances
      await fetchDevices();

      // Reset form - Set these after the device data has been refreshed
      setFromAddress('');
      setToAddress('');
      setAmount('');
      setEnergyAmount('');
      
      // Notify parent if needed
      if (onPaymentSent) {
        onPaymentSent();
      }

      // Force a re-render by triggering a state change
      setLoading(true);
      setTimeout(() => setLoading(false), 10);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getActiveDevices = () => {
    return devices.filter(device => device.status === 'active');
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
      <Heading size="md" mb={6}>Send Payment</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={6}>
          <FormControl isRequired>
            <FormLabel>Transaction Type</FormLabel>
            <Select
              value={transactionType}
              onChange={(e) => {
                const newType = e.target.value as 'payment' | 'energy_sale' | 'distribution' | 'subsidy';
                setTransactionType(newType);
                setIsEnergyTransaction(newType === 'energy_sale');
              }}
            >
              <option value="payment">Regular Payment</option>
              <option value="energy_sale">Energy Sale</option>
              <option value="distribution">Revenue Distribution</option>
              <option value="subsidy">Subsidy or Credit</option>
            </Select>
            <FormHelperText>
              Select the type of transaction you want to perform
            </FormHelperText>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>From Device</FormLabel>
            <Select
              placeholder="Select source device"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              key={`from-${devices.map(d => `${d.address}-${d.balance}`).join('-')}`}
            >
              {getActiveDevices().map((device) => (
                <option key={`${device.address}-${device.balance}`} value={device.address}>
                  {device.name} - {device.address} (${device.balance} KRNL)
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>To Device</FormLabel>
            <Select
              placeholder="Select destination device"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              key={`to-${devices.map(d => `${d.address}-${d.balance}`).join('-')}`}
            >
              {getActiveDevices().map((device) => (
                <option key={`${device.address}-${device.balance}`} value={device.address}>
                  {device.name} - {device.address} (${device.balance} KRNL)
                </option>
              ))}
            </Select>
          </FormControl>

          {isEnergyTransaction && (
            <FormControl isRequired>
              <FormLabel>Energy Amount (kWh)</FormLabel>
              <NumberInput
                min={0}
                value={energyAmount}
                onChange={(valueString) => setEnergyAmount(valueString)}
              >
                <NumberInputField placeholder="Enter energy amount" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Current rate: ${energyRate}/kWh (${amount} KRNL total)
              </FormHelperText>
            </FormControl>
          )}

          <FormControl isRequired={!isEnergyTransaction}>
            <FormLabel>Amount (KRNL)</FormLabel>
            <NumberInput
              min={0}
              value={amount}
              onChange={(valueString) => setAmount(valueString)}
              isDisabled={isEnergyTransaction}
            >
              <NumberInputField placeholder="Enter amount" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {isEnergyTransaction && (
              <FormHelperText>
                Amount is calculated automatically based on energy and rate
              </FormHelperText>
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            mt={4}
            isLoading={loading}
          >
            Send Payment
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default PaymentForm; 