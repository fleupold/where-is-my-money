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
        <ul>
          {snippets.length <= 0
            ? "NO DB ENTRIES YET"
            : snippets.map((snippet, index) => (
                <li style={{ padding: "10px" }} key={snippet.snippet}>
                  <span style={{ color: "gray" }}> Snippet for contract: </span> {snippet.contract} <br />
                  <span style={{ color: "gray" }}> Code </span> <button onClick={() => this.toggleSnippet(index)}>Show/Hide</button>
                  <Collapse isOpened={!!snippet.open}>
                    <Highlight className='js'>
                        {snippet.code}
                    </Highlight>
                    <br/>
                  </Collapse>
                </li>
              ))}
        </ul>
        <div style={{ padding: "10px" }}>
          <span>Contract Name:</span>
          <input
            type="text"
            style={{ width: "200px" }}
            onChange={e => this.setState({ contract: e.target.value })}
            placeholder="put name of the contract here"
          />
          <br/>
          <textarea
            rows="30"
            onChange={e => this.setState({ code: e.target.value })}
            placeholder="add script to fetch balances"
            style={{ width: "600px" }}
          />
          <br/>
          <button onClick={() => this.putDataToDB(this.state.message)}>
            ADD
          </button>
        </div>
      </div>
    );
  }
}

export default Create;