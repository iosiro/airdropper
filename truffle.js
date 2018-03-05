module.exports = {
  networks: {
    ropsten: {
      network_id: 3,
      host: "localhost",
      port: 8545,
      gas: 4500000,
      gasPrice: 10000000000,
      from: '0xeb050f4892eb17e37dd950c5d1683546e4df0cc5'
    },
    mainnet: {
      network_id: 1,
      host: "localhost",
      port: 8545,
      gas: 3250000,
      gasPrice: 3000000000,
      from: '0xeb050f4892eb17e37dd950c5d1683546e4df0cc5'
    }
  }
};
