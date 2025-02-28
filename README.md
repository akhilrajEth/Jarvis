# Jarvis
Jarvis is an autonomous AI agent that understands a user's risk-level and optimizes yield by managing liquidity pool positions across ZKSync boosted LP Pools & restaking ETH on EigenLayer with P2P. 

# Problem We're Solving 
Interacting with DeFi protocols is complex and time consuming (e.g. swapping, bridging, needing to constantly monitor yield rates). Jarvis abstracts this for the ends user by directly interacting with the smart contracts of DeFi protocols and monitoring APR rates--all while keeping your unique risk profile in mind. 

To start, we're targetting the ZKIgnite Program, where 300M ZK tokens (~30M USD) are allocated to boost DeFi positions on ZKSync for the next 6 months. LP pools have some of the highest boosted APR on the program (50-80% APR). New opportunities are introduced every two weeks and the total APR (boosted APR + native APR) changes every few days. Jarvis will keep track of all new opportunites, calculate total APR, create new positions for LP pools with the highest APR, and remove liquidity from positions with APRs that have decreased over time. 


# How's it work?
1. Verifiable Risk Profile: we securely verify your CreditKarma credit score via ZkTLS
2. Review your yield strategy split determined by your Verifiable Risk Profile, and set it off!
3. Jarvis will autonomously manage LP positions across ZKSync boosted LP Pools & restaked ETH, rebalancing when necessary.

Sit back, relax, get yield.

# System Architecture
Architectural Diagram: https://whimsical.com/verifiable-ai-agent-data-architecture-TJQ2VNUxYtV17pCoVQjckF

![image](https://github.com/user-attachments/assets/d9d5ac98-cc02-43a0-b519-c68f6551dbac)


## Key points:
- ZkTLS for secure sharing of data
- Verifiable inference with Gaia
- Hashing data to ensure integrity through centralized DB
- P2P combined with custom smart contract to allow for fractional contributions to EigenLayer restaking node
- 12 custom actions added to Coinbase Developer Platform's Agentkit for Jarvis to autonomously manage your money

# Verifiable Risk Profile
wip
impermanent loss & ease to liquidate
higher credit scores can afford to take on more risk,


# FIP
- Hosting Gaia Node on AWS, finetune model
- Integrating account management w/ Privy Server wallets
    - Spending limits, account based systems etc.




Pooled ETH in smart contract til validator node funded, then P2P flows fully afterwards
SmartContract for P2P Delgating stake: 0xff7584928023CC991D255D4F1E36E9C6B7B8FEeE
