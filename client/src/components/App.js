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
      tokens.forEach((token) => token.contractBalances = new Map())
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
        console.log(snippet)
        return self.getContractBalances(token.address, self.state.walletAddress, snippet)
            .then((balance) => {
                self.setState((state) => {
                    state.tokens[index].contractBalances.set(snippet.contract, balance);
                })
            })
      }).concat(self.getBalance(token.address, index)
        .then((balance) => {
            self.setState((state) => {
                state.tokens[index].contractBalances.set("ERC20 contract", balance);
            })
        }));
    })

    balancePromisesPerToken.forEach((balancePromises, tokenIndex) => {
      Promise.all(balancePromises).then(() => {
        console.log("Load balances completed")
        self.forceUpdate();
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
      const fn = () => {
        const web3 = new Web3(window.web3.currentProvider)
        web3.eth.getAccounts((e, addresses) => {
            resolve(addresses[0])
        });
      }
      if (window.web3) {
        fn();
      } else {
        setTimeout(fn, 500);
      }
      
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
          state.tokens.forEach(token => token.contractBalances = new Map())
      })
      this.forceUpdate()
      this.loadBalances()
  }


  // here is our UI
  // it is easy to understand their functions when you 
  // see them render into our screen
  render() {
    const { tokens } = this.state;
    return (
      <div>
        <div className="row">
          <div className="col col-12">
              <h1 className="text-center">Where is my money?</h1>
              <div className="text-center">
                <img src="./img/eyes.gif" className="rounded" width="200px"></img>
              </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-6">
            <div className="text-center">
              <form onSubmit={(event) => {
                  event.preventDefault()
                  this.resolveCustomWalletAddress(this.state.customWalletAddress)}}
              >
                <label>Wallet Address:
                  <input 
                    type="text" 
                    style={{ width: "300px" }}
                    onChange={e => this.setState({ customWalletAddress: e.target.value })}
                    value={this.state.customWalletAddress}
                    placeholder="Enter address or ENS name" />
                </label>
                <input type="submit" value="Go" />
              </form>
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col col-6" style={{ paddingRight: "20px", borderRight: "1px solid #ccc"}}>
            <h5>Liquid</h5>
            <table className="table table-hover">
              <tbody>{tokens.length <= 0
                ? <tr><td>Loading Tokens</td></tr>
                : tokens.map(token => (
                  <tr key={token.symbol}>
                    <td>
                      {token.symbol}
                    </td>
                    <td>
                      {Array.from(token.contractBalances.values()).reduce((a,b) => a + b, 0)}
                    </td>
                    <td>  
                      <button type="button" className="btn btn-outline-secondary btn-sm" data-toggle="modal" data-target={"#where".concat(token.symbol)}>
                        Where?
                      </button>

                      <div className="modal fade" id={"where".concat(token.symbol)} tabIndex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
                        <div className="modal-dialog" role="document">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title" id="exampleModalLongTitle">Where is my {token.symbol}?</h5>
                              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                              </button>
                            </div>
                            <div className="modal-body">
                              <table className="table table-hover">
                              <tbody> {Array.from(token.contractBalances.entries()).map((contract, index) => (
                                  <tr key={"balance".concat(contract[0])}>
                                    <td>
                                      {contract[0]}
                                    </td>
                                    <td>
                                      {contract[1]}
                                    </td>
                                  </tr>
                              ))}</tbody> 
                            </table>
                            </div>
                            <div className="modal-footer">
                              <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </td>    
                  </tr>
                ))}</tbody> 
            </table>
          </div>
          <div className="col col-6">
            <h5> Illiquid / locked</h5>
            <table className="table table-hover">
              <tbody>
                <tr>
                  <td>
                    todo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col col-12  text-center" >
            <a className="btn btn-secondary" href="/create" role="button">Manage dapps</a>
          </div>
        </div>
        
      </div>
    );
  }
}

export default App;