// ENS example
const Web3 = require('web3');
rpcUrl = 'https://mainnet.infura.io/v3/3fc30e6f61354864bb65d17e86e05573';
var web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));


function execute() {
    return web3.eth.ens.getAddress('ethereum.eth'); /* Return null if address not taken and 0x000..000 if resolver not set.*/
};

(async () => {
    var p = await execute();
    console.log(p);
})();