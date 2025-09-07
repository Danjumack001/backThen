const mongoose = require('mongoose')
const connect = mongoose.connect("mongodb+srv://danjumaisaac:rDeExusVH1F0TGRk@shopa.52iy6.mongodb.net/timeline?retryWrites=true&w=majority&appName=Shopa")


connect.then(()=>{
    console.log("Connected to Database ...");
    
}).catch(()=>{
    console.log("Can't connect to Database");
    
})


module.exports=mongoose;
