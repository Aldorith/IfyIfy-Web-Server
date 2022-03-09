const express = require('express')
const app = express()
const port = 8900
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

// Setup Cors
const cors=require("cors");
const corsOptions = {
   origin:'*',
   credentials:true,
   optionSuccessStatus:200,
}
app.use(cors(corsOptions))

// Setup MySQL
var mysql      = require('mysql');
const { makeDb } = require('mysql-async-simple');

function establishConnection () {
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'ServerAdmin',
    password : 'ifyify',
    database : 'ifyify',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  return connection;
}

// We will organize this better next sprint
async function main() {
  app.post('/getUserData', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let userData;

    // Make Query
    try {
      let sql = `SELECT * from MEMBER WHERE UserID = '${req.body.uid}'`;
      userData = await db.query(connection, sql);

      if (userData.length === 0) {
        console.log("Adding User to Database");
        let sql = `INSERT into MEMBER VALUES ('${req.body.uid}', '${req.body.username}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', null)`;
        db.query(connection, sql);

        // Now Re-query the Database (This might be unnecessary as I think about it, but it keeps everything uniform at least, we may remove later)
        sql = `SELECT * from MEMBER WHERE UserID = '${req.body.uid}'`;
        userData = await db.query(connection, sql);

        // Here
        //communities = ....;
        //userData.communities = communities;

      }
    } catch (e) {
        console.log(e);
    } finally {
        await db.close(connection);
    }

    // Send the data back
    console.log("Sending Data Back\n");
    res.send(userData);
  })

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })

}

async function addCommunity(){
  app.post('/addCommunity', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `SELECT * from MEMBER WHERE communityID = '${req.body.communityID}'`;
      communityData = await db.query(connection, sql);

      if (communityData.length > 0) {
        console.log("Error, that Community Already Exists");

        console.log("Sending Data Back\n");
        res.send(null);
      }
      else
      {
        console.log("Adding Community to Database");
        let sql = `INSERT into MEMBER VALUES ('${req.body.communityID}', '${req.body.communityDesciption}',null)`;
        db.query(connection, sql);

      }
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log("Sending Data Back\n");
    res.send(communityData);
  })

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}

main();
