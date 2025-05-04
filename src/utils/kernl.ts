import { ethers } from 'ethers';

// Initialize provider
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'); // Replace with actual RPC URL

// Mock contract ABI for demonstration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockContractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Enhanced data models
export interface Transaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  timestamp: number;
  energyAmount?: string; // Optional energy amount associated with the transaction
  type: 'payment' | 'energy_sale' | 'distribution' | 'subsidy';
}

export interface Device {
  address: string;
  name: string;
  type: 'solar_panel' | 'battery' | 'ev_charger' | 'home' | 'grid';
  balance: string;
  status: 'active' | 'inactive';
  energyProduced?: string; // kWh produced (for generators)
  energyConsumed?: string; // kWh consumed (for consumers)
  owner: string; // User who owns this device
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
}

// Constants for energy-to-money conversion
let energyRate = '0.10'; // $0.10 per kWh
let peakHourRate = '0.15'; // $0.15 per kWh during peak hours

// Keep track of devices, balances, statuses, and transactions
let deviceBalances: { [key: string]: string } = {
  '0x1234...5678': '100',
  '0x8765...4321': '50',
  '0xabcd...efgh': '0',
};

let deviceStatuses: { [key: string]: 'active' | 'inactive' } = {
  '0x1234...5678': 'active',
  '0x8765...4321': 'active',
  '0xabcd...efgh': 'inactive',
};

let devices: Device[] = [
  {
    address: '0x1234...5678',
    name: 'Home Solar Panel',
    type: 'solar_panel',
    balance: '100',
    status: 'active',
    energyProduced: '250',
    owner: 'user1'
  },
  {
    address: '0x8765...4321',
    name: 'EV Charger',
    type: 'ev_charger',
    balance: '50',
    status: 'active',
    energyConsumed: '120',
    owner: 'user1'
  },
  {
    address: '0xabcd...efgh',
    name: 'Grid Buyback',
    type: 'grid',
    balance: '0',
    status: 'inactive',
    owner: 'user2'
  }
];

let transactions: Transaction[] = [
  {
    id: '0x1234567890abcdef',
    fromAddress: '0x1234...5678',
    toAddress: '0x8765...4321',
    amount: '25',
    timestamp: Date.now() - 86400000, // 1 day ago
    energyAmount: '50',
    type: 'energy_sale'
  }
];

let users: User[] = [
  {
    id: 'user1',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 'user2',
    name: 'Viewer User',
    role: 'viewer'
  }
];

