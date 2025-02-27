const { Web3 } = require('web3');

const web3 = new Web3('https://holesky.drpc.org');

// Updated ABI to include the balance-related functions
const abi = [
  {
    "inputs": [],
    "name": "isPaused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeposits",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = '0xff7584928023CC991D255D4F1E36E9C6B7B8FEeE';

// Create contract instance
const contract = new web3.eth.Contract(abi, contractAddress);

// Query isPaused value
async function queryIsPaused() {
  try {
    const isPaused = await contract.methods.isPaused().call();
    console.log('Is contract paused:', isPaused);
  } catch (error) {
    console.error('Error querying isPaused:', error);
  }
}

// Query contract balance
async function queryContractBalance() {
  try {
    const balance = await web3.eth.getBalance(contractAddress);
    console.log('Contract balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');

    const totalDeposits = await contract.methods.totalDeposits().call();
    console.log('Total deposits:', web3.utils.fromWei(totalDeposits, 'ether'), 'ETH');
  } catch (error) {
    console.error('Error querying contract balance:', error);
  }
}

// Call the functions
async function main() {
  await queryIsPaused();
  await queryContractBalance();
}

main();
