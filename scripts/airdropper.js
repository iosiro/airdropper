var web3 = require('web3')
var fs = require('fs');
var csv = require('fast-csv');
var bignumber = require('BigNumber.js');
var _progress = require('cli-progress');
var batchesProgress = new _progress.Bar({}, _progress.Presets.shades_classic);
var Airdropper = artifacts.require('./Airdropper.sol');
let batchData = new Array();
let singleBatch = new Array();
var totalWeiSpent = 0;

//TODO doesn't work with truffle develop as it passes develop params not exec params
//const airdropContractAddress = process.argv.slice(2)[0];
//let BATCH_SIZE = process.argv.slice(2)[1];
var airdropContractAddress = Airdropper.address;
let BATCH_SIZE = 100;

if (!airdropContractAddress) {
    console.error("Missing airdrop contract address");
}

if (!BATCH_SIZE) {
    BATCH_SIZE = 80;
    console.warn(`Defaulting to a batch size of ${BATCH_SIZE}`);
}

function parseFile() {
    var stream = fs.createReadStream("addresses.csv");
    let index = 0;
    let batch = 0;
    let numAddresses = 0;
    let failedAddresses = 0;

    var csvStream = csv()
        .on("data", function (data) {
            let address = data[0];
            let isAddress = web3.utils.isAddress(address);
            if (isAddress) {
                singleBatch.push(address);
                index++;
                numAddresses++;
                if (index >= BATCH_SIZE) {
                    batchData.push(singleBatch);
                    singleBatch = [];
                    index = 0;
                }
            } else {
                failedAddresses++;
                console.warn(`Invalid address: ${address}`)
            }
        })
        .on("end", function () {
            // Add the addresses that didn't fit into the last batch
            batchData.push(singleBatch);
            singleBatch = [];

            console.log(`\nParsed a total of ${numAddresses} addresses`)
            console.log(`Using ${batchData.length} batches of ${BATCH_SIZE} addresses`)
            console.log(`Failed to parse ${failedAddresses} addresses`)

            allocateTokens()
            .then(() => console.log(`\n\nSpent a total of ${totalWeiSpent/(10**18)} ether`));
            
        });
    stream.pipe(csvStream);
}

console.log(`Batch size is ${BATCH_SIZE} addresses per transaction`);
parseFile();

async function allocateTokens() {
    console.log(`Allocating tokens...\n`);
    //let accounts = await web3.eth.getAccounts();
    let airdropper = await Airdropper.at(airdropContractAddress);
    let airdropTokens = await airdropper.airdropTokens();
    batchesProgress.start(batchData.length, 0);
    for (var i = 0; i < batchData.length; i++) {
        try {
            let gPrice = web3.utils.toWei('5', 'gwei');
            batchesProgress.update(i+1);
            let res = await airdropper.airdrop(batchData[i])
            let weiSpent = res.receipt.gasUsed * gPrice;
            totalWeiSpent += weiSpent;
        } catch (err) {
            console.error(`\n\nError while allocating tokens to batch ${i+1} (${i*BATCH_SIZE}-${(i+1)*BATCH_SIZE})\n`)
            console.error(err);
            break;
        }
    }
}


/* 
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
console.log("Allocation completed");
console.log("Waiting for transactions to be mined...");
delay(1200);
console.log("Retrieving logs to calculate total amount of tokens allocated so far. This may take a while...")
let polytokenAddress = await polyDistribution.POLY({ from: accounts[0] });
let polyToken = await PolyToken.at(polytokenAddress);
var sumAccounts = 0;
var sumTokens = 0;
var events = await polyToken.Transfer({ from: polyDistribution.address }, { fromBlock: 0, toBlock: 'latest' });
events.get(function (error, log) {
    event_data = log;
    for (var i = 0; i < event_data.length; i++) {
        //let tokens = event_data[i].args.value.times(10 ** -18).toString(10);
        //let addressB = event_data[i].args.to;
        sumTokens += event_data[i].args.value.times(10 ** -18).toNumber();
        sumAccounts += 1;
        //console.log(`Distributed ${tokens} POLY to address ${addressB}`);
    }
    console.log(`A total of ${sumTokens} tokens have been distributed to ${sumAccounts} accounts so far.`);
}); */