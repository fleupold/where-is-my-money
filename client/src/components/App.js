import React, { Component } from "react";
import axios from "axios";
import Web3 from 'web3';
import {erc20minABI} from "./abi.js";

const OMG_TOKEN = {
  "address": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
  "logoUri": "https://gnosis-safe-token-logos.s3.amazonaws.com/0xd26114cd6EE289AccF82350c8d8487fedB8A0C07.png",
  "default": false,
  "name": "OMG",
  "symbol": "OMG",
  "description": "OmiseGO (OMG) is a public Ethereum-based financial technology for use in mainstream digital wallets",
  "decimals": 18,
  "websiteUri": "https://omisego.network",
  "gas": false,
  "priceOracles": []
}

class App extends Component {
  // initialize our state 
  state = {
    snippets: [],
    walletAddress: null,
    tokens: [],
  };

  // when component mounts, first thing it does is fetch all existing data in our db
  // then we incorporate a polling logic so that we can easily see if our db has 
  // changed and implement those changes into our UI
  componentDidMount() {
    let self = this;
    const getDataPromise = this.getDataFromDb();
    const loadWalletPromise = this.loadWalletAddress().then((address) => {
      self.setState({walletAddress: address, customWalletAddress: address})
    });
    const loadTokenPromise = this.loadTokens().then((tokens) => {
      self.setState({tokens: tokens})
    });

    Promise.all([loadWalletPromise, loadTokenPromise, getDataPromise]).then(() => {
      self.loadBalances();
    })
  }

  loadBalances() {
    console.log("Load balances " + this.state.walletAddress)
    const self = this;
    const balancePromisesPerToken = self.state.tokens.map((token, index) => {
      return self.state.snippets.map((snippet) => {
        return self.getContractBalances(token.address, self.state.walletAddress, snippet)
      }).concat(self.getBalance(token.address, index));
    })

    balancePromisesPerToken.forEach((balancePromises, tokenIndex) => {
      Promise.all(balancePromises).then((balances) => {
        self.setState((state) => {
          state.tokens[tokenIndex].balance = balances.reduce((a,b) => a + b, 0);
        })
        self.forceUpdate()
        console.log("Load balances completed")
      })
    })
  }

  // just a note, here, in the front end, we use the id key of our data object 
  // in order to identify which we want to Update or delete.
  // for our back end, we use the object id assigned by MongoDB to modify 
  // data base entries

  // our first get method that uses our backend api to 
  // fetch data from our data base
  getDataFromDb = () => {
    return fetch("http://localhost:3001/api/getSnippets")
      .then(snippets => snippets.json())
      .then(res => this.setState({ snippets: res.data }));
  };

  loadWalletAddress() {
    let promise = new Promise((resolve, reject) => {
      const web3 = new Web3(window.web3.currentProvider)
      web3.eth.getAccounts((e, addresses) => {
        resolve("0x390409C2DFdffaA58e02085678FBAcf7f40a5522")
        //resolve(addresses[0])
      });
    })
    return promise
  }

  loadTokens() {
    return axios.get('https://safe-relay.gnosis.pm/api/v1/tokens/?limit=5')
      .then(function (response) {
        return [OMG_TOKEN].concat(response.data.results)
    })
  }

  getBalance(tokenAddress, index) {
    const web3 = new Web3(window.web3.currentProvider)
    let contract = new web3.eth.Contract(erc20minABI, tokenAddress);
    return contract.methods.balanceOf(this.state.walletAddress).call()
      .then(async (balance) => {
        const decimals = await contract.methods.decimals.call()
        return balance / 10**decimals
      });
  }

  getContractBalances(tokenAddress, accountAddress, snippet) {
    const web3 = new Web3(window.web3.currentProvider)
    return new Function("web3", "tokenAddress", "accountAddress", snippet.code)(web3, tokenAddress, accountAddress);
  }

  async resolveCustomWalletAddress(customWalletAddress) {
      if (customWalletAddress.indexOf('.') !== -1) {
        const web3 = new Web3(window.web3.currentProvider)
        customWalletAddress = await web3.eth.ens.getAddress(customWalletAddress)
        if (!customWalletAddress || customWalletAddress === "0x0000000000000000000000000000000000000000") {
            alert("Invalid ENS name")
            return;
        }
      }
      this.state.walletAddress = customWalletAddress
      this.setState(state => {
          state.tokens.forEach(token => token.balance = null)
      })
      this.loadBalances()
  }


  // here is our UI
  // it is easy to understand their functions when you 
  // see them render into our screen
  render() {
    const { tokens } = this.state;
    return (
      <div>
        <div>
            <p>Wallet Address:<input 
                type="text" 
                style={{ width: "300px" }}
                onChange={e => this.setState({ customWalletAddress: e.target.value })}
                value={this.state.customWalletAddress}
                placeholder="Enter address or ENS name"></input>
                <button onClick={() => this.resolveCustomWalletAddress(this.state.customWalletAddress)}>Scan</button>
            </p>
        </div>
        <ul>
          {tokens.length <= 0
            ? "Loading Tokens"
            : tokens.map(token => (
                <li style={{ padding: "10px" , background: "url('/images/leaf_icon.jpg') no-repeat left top"}} key={token.symbol}>
                  <span style={{ color: "gray" }}> {token.symbol} {token.balance}</span>
                </li>
              ))}
        </ul>
      </div>
    );
  }
}

export default App;