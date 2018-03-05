for (var index = 0; index < 505; index++) {
    console.log('0x' + '0'.repeat(27-(''+index).length) + Date.now() + index + "," + index + "." + (index+'').repeat(3));
    //console.log('0x' + '0'.repeat(27-(''+index).length) + Date.now() + index);
}



/* var total = 0;
for (var index = 0; index < 505; index++) {
    total+=parseFloat(index + "." + (index+'').repeat(3));
}

console.log(total); */
