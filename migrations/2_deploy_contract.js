var Airdropper = artifacts.require("./Airdropper.sol");
var numTokens = require('../config').numTokens;

module.exports = function (deployer, network) {
    deployer.deploy(Airdropper, numTokens);
};
