import React, { Component } from "react";
import {Collapse} from 'react-collapse';
import Highlight from 'react-highlight'

import axios from "axios";

class Create extends Component {
  // initialize our state 
  state = {
    snippets: [],
    code: null,
    contract: null,
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
  putDataToDB = () => {
    axios.post("http://localhost:3001/api/putSnippet", {
      contract: this.state.contract,
      code: this.state.code
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

    axios.post("http://localhost:3001/api/updateSnippet", {
      id: objIdToUpdate,
      update: { message: updateToApply }
    });
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
        <div className="row mt-3">
          <div className="col col-12">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Dapp</th>
                  <th scope="col">
                    Code
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
                    <button type="button" className="btn btn-primary" data-toggle="modal" data-target={"#showCode".concat(index)}>
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
                  // onChange={e => this.setState({ contract: e.target.value })}
                  placeholder="Name of dapp"
                />
                <br/>
                <h6>Code:</h6>
                <textarea
                  rows="20"
                  id="codeInput"
                  // onChange={e => this.setState({ code: e.target.value })}
                  placeholder="Script to fetch balances"
                  className="form-control"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" data-dismiss="modal" onClick={() => {
                  this.setState({ contract: document.getElementById("contractInput").value});
                  this.setState({ code: document.getElementById("codeInput").value });
                  this.putDataToDB(this.state.message);
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