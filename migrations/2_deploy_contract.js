var web3 = require('web3')
var Airdropper = artifacts.require("./Airdropper.sol");
var numTokens = require('../config').numTokens;

module.exports = function (deployer, network) {
    deployer.deploy(Airdropper, web3.utils.toWei(numTokens + ''));
};
