require("dotenv").config();
const mongoose = require('mongoose')

const connect = mongoose.connect(process.env.MONGO_URI)


connect.then(()=>{
    console.log("Connected to Database ...");
    
}).catch(()=>{
    console.log("Can't connect to Database");
    
})


module.exports=mongoose;
