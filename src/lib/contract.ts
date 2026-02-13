// SKALE contract configuration for ReceiptRegistry

export const SKALE_CONFIG = {
  chainId: 324705682,
  chainName: "SKALE Base Sepolia",
  rpcUrl:
    "https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha",
  explorer: "https://base-sepolia-testnet-explorer.skalenodes.com",
  nativeCurrency: {
    name: "sFUEL",
    symbol: "sFUEL",
    decimals: 18,
  },
};

export const AXIOS_USD = {
  address: "0x61a26022927096f444994dA1e53F0FD9487EAfcf",
  symbol: "AxiosUSD",
  decimals: 18,
};

export const BRIDGED_USDC = {
  address: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
  symbol: "USDC",
  decimals: 6,
};

// ReceiptRegistry ABI — deployed on SKALE Base Sepolia
export const RECEIPT_REGISTRY_ABI = [
  {
    inputs: [
      { name: "receiptHash", type: "bytes32" },
      { name: "intentHash", type: "bytes32" },
      { name: "cartHash", type: "bytes32" },
      { name: "paymentHash", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "recordReceipt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "receiptHash", type: "bytes32" }],
    name: "verifyReceipt",
    outputs: [
      { name: "exists", type: "bool" },
      {
        components: [
          { name: "receiptHash", type: "bytes32" },
          { name: "intentHash", type: "bytes32" },
          { name: "cartHash", type: "bytes32" },
          { name: "paymentHash", type: "bytes32" },
          { name: "payer", type: "address" },
          { name: "merchant", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "receipt",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "getReceipt",
    outputs: [
      {
        components: [
          { name: "receiptHash", type: "bytes32" },
          { name: "intentHash", type: "bytes32" },
          { name: "cartHash", type: "bytes32" },
          { name: "paymentHash", type: "bytes32" },
          { name: "payer", type: "address" },
          { name: "merchant", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "receiptCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "receiptHash", type: "bytes32" },
      { indexed: false, name: "payer", type: "address" },
      { indexed: false, name: "merchant", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "ReceiptRecorded",
    type: "event",
  },
] as const;
