pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Airdropper is Ownable {
    using SafeMath for uint256;
    uint256 public airdropTokens;
    uint256 public totalClaimed;
    uint256 public amountOfTokens;
    mapping (address => bool) public tokensReceived;
    mapping (address => bool) public airdropAgent;
    ERC20 public token;

    function Airdropper(uint256 _amount) public {
        totalClaimed = 0;
        amountOfTokens = _amount;
    }

    // Send a static number of tokens to each user in an array (e.g. each user receives 100 tokens)
    function airdrop(address[] _recipients) public onlyAirdropAgent {        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(!tokensReceived[_recipients[i]]); // Probably a race condition between two transactions. Bail to avoid double allocations and to save the gas.
            require(token.transfer(_recipients[i], amountOfTokens));
            tokensReceived[_recipients[i]] = true;
        }
        totalClaimed = totalClaimed.add(amountOfTokens * _recipients.length);
    }

    // Send a dynamic number of tokens to each user in an array (e.g. each user receives 10% of their original contribution) 
    function airdropDynamic(address[] _recipients, uint256[] _amount) public onlyAirdropAgent {
        for (uint256 i = 0; i < _recipients.length; i++) {
                require(!tokensReceived[_recipients[i]]); // Probably a race condition between two transactions. Bail to avoid double allocations and to save the gas.
                require(token.transfer(_recipients[i], _amount[i]));
                tokensReceived[_recipients[i]] = true; 
                totalClaimed = totalClaimed.add(_amount[i]);
        } 
    }

    // Allow this agent to call the airdrop functions
    function setAirdropAgent(address _agentAddress, bool state) public onlyOwner {
        airdropAgent[_agentAddress] = state;
    }
    
    // Return any unused tokens back to the contract owner
    function reset() public onlyOwner {
        require(token.transfer(owner, remainingTokens()));
    }

    // Specify the ERC20 token address
    function setTokenAddress(address _tokenAddress) public onlyOwner {
        token = ERC20(_tokenAddress);
    }

    // Set the amount of tokens to send each user for a static airdrop
    function setTokenAmount(uint256 _amount) public onlyOwner {
        amountOfTokens = _amount;
    }

    // Return the amount of tokens that the contract currently holds
    function remainingTokens() public view returns (uint256) {
        return token.balanceOf(this);
    }

    modifier onlyAirdropAgent() {
        require(airdropAgent[msg.sender]);
         _;
    }
}