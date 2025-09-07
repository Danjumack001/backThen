const mongoose = require("../config");

const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLenght: 4
    }
    ,
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        minLenght: 6
    }
});

module.exports = mongoose.model("users", loginSchema);