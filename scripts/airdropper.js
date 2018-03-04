var numTokens = require('../config').numTokens;
var batchSize = require('../config').batchSize;
var gasPrice = require('../config').gasPrice;
var web3 = require('web3')
var fs = require('fs');
var csv = require('fast-csv');
var bignumber = require('BigNumber.js');
var _progress = require('cli-progress');
var Airdropper = artifacts.require('./Airdropper.sol');
let batchDataAddresses = new Array();
let batchDataTokens = new Array();
let singleBatchAddresses = new Array();
let singleBatchTokens = new Array();
var totalWeiSpent = 0;
var airdropContractAddress = Airdropper.address;
var batchIndex = 0;
var paidAddresses = 0;
var dynamic = false;
var tokensSent = 0;

if (!airdropContractAddress) {
    console.error("Missing airdrop contract address. Remember to migrate.");
}

function parseFile() {
    var stream = fs.createReadStream("addresses.csv");
    let index = 0;
    let batch = 0;
    let numAddresses = 0;
    let failedAddresses = 0;
    let failedNumbers = 0;

    var csvStream = csv()
        .on("data", function (data) {
            let address = data[0];
            var numTokens = 0;

            if (data.length > 1) {
                var numTokens = data[1];
                dynamic = true;
            } 
            
            let isAddress = web3.utils.isAddress(address);
            if (isAddress) {
                singleBatchAddresses.push(address);
                if (isNaN(numTokens)) {
                    singleBatchTokens.push(0);
                    failedNumbers++;
                    console.warn(`Failed to parse token number for: ${address}`);
                } else {
                    singleBatchTokens.push(numTokens);
                }
                index++;
                numAddresses++;
                if (index >= batchSize) {
                    batchDataAddresses.push(singleBatchAddresses);
                    batchDataTokens.push(singleBatchTokens);
                    singleBatchAddresses = [];
                    singleBatchTokens = [];
                    index = 0;
                }
            } else {
                failedAddresses++;
                console.warn(`Invalid address: ${address}`);
            }

        })
        .on("end", function () {
            // Add the addresses that didn't fit into the last batch
            if (singleBatchAddresses.length > 0) {
                batchDataAddresses.push(singleBatchAddresses);
                batchDataTokens.push(singleBatchTokens);
                singleBatchAddresses = [];
                singleBatchTokens = [];
            }

            console.log(`\nParsed a total of ${numAddresses} addresses`)
            console.log(`Using ${batchDataAddresses.length} batches of ${batchSize} addresses`)
            console.log(`Failed to parse ${failedAddresses} addresses`)
            console.log(`Failed to parse ${failedNumbers} token numbers`)
            
            allocateTokens()
                .then(() => console.log(`\nTransferred tokens to ${paidAddresses} addresses.\nSpent a total of ${totalWeiSpent / (10 ** 18)} ether.\nEquates to a total of ${web3.utils.fromWei((parseInt(totalWeiSpent / paidAddresses) || 0) + '', 'ether')} gwei per address\nSent a total of ${tokensSent} tokens.`));
        });
    stream.pipe(csvStream);
}

console.log(`Batch size is ${batchSize} addresses per transaction`);
parseFile();

async function allocateTokens() {
    console.log(`\nAllocating tokens...`);
    console.log(`Gas price set to ${web3.utils.fromWei(gasPrice + '', 'gwei')} gwei for batch transactions`);
    
    let airdropper = await Airdropper.at(airdropContractAddress);
    let airdropTokens = await airdropper.airdropTokens();
    
    for (var i = batchIndex; i < batchDataAddresses.length; i++) {
        try {
            if(typeof batchDataAddresses[i][0] == 'undefined' || await airdropper.tokensReceived(batchDataAddresses[i][0])) {
                console.log(`Addresses in batch ${i+1} have already received tokens. Skipping.`);
                continue;
            }
            var res;
            var tokensInBatch = 0;
            if (dynamic) {
                res = await airdropper.airdropDynamic(batchDataAddresses[i], batchDataTokens[i], { gasPrice: gasPrice });
                tokensInBatch = batchDataTokens[i].reduce((a, b) => parseInt(a) + parseInt(b), 0);
            } else {
                res = await airdropper.airdrop(batchDataAddresses[i], { gasPrice: gasPrice });
                tokensInBatch += batchDataAddresses[i].length * numTokens;
            }
            paidAddresses += batchDataAddresses[i].length;
            totalWeiSpent += res.receipt.gasUsed * gasPrice;
            tokensSent += tokensInBatch;
            console.log(`Batch ${i + 1}/${batchDataAddresses.length} (${i * batchSize}-${(i + 1) * batchSize}) has finished transferring tokens to ${batchDataAddresses[i].length} addresses. Sent a total of ${tokensInBatch} tokens in this batch.\nSpent ${web3.utils.fromWei(res.receipt.gasUsed * gasPrice + '', 'gwei')} gwei on this batch.`);
        } catch (err) {
            console.error(`\n\nError while allocating tokens to batch ${i + 1} (${i * batchSize}-${(i + 1) * batchSize})\n`)
            console.error(err);
            break;
        }
    }
}