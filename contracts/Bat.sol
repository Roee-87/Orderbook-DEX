//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Bat is ERC20 {
    constructor(uint256 initialSupply) ERC20("Bat browser token", "BAT") {
        _mint(msg.sender, initialSupply);
    }
}
