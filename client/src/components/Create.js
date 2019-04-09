import React, { Component } from "react";
import Highlight from 'react-highlight'

import axios from "axios";

class Create extends Component {
  // initialize our state 
  state = {
    snippets: [],
    intervalIsSet: false,
    id: 0,
  };

  componentDidMount() {
    this.getDataFromDb();
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
  putDataToDB = (contract, code, url, isLiquid) => {
    axios.post("http://localhost:3001/api/putSnippet", {
      contract: contract,
      code: code,
      url: url,
      isLiquid: isLiquid
    }).then(() => {
      window.location.reload();
    });
  };

  upvote = (snippet) => {
    localStorage.setItem(snippet._id, true);
    axios.post("api/upvote", {
      id: snippet._id,
    })
    snippet.upvotes++;
    this.forceUpdate();
  };

  downvote = (snippet) => {
    localStorage.setItem(snippet._id, true);
    axios.post("api/downvote", {
      id: snippet._id,
    });
    snippet.downvotes++;
    this.forceUpdate();
  };

  toggleSnippet = (index) => {
      this.setState((state) => {
          state.snippets[index].open = !state.snippets[index].open;
      });
      this.forceUpdate()
  }


  // here is our UI
  // it is easy to understand their functions when you 
  // see them render into our screen
  render() {
    const { snippets } = this.state;
    return (
      <div>
        <a className="btn btn-secondary" href="/" role="button">Back to main</a>
        <div className="row">
          <div className="col col-12">
              <h2 className="text-center">Manage dapps</h2>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col col-12">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Dapp</th>
                  <th scope="col">
                    Code
                  </th>
                  <th scope="col">
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody>{snippets.length <= 0
              ? <tr><td>NO DB ENTRIES YET</td></tr>
              : snippets.map((snippet, index) => (
                <tr key={index}>
                  <td> 
                    {snippet.contract}
                    {}
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline-secondary" data-toggle="modal" data-target={"#showCode".concat(index)}>
                      Show code
                    </button>
                    <div className="modal fade" id={"showCode".concat(index)} tabIndex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
                      <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLongTitle">Code for {snippet.contract}</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <Highlight className='js'>
                              {snippet.code}
                            </Highlight>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button type="button" class="btn btn-link" onClick={() => this.upvote(snippet)}  disabled={!!localStorage.getItem(snippet._id)}>
                        <span role="img">👍</span>
                        <span>{snippet.upvotes} </span>
                    </button>
                    <button type="button" class="btn btn-link" onClick={() => this.downvote(snippet)} disabled={!!localStorage.getItem(snippet._id)}>
                        <span role="img">👎</span>
                        <span>{snippet.downvotes} </span>
                    </button>
                  </td>
                  </tr>
                ))}</tbody>
            </table>
          </div>
        </div>
        <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#addDapp">
          Add dapp
        </button>

        <div className="modal fade" id="addDapp" tabIndex="-1" role="dialog" aria-labelledby="addDappTitle" aria-hidden="true">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="addDappTitle">Add new dapp</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                
                <h6>Contract Name:</h6>
                <input
                  type="text"
                  className="form-control"
                  id="contractInput"
                  placeholder="Name of dapp"
                />
                <br/>
                <h6>URL:</h6>
                <input
                  type="text"
                  className="form-control"
                  id="urlInput"
                  // onChange={e => this.setState({ contract: e.target.value })}
                  placeholder="URL of dapp"
                />
                <br/>
                <h6>Code:</h6>
                <textarea
                  rows="20"
                  id="codeInput"
                  placeholder="Script to fetch balances"
                  className="form-control"
                />
                <small id="codeHelp" class="form-text text-muted">
                    Your code must return a promise with the balance. You have the following input objects available: <code>web3</code>, <code>tokenAddress</code>, <code>accountAddress</code>.
                </small>
                <br />
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="isLiquidInput" value="true" />
                    <label class="form-check-label" for="isLiquidInput">
                        is locked (illiquid)
                    </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" data-dismiss="modal" onClick={() => {
                  this.putDataToDB(
                      document.getElementById("contractInput").value, 
                      document.getElementById("codeInput").value,
                      document.getElementById("urlInput").value,
                      !document.getElementById("isLiquidInput").checked,
                    );
                }}>Save</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Create;