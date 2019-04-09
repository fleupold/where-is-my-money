const mongoose = require("mongoose");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Snippet = require("./data");

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();

// this is our MongoDB Snippetbase
const dbRoute = "mongodb+srv://user:Initial1@where-are-my-tokens-lq9ot.mongodb.net/test?retryWrites=true";

// connects our back end code with the Snippetbase
mongoose.connect(
  dbRoute,
  { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once("open", () => console.log("connected to the Snippetbase"));

// checks if connection with the Snippetbase is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

// this is our get method
// this method fetches all available Snippet in our Snippetbase
router.get("/getSnippets", (req, res) => {
  Snippet.find((err, Snippet) => {
    console.log(Snippet)
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: Snippet });
  });
});

// this is our update method
// this method overwrites existing Snippet in our Snippetbase
router.post("/updateSnippet", (req, res) => {
  const { id, update } = req.body;
  Snippet.findOneAndUpdate(id, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our delete method
// this method removes existing Snippet in our Snippetbase
router.delete("/deleteSnippet", (req, res) => {
  const { id } = req.body;
  Snippet.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create methid
// this method adds new Snippet in our Snippetbase
router.post("/putSnippet", (req, res) => {
  let snippet = new Snippet();

  const { contract, code } = req.body;

  if (!contract || !code) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  snippet.contract = contract;
  snippet.code = code;
  snippet.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/upvote", (req, res) => {
  const { id } = req.body;
  Snippet.findOneAndUpdate(id, {$inc: { "upvotes" : 1 }}, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/downvote", (req, res) => {
  const { id } = req.body;
  Snippet.findOneAndUpdate(id, {$inc: { "downvotes" : 1 }}, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));