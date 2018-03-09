var batchSize = require('../config').batchSize;
var gasPrice = require('../config').gasPrice;
var gasLimit = require('../config').gasLimit;
var airdroppers = require('../config').airdroppers;
var web3 = require('web3');
var fs = require('fs');
var csv = require('fast-csv');
var Airdropper = artifacts.require('./Airdropper.sol');
var airdropper;
var numRunning = 0;
var timeout = require('../config').timeout;

// Calculate number of iterations to enforce timeout
timeout = (timeout - 4) * 60 / 10;

async function parseFile(airdropContractOwner, airdropContractAddress, filename) {
    let stream = fs.createReadStream("data/" + filename);
    let index = 0;
    let batch = 0;
    let failedAddresses = 0;
    let failedNumbers = 0;
    let airdropperNumber = ++numRunning;
    let addresses = new Array();
    let tokenAmounts = new Array();
    let dynamic = false;

    console.log(`+++++ Spinning up airdropper #${airdropperNumber} +++++`)

    try {
        var airdropperInstance = await Airdropper.at(airdropContractAddress);
    } catch (err) {
        if (err == ReferenceError) {
            console.log('First run truffle migrate');
            return false;
        }
    }

    let csvStream = csv()
        .on("data", function (data) {
            let address = data[0];
            let isAddress = web3.utils.isAddress(address);
            let numTokens = 0;

            if (data.length > 1) {
                numTokens = data[1];
                dynamic = true;
            }

            if (isAddress) {
                addresses.push(address);
                
                if (dynamic && !isNaN(numTokens)) {
                    tokenAmounts.push(parseFloat(numTokens));
                }

            } else {
                failedAddresses++;
                console.warn(`Invalid address: ${address}`);
            }
        })
        .on("end", async function () {
            // TODO: pull gas utilised from blockchain rather than manual calculations
            console.log(`Finished parsing file for airdropper #${airdropperNumber}`)
            console.log(`Parsed ${addresses.length} addresses`)
            console.log(`Failed to parse ${failedAddresses} addresses`)
            console.log(`Failed to parse ${failedNumbers} token numbers`)
            console.log(`================================================`)
            console.log(`Gas price set to ${web3.utils.fromWei(gasPrice + '', 'gwei')} gwei for batch transactions`);
            console.log(`Batch size is ${batchSize} addresses per transaction`);
            console.log(`Airdropper address is ${airdropContractAddress}`)
            console.log(`Owner address is ${airdropContractOwner}`)
            console.log(`================================================`)

            let batch = [];
            let currentBatch = 0;
            let alreadyAllocated = 0;

            try {
                for (let address of addresses) {
                    // TODO: use smarter search algorithm so it doesn't have to perform thousands of requests
                    receivedTokens = await airdropperInstance.tokensReceived(address);

                    if (!receivedTokens) {
                        batch.push(address);
                    } else {
                        alreadyAllocated++;
                    }

                    if (batch.length >= batchSize || currentBatch) {
                        let batchesRemaining = (addresses.length - alreadyAllocated) / batchSize;
                        
                        console.log(`+ Airdropper #${airdropperNumber} allocating batch ${++currentBatch}/${parseInt(batchesRemaining)}`);

                        res = await allocateTokens(airdropperInstance, airdropContractOwner, batch, tokenAmounts);

                        if (!res) {
                            throw new Error('Transfer failed');
                        }

                        console.log(`- Airdropper #${airdropperNumber} successfully allocated tokens to batch ${++currentBatch}/${parseInt(batchesRemaining)}`)
                        
                        batch = [];
                        tokenAmounts = [];
                    }
                }
            } catch (err) {
                throw err;
            }

        });
    stream.pipe(csvStream);
}

for (let airdropper of airdroppers) {
    parseFile(airdropper.owner, airdropper.address, airdropper.filename);
}


