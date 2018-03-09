// A quick dirty script to generate a list of valid, unique addresses each time you run it. 

//TODO: write to sample file in data directory

let numAddresses = 1000;

for (var index = 0; index < numAddresses; index++) {
    //console.log('0x' + '0'.repeat(27-(''+index).length) + Date.now() + index + "," + index + "." + (index+'').repeat(3));
    console.log('0x' + '0'.repeat(27-(''+index).length) + Date.now() + index);
}
