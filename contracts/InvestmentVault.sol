// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InvestmentVault is ReentrancyGuard {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function invest() public payable {
        require(msg.value > 0, "Send some Ether to invest.");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function withdraw(uint256 amount) public nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance.");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    /*--- Optional owner‐only functions below ---*/

    /// @notice If you want to enable the owner to withdraw all ETH (e.g. for emergency),
    /// uncomment this and use onlyOwner modifier (see next section).
    // function emergencyWithdraw() external onlyOwner nonReentrant {
    //     uint256 c = address(this).balance;
    //     (bool success, ) = payable(owner).call{ value: c }("");
    //     require(success, "Owner withdrawal failed");
    //     emit EmergencyWithdrawal(owner, c);
    // }

    /* Events */
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    // event EmergencyWithdrawal(address indexed owner, uint256 amount);
}
