pragma solidity ^0.4.18;

import './FlatVioToken.sol';

contract Airdropper is Ownable {
    using SafeMath for uint256;
    uint256 public airdropTokens;
    uint256 public decimalFactor;
    uint256 public totalClaimed;
    address public beneficiary;
    mapping (address => uint256) tokensReceived;
    CentrallyIssuedToken token;

    function Airdropper(address _tokenAddress, address _beneficiary, uint256 _airdropTokens) public {
        token = CentrallyIssuedToken(_tokenAddress);
        beneficiary = _beneficiary;
        airdropTokens = _airdropTokens;
        decimalFactor = 10**18;
        totalClaimed = 0;
    }

    function airdrop(address[] _recipients) public onlyOwner {
        uint256 batchTokens = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            if (tokensReceived[_recipients[i]] == 0) {
                require(token.transferFrom(beneficiary, _recipients[i], airdropTokens * decimalFactor));
                batchTokens = batchTokens.add(airdropTokens * decimalFactor);
                tokensReceived[_recipients[i]] = tokensReceived[_recipients[i]].add(airdropTokens * decimalFactor);
            }
        }
        totalClaimed = totalClaimed.add(batchTokens);
    }

    function remainingTokens() public view returns (uint256) {
        return token.allowance(beneficiary, this);
    }
}