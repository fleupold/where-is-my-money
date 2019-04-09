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
    id: 0,
    message: null,
    intervalIsSet: false,
    idToDelete: null,
    idToUpdate: null,
    objectToUpdate: null,
    walletAddress: null,
    tokens: [],
  };

  // when component mounts, first thing it does is fetch all existing data in our db
  // then we incorporate a polling logic so that we can easily see if our db has 
  // changed and implement those changes into our UI
  componentDidMount() {
    const getDataPromise = this.getDataFromDb();
    if (!this.state.intervalIsSet) {
      let interval = setInterval(this.getDataFromDb, 1000);
      this.setState({ intervalIsSet: interval });
    }
    let self = this;
    const loadWalletPromise = this.loadWalletAddress().then((address) => {
      self.setState({walletAddress: address})
    });
    const loadTokenPromise = this.loadTokens().then((tokens) => {
      self.setState({tokens: tokens})
    });

    Promise.all([loadWalletPromise, loadTokenPromise, getDataPromise]).then(() => {
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
        })
      })
    })
  }

  // never let a process live forever 
  // always kill a process everytime we are done using it
  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null });
    }
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

  // our put method that uses our backend api
  // to create new query into our data base
  putDataToDB = message => {
    let currentIds = this.state.data.map(data => data.id);
    let idToBeAdded = 0;
    while (currentIds.includes(idToBeAdded)) {
      ++idToBeAdded;
    }

    axios.post("http://localhost:3001/api/putData", {
      id: idToBeAdded,
      message: message
    });
  };


  // our delete method that uses our backend api 
  // to remove existing database information
  deleteFromDB = idTodelete => {
    let objIdToDelete = null;
    this.state.data.forEach(dat => {
      if (dat.id === idTodelete) {
        objIdToDelete = dat._id;
      }
    });

    axios.delete("http://localhost:3001/api/deleteData", {
      data: {
        id: objIdToDelete
      }
    });
  };


  // our update method that uses our backend api
  // to overwrite existing data base information
  updateDB = (idToUpdate, updateToApply) => {
    let objIdToUpdate = null;
    this.state.data.forEach(dat => {
      if (dat.id === idToUpdate) {
        objIdToUpdate = dat._id;
      }
    });

    axios.post("http://localhost:3001/api/updateData", {
      id: objIdToUpdate,
      update: { message: updateToApply }
    });
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
    return axios.get('https://safe-relay.gnosis.pm/api/v1/tokens/')
      .then(function (response) {
        return [OMG_TOKEN]//.concat(response.data.results)
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


  // here is our UI
  // it is easy to understand their functions when you 
  // see them render into our screen
  render() {
    const { snippets, tokens } = this.state;
    return (
      <div>
        <div>
            <p>Wallet Address: {this.state.walletAddress}</p>
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
        <ul>
          {snippets.length <= 0
            ? "NO DB ENTRIES YET"
            : snippets.map(snippet => (
                <li style={{ padding: "10px" }} key={snippet.snippet}>
                  <span style={{ color: "gray" }}> Snippet for contract: </span> {snippet.contract} <br />
                </li>
              ))}
        </ul>
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            onChange={e => this.setState({ message: e.target.value })}
            placeholder="add something in the database"
            style={{ width: "200px" }}
          />
          <button onClick={() => this.putDataToDB(this.state.message)}>
            ADD
          </button>
        </div>
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            style={{ width: "200px" }}
            onChange={e => this.setState({ idToDelete: e.target.value })}
            placeholder="put id of item to delete here"
          />
          <button onClick={() => this.deleteFromDB(this.state.idToDelete)}>
            DELETE
          </button>
        </div>
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            style={{ width: "200px" }}
            onChange={e => this.setState({ idToUpdate: e.target.value })}
            placeholder="id of item to update here"
          />
          <input
            type="text"
            style={{ width: "200px" }}
            onChange={e => this.setState({ updateToApply: e.target.value })}
            placeholder="put new value of the item here"
          />
          <button
            onClick={() =>
              this.updateDB(this.state.idToUpdate, this.state.updateToApply)
            }
          >
            UPDATE
          </button>
        </div>
      </div>
    );
  }
}

export default App;