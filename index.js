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

// Setup route for profile photos
app.use('/profilePhotos', express.static('public/uploads/profilePhotos'));

// Setup MySQL
const mysql = require('mysql');
const { makeDb } = require('mysql-async-simple');
const { databaseConfig } = require('./dbConfig.js');


function establishConnection () {
  let connection = mysql.createConnection(databaseConfig);

  return connection;
}

// Setup Images
const profilePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // First Create correct folder if correct folder does not exist
    let dir = './public/uploads/profilePhotos/';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    // Set File Directory
    cb(null, ('public/uploads/profilePhotos/'));
  },
  filename: function(req, file, cb){
    let fileName = req.body.uid + ".png";
    //    let fileName = req.body.uid + path.extname(file.originalname);
    //Date.now() + path.extname(file.originalname)
    cb(null, fileName);
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

  // Get User Community Data
  app.post('/getUserCommunityData', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let userCommunityData;

    // Make Query
    try {
      let sql = `Select COMMUNITY.CommunityID, CommunityName from USERCOMMUNITY, COMMUNITY where UserCommunity.UserID = '${req.body.uid}' and USERCOMMUNITY.CommunityID = COMMUNITY.CommunityID`;
      userCommunityData = await db.query(connection, sql);

    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log("Sending Data Back\n");
    res.send(userCommunityData);
  })

  // Load Community
  app.post('/getCommunityData', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `SELECT * from COMMUNITY WHERE CommunityID = '${req.body.communityID}'`;
      communityData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log("Sending Data Back\n");
    res.send(communityData);
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

        let sql = `INSERT into COMMUNITY VALUES (null, '${req.body.communityName}', '${req.body.communityDesc}', null, null, null, null, '${communityJoinCode}')`;
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

  //Join Community
  app.post('/userJoinCommunity', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `SELECT CommunityID from COMMUNITY WHERE communityJoinCode = '${req.body.communityJoinCode}';`;
      communityData = await db.query(connection, sql);
      //---------------
      let commID = communityData[0].CommunityID;

      sql = `SELECT userID from USERCOMMUNITY WHERE userID = '${req.body.uid}' and communityID = '${commID}';`;
      currentUser = await db.query(connection, sql);

      if(currentUser.length === 0) {
        sql = `INSERT into userCommunity (userID, communityID, AdminTrue, PriorityLevel) VALUES ('${req.body.uid}','${commID}', 0, 1);`;
        db.query(connection, sql);
      }
      else {
        // Send the data back
        console.log("User Already a part of the Community\n");
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

  // Chat
  app.post('/getChannelData', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let channelData;

    // Make Query
    try {
      let sql = `SELECT ChannelID, ChannelName from CHANNEL WHERE CommunityID = '${req.body.commID}'`;
      channelData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log(channelData[0]);
    console.log("Sending Data Back...\n");
    res.send(channelData);
  })

  app.post('/getMessageData', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let messageData;

    // Make Query
    try {
      let sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID)`;
      messageData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log(messageData[0]);
    console.log("Sending Data Back\n");
    res.send(messageData);
  })

  app.post('/sendMessage', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let messageData;
    let isUnique;
    let index = 0;

    // Make Query
    try {
      let sql = `SELECT MessageID from Message where messageID = '${req.body.messageID+index}' and ChannelID = '${req.body.chanID}' and CommunityID = '${req.body.commID}'`;
      isUnique = await db.query(connection, sql);
      while(isUnique.length)
      {
        index += 1;
        sql = `SELECT MessageID from Message where messageID = '${req.body.messageID+index}' and ChannelID = '${req.body.chanID}' and CommunityID = '${req.body.commID}'`;
        isUnique = await db.query(connection, sql);
      }
      sql = `INSERT INTO MESSAGE VALUES ('${req.body.messageID+index}', '${req.body.chanID}', '${req.body.commID}', '${req.body.uid}', '${req.body.messageText}', '${req.body.messageDateTime}')`;
      db.query(connection, sql);

      sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE MessageID = '${req.body.messageID+index}' and CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID)`;
      messageData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Let them know it made it!
    console.log("Message Sent Successfully!!\n");

    // Send the data back
    console.log(messageData[0].UserName);
    console.log("Sending Data Back\n");
    res.send(messageData);
  })


  // Upload Profile Image
  app.post('/uploadProfilePhoto', profilePhotoUpload.single('profilePhoto'), function (req, res, next) {
    console.log("Photo Uploaded by " + req.body.uid);
  })

  // Delete Images

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}

main();
