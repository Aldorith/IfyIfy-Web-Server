const express = require('express');
const app = express();
const port = 8900;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// Image Requirements
const path = require("path");
const multer = require("multer");
const fs = require('fs');

// Setup Cors
const cors=require("cors");
const corsOptions = {
   origin:'*',
   credentials:true,
   optionSuccessStatus:200,
}
app.use(cors(corsOptions));

// Display Images
app.use(express.static(__dirname+'/uploads'));

// Setup MySQL
const mysql = require('mysql');
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

// Setup Images
const profilePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // First Create correct folder if correct folder does not exist
    let dir = './uploads/' + req.body.uid;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    // Set File Directory
    cb(null, ('uploads/'+req.body.uid))
  },
  filename: function(req, file, cb){
    let fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);

    // Update Database
  }
});

const profilePhotoUpload = multer({ storage: profilePhotoStorage });

// Will Sort this out later
// let images = require('./features/images')(app);


// We will organize this better next sprint
async function main() {
  // Get User Data
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

  // Create Community
  app.post('/createCommunity', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `SELECT CommunityID from COMMUNITY WHERE CommunityName = '${req.body.communityName}'`;
      communityData = await db.query(connection, sql);

      if (communityData.length !== 0) {
        console.log("Error, that Community Already Exists");

        // - TO DO Add more error checking

        console.log("Sending Error Messages Back\n");
        // Error Message
        /*
        900 - Community Already Exisits
        */
        let sendBack = {statusCode: 900};
        res.send(sendBack);
      }
      else
      {
        console.log("Adding Community to Database");

        // Generate Unique CommunityID
        let num = Date.now().toString(36) + Math.random().toString(36).substr(2);
        let communityJoinCode = num.slice(3,10);

        // // TODO: Verify joinCode does not already exist
        // Connor B. can you do this

        let sql = `INSERT into COMMUNITY VALUES (null, '${req.body.communityName}', '${req.body.communityDesc}',null, null, null, '${communityJoinCode}')`;
        db.query(connection, sql);

        // Get ID
        sql = `SELECT * from COMMUNITY WHERE CommunityName = '${req.body.communityName}'`;
        communityData = await db.query(connection, sql);
        communityData.statusCode = 200;

        sql = `INSERT into USERCOMMUNITY VALUES ('${req.body.uid}','${communityData[0].CommunityID}', true, 3)`;
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

  // Upload Profile Image
  app.post('/uploadProfilePhoto', profilePhotoUpload.single('profilePhoto'), function (req, res, next) {
    console.log("Photo Uploaded by " + req.body.uid);
  })

  // Get Images

  // Delete Images

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}

main();