async function allocateTokens(airdropper, owner, batch, tokenAmounts) {
    try {
        if (tokenAmounts.length > 0) {
            // Dynamic
            es = await airdropper.airdropDynamic(batch, tokenAmounts, { from: owner, gasPrice: gasPrice, gas: gasLimit });
        } else {
            // Static 
            res = await airdropper.airdrop(batch, { from: owner, gasPrice: gasPrice, gas: gasLimit });
        }
        return true;

    } catch (err) {
        if (err == ReferenceError) {
            console.log('First run truffle migrate');
            return false;
        }
        if (err.toString().indexOf('240 seconds') > -1) {
            console.warn(`Transaction has not been included in any blocks within 240 seconds, this is likely due to a low gas price or a loss of internet connectivity. Waiting a bit longer...`);
            let iterations = 0;

            while (!(await airdropper.tokensReceived(batch[0]))) {

                if (iterations >= timeout) {
                    console.log(`Failed to include transaction within ${timeout} minutes, bailing as there may be a problem.`);
                    return false;
                }

                function pause(milliseconds) {
                    var dt = new Date();
                    while ((new Date()) - dt <= milliseconds) { }
                }

                // Wait 10 seconds before checking if anything has changed.
                pause(10000);
                iterations++;
            }
            console.log(`Success! Managed to include batch in a block. Continuing.`);
            return true;
        } else {
            console.error(`\n\nError while allocating tokens to batch. Bailing.\n`)
            console.error(err);
            return false;
        }
    }
}


//TODO make it possible for multiple people to call the contract to parallelise the process


// async function allocateTokens(batchDataAddresses, batchDataTokens) {
//     console.log(`\nAllocating tokens...`);
//     console.log(`Gas price set to ${web3.utils.fromWei(gasPrice + '', 'gwei')} gwei for batch transactions`);

//     let airdropper = await Airdropper.at(airdropContractAddress);
//     let airdropTokens = await airdropper.airdropTokens();
//     let staticNumTokens = await airdropper.amountOfTokens();

//     for (let i = batchIndex; i < batchDataAddresses.length; i++) {
//         try {
//             if (typeof batchDataAddresses[i][0] == 'undefined' || await airdropper.tokensReceived(batchDataAddresses[i][0])) {
//                 console.log(`Addresses in batch ${i + 1} have already received tokens. Skipping.`);
//                 continue;
//             }
//             var res;
//             var tokensInBatch = 0;
//             if (dynamic) {
//                 res = await airdropper.airdropDynamic(batchDataAddresses[i], batchDataTokens[i], { gasPrice: gasPrice, gas: gasLimit });
//                 tokensInBatch = batchDataTokens[i].reduce((a, b) => web3.utils.toBN(a).add(web3.utils.toBN(b)), 0);
//             } else {
//                 res = await airdropper.airdrop(batchDataAddresses[i], { gasPrice: gasPrice, gas: gasLimit });
//                 tokensInBatch = web3.utils.toBN(staticNumTokens).mul(web3.utils.toBN(batchDataAddresses[i].length));
//             }

//             paidAddresses += batchDataAddresses[i].length;
//             totalWeiSpent += res.receipt.gasUsed * gasPrice;
//             tokensSent = tokensSent.add(tokensInBatch);

//             console.log(`Batch ${i + 1}/${batchDataAddresses.length} (${i * batchSize}-${(i + 1) * batchSize}) has finished transferring tokens to ${batchDataAddresses[i].length} addresses. Sent a total of ${web3.utils.fromWei(tokensInBatch + '', 'ether')} tokens in this batch.\nSpent ${web3.utils.fromWei(res.receipt.gasUsed * gasPrice + '', 'gwei')} gwei on this batch.`);
//         } catch (err) {
//             if (err.toString().indexOf('240 seconds') > -1) {
//                 console.warn(`Transaction has not been included in any blocks within 240 seconds, this is likely due to a low gas price or a loss of internet connectivity. Waiting a bit longer...`);
//                 let iterations = 0;

//                 while (!(await airdropper.tokensReceived(batchDataAddresses[i][0]))) {
//                     if (iterations >= 126) {
//                         console.log(`Failed to include transaction within 20 minutes, bailing as there may be a problem.`);
//                         return;
//                     }

//                     function pause(milliseconds) {
//                         var dt = new Date();
//                         while ((new Date()) - dt <= milliseconds) { }
//                     }
//                     // Wait 10 seconds before checking if anything has changed.
//                     pause(10000);
//                     iterations++;
//                 }
//                 console.log(`Success! Managed to complete batch ${i + 1}/${batchDataAddresses.length}. Continuing.`);
//             } else {
//                 console.error(`\n\nError while allocating tokens to batch ${i + 1} (${i * batchSize}-${(i + 1) * batchSize})\n`)
//                 console.error(err);
//                 break;
//             }
//         }
//     }
// }