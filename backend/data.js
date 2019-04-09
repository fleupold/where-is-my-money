const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SnippetSchema = new Schema(
    {
        contract: String,
        code: String,
        upvotes: { type: Number, default: 0 },
        downvotes: { type: Number, default: 0 },
        url: String,
        isLiquid: { type: Boolean, default: true },
    },
    { timestamps: true }
)

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("Snippet", SnippetSchema);