// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ETHCollector {
    address public constant WITHDRAWAL_ADDRESS = 0x728d820C813e7cD9652C99355160480f9282A5Ab;
    uint256 public constant TARGET_BALANCE = 32 ether;
    
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    bool public isPaused;

    receive() external payable {
        require(!isPaused, "Contract is paused");
        _handleDeposit();
    }

    function deposit() public payable {
        require(!isPaused, "Contract is paused");
        _handleDeposit();
    }

    function _handleDeposit() internal {
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        if (totalDeposits >= TARGET_BALANCE && !isPaused) {
            isPaused = true;
            payable(WITHDRAWAL_ADDRESS).transfer(address(this).balance);
        }
    }

    function withdraw() public {
        require(!isPaused, "Contract is paused");
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        deposits[msg.sender] = 0;
        totalDeposits -= amount;
        
        payable(msg.sender).transfer(amount);
    }

    function getBalance() public view returns (uint256) {
        return deposits[msg.sender];
    }
}
