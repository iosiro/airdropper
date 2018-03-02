var Airdropper = artifacts.require("./Airdropper.sol");

module.exports = function(deployer, network) {
  if (network == "development" || network == "develop") {
    var tokenAddress = "0x345ca3e014aaf5dca488057592ee47305d9b3e10";
    var beneficiary = "0x627306090abab3a6e1400e9345bc60c78a8bef57";
    var airdropTokens = 100;
  }
  
  deployer.deploy(Airdropper, tokenAddress, beneficiary, airdropTokens);
};
