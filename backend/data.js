const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SnippetSchema = new Schema(
    {
        contract: String,
        code: String,
        upvotes: Number,
        downvotes: Number,
        url: String,
    },
    { timestamps: true }
)

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("Snippet", SnippetSchema);