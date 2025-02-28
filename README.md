# Jarvis
Jarvis is an autonomous AI agent that understands a user's risk level and optimizes yield by managing liquidity pool positions across ZKSync boosted LP Pools and restocking ETH on EigenLayer with P2P. 

# Problem We're Solving 
Interacting with DeFi protocols is complex and time-consuming (e.g. swapping, bridging, needing to monitor yield rates constantly). Jarvis abstracts this for the end user by directly interacting with the smart contracts of DeFi protocols and monitoring APR rates--all while keeping your unique risk profile in mind. 

To start, we're targeting the ZKIgnite Program, where 300M ZK tokens (~30M USD) are allocated to boost DeFi positions on ZKSync for the next 6 months. LP pools have some of the highest boosted APR in the program (50-80% APR). New opportunities are introduced every two weeks, and the total APR (boosted APR + native APR) changes every few days. Jarvis will keep track of all new opportunities, calculate the total APR, create new positions for LP pools with the highest APR, and remove liquidity from positions with APRs that have decreased over time. 

# How's it work?
1. Verifiable Risk Profile: We securely verify your CreditKarma credit score via ZkTLS 
2. Review your yield strategy split determined by your Verifiable Risk Profile and set it off!
3. Jarvis will autonomously manage LP positions across ZKSync boosted LP Pools and restaked ETH, rebalancing when necessary.

Sit back, relax, get yield.

# System Architecture
Architectural Diagram: https://whimsical.com/verifiable-ai-agent-data-architecture-TJQ2VNUxYtV17pCoVQjckF

![image](https://github.com/user-attachments/assets/a9e8ea85-1ab0-4f1a-99f6-5d66a736fe18)


## Key points:
- ZkTLS for secure sharing of data (via Reclaim Protocol's web sdk)
- Verifiable inference with Gaia
- Hashing data to ensure integrity of centralized DB
- P2P combined with custom smart contract to allow for fractional contributions to EigenLayer restaking node
- 12 custom actions added to Coinbase Developer Platform's Agentkit for Jarvis to autonomously manage your money

# Verifiable Risk Profile
The verifiable risk profile is generated through a user's credit score. The user's allocation is then generated based on the following:  

- 300-578: Credit Sore: Poor => LP: 20%, Restaked ETH: 80%
- 579-668: Credit Score: Fair => LP: 35%, Restaked ETH: 65%
- 669-738: Credit Score: Good => LP: 50%, Restaked ETH: 50%
- 739-798: Credit Score: Very good => LP: 65%, Restaked ETH: 35%
- 799-850: Credit Score: Excellent => LP: 80%, Restaked ETH: 20%

Our logic is that an individual with a higher risk score can afford to enter riskier yield generating positions than someone with a lower risk score. 

In the future, we want to include more data points and leverage the verifiable risk profile to determine which LP positions to enter since some pools may consist of tokens that are less correlated in the short term. We also want to use the profile to determine how much we should allocate to less liquid positions. 

# Future Improvements
- Hosting Gaia Node on AWS for production usage, finetune model for consistently optimized agent activity
- Integrating Privy Server wallets for account management & agent spending limits 
- Add more verifiable risk metrics to gauge risk with ZkTLS (e.g. investment accounts and spending activity)


# References
Smart contract for pooling P2P validator node (Holesky ETH): 0xff7584928023CC991D255D4F1E36E9C6B7B8FEeE
