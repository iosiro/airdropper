var airdroppersConfig = require('../config').airdroppers;
var web3 = require('web3');
var fs = require('fs');
var csv = require('fast-csv');
var Airdropper = artifacts.require('./Airdropper.sol');
var airdroppers = [];

async function checkAllocation() {
    let stream = fs.createReadStream("data/addressesFull.csv");
    let addresses = [];
    let allocated = 0;
    let notAllocated = 0;
    let notAllocatedAddresses = [];

    for (let _airdropper of airdroppersConfig) {
        airdroppers.push(await Airdropper.at(_airdropper.address));
    }

    let csvStream = csv()
        .on("data", function (data) {
            addresses.push(data[0])
        })
        .on("end", async function () {
            let index = 0;
            addressLoop:
            for (let address of addresses) {
                if (index++ < 43177) {
                    continue;
                }
                console.log(`Allocated ${allocated} | Not allocated ${notAllocated} : Progress ${allocated+notAllocated} /${addresses.length}`)
                for (let _airdropper of airdroppers) {
                    if (await _airdropper.tokensReceived(address)) {
                        allocated++;
                        continue addressLoop;
                    } 
                } 
                notAllocatedAddresses.push(address)
                notAllocated++;
                 
            }
            console.log(notAllocatedAddresses)
        });
    stream.pipe(csvStream);
}

checkAllocation();
