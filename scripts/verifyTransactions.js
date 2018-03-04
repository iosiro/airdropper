/* var tokenAddress = require('../config').tokenAddress;
var beneficiary = require('../config').beneficiary;
var Token = artifacts.require('./ERC20.sol');
var startingBlock = 2761904
var token = Token.at(tokenAddress);
var numAccounts = 0;
var numTokens = 0;

var event = token.Transfer({ from: beneficiary }, { fromBlock: startingBlock, toBlock: 'latest' });

event.get(function (error, event_data) {
    for (var i = 0; i < event_data.length; i++) {
        numTokens += event_data[i].args.value.times(10 ** -18).toNumber();
        numAccounts += 1;
    }
    console.log(`A total of ${numTokens} tokens have been distributed to ${numAccounts} accounts`);
}); 
  */