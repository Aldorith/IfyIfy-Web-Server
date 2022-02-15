const express = require('express')
const app = express()
const port = 8900

// Setup Cors
const cors=require("cors");
const corsOptions ={
   origin:'*',
   credentials:true,
   optionSuccessStatus:200,
}
app.use(cors(corsOptions))

// Setup MySQL
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'SE450'
});

app.post('/getUserData', (req, res) => {
  console.log("API REQUEST RECEIVED");

  // Make MySQL Query Here
  connection.connect();

  connection.end();

  // This is how we send the data back
  res.send('Hello World!');
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
