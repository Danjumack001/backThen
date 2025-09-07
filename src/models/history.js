const mongoose = require("../config");

const historySchema = new mongoose.Schema({
  year: String,
  text: String,
  category: String, 
  date: {
    month: String,
    day: String,
  }
});

module.exports = mongoose.model("history", historySchema);