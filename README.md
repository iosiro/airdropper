![Airdropper](https://imgur.com/WsZc0Ua.jpg)

# Airdropper
Airdropper is a a framework designed to perform large-scale ERC20 token airdrops. 

## Disclaimer
As stated in the license, this code is provided as is. It is currently still in active development and you should definitely do test runs on test networks before trying to do anything on mainnet or letting it touch any of your funds. This should only be used for ERC20 tokens with 18 decimal places.

## Installation
```sh
$ git clone https://github.com/iosiro/airdropper.git 
$ cd airdropper
$ npm install
```

## Getting Started
Due to the frequency of requests, it's recommended that a local node is used, such as geth or parity.  Services such as infura will throttle the requests or simply return errors, resulting in a backlog of transactions.

The smart contracts should first be compiled and migrated using truffle:

```
$ truffle console
> compile
> migrate --reset
```

The ERC20 token address should then be set in the smart contract:
```
> Airdropper.deployed().then(res => airdropper = Airdropper.at(res.address))
> airdropper.setTokenAddress('<token address>')
```

Tokens should then be sent to the smart contract to be distributed. `transfer` is used instead of `transferFrom` due to the lower gas cost. 

```
> token.transfer(airdropper.address, web3.toWei(100000, 'ether'))
```

The transfer of funds can be verified by calling `remainingTokens()`:
```
> airdropper.remainingTokens()
```

In the event of needing to withdraw tokens from the smart contract, all of the tokens can be sent back to the owner of the contract:
```
> airdropper.reset()
```

Whitelist all of the addresses specified in `config.js`:
```
> airdropper.setAirdropAgent('<wallet address>', true)
```

The airdropper is now ready to start!

### Usage
```sh
> exec scripts/airdropper.js
```

### Checking Progress
To check whether an address has received tokens, the following can be run.
### Usage
```sh
> airdropper.tokensReceived()
```

A helper script is provided to perform this across a master file of all addresses. An array of unallocated addresses is logged at the end.

```sh
> exec scripts/checkAllocations.js
```

### Config
```config.js``` can be edited to adjust the parameters of the airdrop.

| Field | Description |
| ------ | ------ |
| numTokens | The number of tokens sent to each address in a static airdrop. This value is ignored for a dynamic airdrop. |
| batchSize | The number of transfers that should be included per transaction. Increasing this value results in a lower cost per transfer, but also makes it less likely for miners to include the transaction as it will have a higher gas requirement (and you will likely set a low gas fee). Recommended values are 50-100. |
| gasPrice| The gas price for the batched transaction. This overrides the value specified in the truffle config, allowing contracts to be deployed faster (using the truffle value) and cheaper transactions to be used for the airdrop itself. |
| gasLimit | The gas limit for the batched transaction. This overrides the value specified in the truffle config. |
| timeout | Time in minutes between submitting a transaction and timing out. This can be useful for identifying transactions that are never submitted, but can also be extended to facilitate lower gas prices. _Note: this value should not be set lower than 4 minutes, as this is the default timeout period of web3._ |
| airdroppers | An array of JSON objects specifying the whitelisted airdrop agents. These accounts should be unlocked and have enough ether to cover the gas costs for the number of transactions that they need to perform (i.e. `addresses in file *  ether per transaction / batch size`). The filename should specify the file in the `./scripts/data` directory containing a list of addresses to send tokens. Each agent should have its own csv to read from to avoid sending duplicate transfers, resulting in wasted gas. |

### Sample Config
```js
module.exports = {
    numTokens : 100,
    batchSize: 50,
    gasPrice: 3000000000,
    gasLimit: 2800000,
    timeout: 30,
    airdroppers: [
    {address: '0x6024cd783237d664855e1f11961441f7fa7585ef', filename: 'addresses1.csv'},
    {address: '0x8c78d9fc48fdd60b13a6953d4113a63ece7a57ac', filename: 'addresses2.csv'},
    ]
}
```

## Static vs. Dynamic Airdrop
Two modes of airdrop are supported, static and dynamic. Static mode will send the same number of tokens to all addresses, such as rewarding participants for signing up to a social media platform. Dynamic mode will send a different amount of tokens to each address, such as allocating a bonus amount of tokens to each participant based on their original contribution in an ICO. 

The mode is determined based on the number of columns in the csv files. If only one column is found, it will default to static pricing which will use the value specified in the config file. This can be verified by running:
```
> airdropper.airdropTokens()
```

Dynamic pricing should have two columns specifying the address and amount of tokens to send as full tokens (e.g. without 18 decimal places). 

For example:
```
0x5b54bdf2914261bd2f934aeca4eab68faf1d05b3,105
0x010057f074f1c5bda342f45fd7f7933f73df33f3,1200.1200
```

## Case Study: VIO Airdrop
Airdropper was used for the [VIO](https://www.viome.io) ERC20 token airdrop that sent tokens to over 113,000 addresses in 5 days for approximately 12 ether. New features added since then could have reduced the duration down to 1-2 days.

## Todos
 - Write truffle tests
 - Further optimize gas usage
 - Implement a better way of finding the starting index for the batch, rather than calling the receivedTokens function thousands of times unnecessarily
 - Last batch needs to be completed manually


