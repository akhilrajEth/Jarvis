const { Web3 } = require('web3');

const web3 = new Web3('https://holesky.drpc.org');

// ABI of the contract (only including the isPaused function)
const abi = [
  {
    "inputs": [],
    "name": "isPaused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = '0xcd7A53085058BeD1e537660Cd90407134477a035';

// Create contract instance
const contract = new web3.eth.Contract(abi, contractAddress);

// Query isPaused value
async function queryIsPaused() {
  try {
    const isPaused = await contract.methods.isPaused().call();
    console.log('Is contract paused:', isPaused);
  } catch (error) {
    console.error('Error querying contract:', error);
  }
}

// Call the function
queryIsPaused();