// Utility functions
export const getDeviceBalance = async (address: string): Promise<string> => {
  try {
    const device = devices.find(d => d.address === address);
    return device ? `${device.balance} KRNL` : '0 KRNL';
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

export const sendPayment = async (
  fromAddress: string,
  toAddress: string,
  amount: string,
  type: 'payment' | 'energy_sale' | 'distribution' | 'subsidy' = 'payment',
  energyAmount?: string
): Promise<string> => {
  try {
    const amountNum = parseFloat(amount);
    
    // Update device balances
    const fromDevice = devices.find(d => d.address === fromAddress);
    const toDevice = devices.find(d => d.address === toAddress);
    
    if (fromDevice) {
      const fromBalance = parseFloat(fromDevice.balance);
      fromDevice.balance = Math.max(0, fromBalance - amountNum).toString();
    }
    
    if (toDevice) {
      const toBalance = parseFloat(toDevice.balance);
      toDevice.balance = (toBalance + amountNum).toString();
    }
    
    // Create a transaction record
    const txId = '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    
    const transaction: Transaction = {
      id: txId,
      fromAddress,
      toAddress,
      amount,
      timestamp: Date.now(),
      type,
      ...(energyAmount && { energyAmount })
    };
    
    transactions.push(transaction);
    
    // Also update the legacy objects for backward compatibility
    if (deviceBalances[fromAddress]) {
      const fromBalance = parseFloat(deviceBalances[fromAddress]);
      deviceBalances[fromAddress] = Math.max(0, fromBalance - amountNum).toString();
    }
    
    if (deviceBalances[toAddress]) {
      const toBalance = parseFloat(deviceBalances[toAddress]);
      deviceBalances[toAddress] = (toBalance + amountNum).toString();
    }
    
    return txId;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
};

export const getConnectedDevices = async (): Promise<Device[]> => {
  try {
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

export const getTransactions = async (
  filter?: {
    address?: string;
    fromDate?: number;
    toDate?: number;
    type?: 'payment' | 'energy_sale' | 'distribution' | 'subsidy';
  }
): Promise<Transaction[]> => {
  try {
    let filteredTransactions = [...transactions];
    
    if (filter) {
      if (filter.address) {
        filteredTransactions = filteredTransactions.filter(
          tx => tx.fromAddress === filter.address || tx.toAddress === filter.address
        );
      }
      
      if (filter.fromDate) {
        filteredTransactions = filteredTransactions.filter(
          tx => tx.timestamp >= filter.fromDate!
        );
      }
      
      if (filter.toDate) {
        filteredTransactions = filteredTransactions.filter(
          tx => tx.timestamp <= filter.toDate!
        );
      }
      
      if (filter.type) {
        filteredTransactions = filteredTransactions.filter(
          tx => tx.type === filter.type
        );
      }
    }
    
    // Sort by timestamp, newest first
    return filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const addDevice = async (
  address: string,
  name: string,
  type: 'solar_panel' | 'battery' | 'ev_charger' | 'home' | 'grid',
  initialBalance: string,
  owner: string = 'user1' // Default to first user
): Promise<boolean> => {
  try {
    const newDevice: Device = {
      address,
      name,
      type,
      balance: initialBalance,
      status: 'active',
      owner
    };
    
    if (type === 'solar_panel') {
      newDevice.energyProduced = '0';
    } else if (type === 'ev_charger' || type === 'home') {
      newDevice.energyConsumed = '0';
    }
    
    devices.push(newDevice);
    deviceBalances[address] = initialBalance;
    deviceStatuses[address] = 'active';
    
    return true;
  } catch (error) {
    console.error('Error adding device:', error);
    throw error;
  }
};

export const updateDeviceStatus = async (
  address: string,
  newStatus: 'active' | 'inactive'
): Promise<boolean> => {
  try {
    const device = devices.find(d => d.address === address);
    
    if (device) {
      device.status = newStatus;
      deviceStatuses[address] = newStatus;
      return true;
    }
    
    throw new Error('Device not found');
  } catch (error) {
    console.error('Error updating device status:', error);
    throw error;
  }
};

export const updateEnergyRate = async (newRate: string, isPeakHour: boolean = false): Promise<boolean> => {
  try {
    if (isPeakHour) {
      peakHourRate = newRate;
    } else {
      energyRate = newRate;
    }
    return true;
  } catch (error) {
    console.error('Error updating energy rate:', error);
    throw error;
  }
};

export const getEnergyRate = async (isPeakHour: boolean = false): Promise<string> => {
  return isPeakHour ? peakHourRate : energyRate;
};

export const distributeRevenue = async (
  fromAddress: string,
  toAddresses: string[],
  totalAmount: string,
  distributionType: 'equal' | 'weighted' = 'equal',
  weights?: number[]
): Promise<string[]> => {
  try {
    const txIds: string[] = [];
    const totalAmountNum = parseFloat(totalAmount);
    
    if (distributionType === 'equal') {
      // Split equally
      const amountPerDevice = totalAmountNum / toAddresses.length;
      
      for (const toAddress of toAddresses) {
        const txId = await sendPayment(
          fromAddress,
          toAddress,
          amountPerDevice.toString(),
          'distribution'
        );
        txIds.push(txId);
      }
    } else if (distributionType === 'weighted' && weights && weights.length === toAddresses.length) {
      // Split according to weights
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      for (let i = 0; i < toAddresses.length; i++) {
        const amount = (totalAmountNum * weights[i] / totalWeight).toString();
        const txId = await sendPayment(
          fromAddress,
          toAddresses[i],
          amount,
          'distribution'
        );
        txIds.push(txId);
      }
    }
    
    return txIds;
  } catch (error) {
    console.error('Error distributing revenue:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  return users;
};

export const getDashboardSummary = async (): Promise<{
  totalDevices: number;
  activeDevices: number;
  totalBalance: string;
  totalTransactions: number;
  totalEnergyProduced: string;
  totalEnergyConsumed: string;
}> => {
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const totalBalance = devices.reduce((sum, device) => sum + parseFloat(device.balance), 0).toString();
  
  const totalEnergyProduced = devices
    .filter(d => d.energyProduced)
    .reduce((sum, device) => sum + parseFloat(device.energyProduced || '0'), 0)
    .toString();
    
  const totalEnergyConsumed = devices
    .filter(d => d.energyConsumed)
    .reduce((sum, device) => sum + parseFloat(device.energyConsumed || '0'), 0)
    .toString();
  
  return {
    totalDevices: devices.length,
    activeDevices,
    totalBalance,
    totalTransactions: transactions.length,
    totalEnergyProduced,
    totalEnergyConsumed
  };
}; 