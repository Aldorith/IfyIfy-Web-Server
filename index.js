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
app.use('/communityIcons', express.static('public/uploads/communityIcons'));
app.use('/communityHeaders', express.static('public/uploads/communityHeaders'));

//Server Stuff
const httpServer = require('http').createServer(app);
const options = {
  'pingInterval':2000,
}
const io = require('socket.io')(httpServer.options);

io.on("connection", (socket) => {
  console.log(socket.id);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

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

const communityIconStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // First Create correct folder if correct folder does not exist
    let dir = './public/uploads/communityIcons/';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    // Set File Directory
    cb(null, ('public/uploads/communityIcons/'));
  },
  filename: function(req, file, cb){
    let fileName = req.body.CommunityID + ".png";
    //    let fileName = req.body.uid + path.extname(file.originalname);
    //Date.now() + path.extname(file.originalname)
    cb(null, fileName);
  }
});

const communityIconUpload = multer({ storage: communityIconStorage });

const communityHeaderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // First Create correct folder if correct folder does not exist
    let dir = './public/uploads/communityHeaders/';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    // Set File Directory
    cb(null, ('public/uploads/communityHeaders/'));
  },
  filename: function(req, file, cb){
    let fileName = req.body.CommunityID + ".png";
    //    let fileName = req.body.uid + path.extname(file.originalname);
    //Date.now() + path.extname(file.originalname)
    cb(null, fileName);
  }
});

const communityHeaderUpload = multer({ storage: communityHeaderStorage });

// We will organize this better next sprint
async function main() {

  //Establish connection for broadcasting messages:
  app.on('connection', socket => {
    console.log('Some client connected')
  })

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

        // Setup Default Profile Photo
        fs.copyFile('/defaultProfilePhoto.png', "public/uploads/profilePhotos/" + req.body.uid + '.png', (err) => {
          if (err) throw err;
          console.log('Default Profile Photo Copied');
        });

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
      } else {
        console.log("Adding Community to Database");

        // Generate Unique CommunityID
        let num = Date.now().toString(36) + Math.random().toString(36).substr(2);
        let communityJoinCode = num.slice(3, 10);

        // // TODO: Verify joinCode does not already exist
        // Connor B. can you do this

        let sql = `INSERT into COMMUNITY VALUES (null, '${req.body.communityName}', '${req.body.communityDesc}', null, '${communityJoinCode}')`;
        db.query(connection, sql);

        // Get ID
        sql = `SELECT * from COMMUNITY WHERE CommunityName = '${req.body.communityName}'`;
        communityData = await db.query(connection, sql);
        communityData.statusCode = 200;

        sql = `INSERT into USERCOMMUNITY VALUES ('${req.body.uid}','${communityData[0].CommunityID}', true, 3)`;
        db.query(connection, sql);

        // Assign Default Community Icon
        fs.copyFile('defaultCommunityIcon.png', "public/uploads/communityIcons/" + communityData[0].CommunityID + '.png', (err) => {
          if (err) throw err;
          console.log('Default Community Icon Copied');
        });

        // Assign Default Community Header
        fs.copyFile('defaultHeader.png', "public/uploads/communityHeaders/" + communityData[0].CommunityID + '.png', (err) => {
          if (err) throw err;
          console.log('Default Community Header Copied');
        });
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

  // Delete Community
  app.post('/removeCommunity', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `DELETE FROM USERCOMMUNITY WHERE CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);

      sql = `DELETE FROM CHANNEL WHERE CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);

      sql = `DELETE FROM ANNOUNCEMENT WHERE CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);

      sql = `DELETE FROM EVENT WHERE CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);

      sql = `DELETE FROM COMMUNITY WHERE CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }


    res.send(null);
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

      if (currentUser.length === 0) {
        sql = `INSERT into userCommunity (userID, communityID, AdminTrue, PriorityLevel) VALUES ('${req.body.uid}','${commID}', 0, 1);`;
        db.query(connection, sql);
      } else {
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

  // Leave Community
  app.post('/userLeaveCommunity', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let communityData;

    // Make Query
    try {
      let sql = `DELETE FROM USERCOMMUNITY WHERE UserID = '${req.body.uid}' AND CommunityID = '${req.body.communityID}'`;
      db.query(connection, sql);

      console.log("Trying to remove user from community");
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }


    res.send(null);
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

  //Send Message
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
      while (isUnique.length) {
        index += 1;
        sql = `SELECT MessageID from Message where messageID = '${req.body.messageID+index}' and ChannelID = '${req.body.chanID}' and CommunityID = '${req.body.commID}'`;
        isUnique = await db.query(connection, sql);
      }
      sql = `INSERT INTO MESSAGE VALUES ('${req.body.messageID+index}', '${req.body.chanID}', '${req.body.commID}', '${req.body.uid}', '${req.body.messageText}', '${req.body.messageDateTime}')`;
      db.query(connection, sql);

      sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID)`;
      messageData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Let them know it made it!
    console.log("Message Sent Successfully!!\n");

    // Send the data back
    console.log(messageData[0]);
    console.log("Sending Data Back\n");
    res.send(messageData);
  })

  //Add New Channel
  app.post('/addChannel', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let channelData;
    let uniqueID;
    let index = 1;

    // Make Query
    try {
      let sql = `SELECT ChannelID from CHANNEL where ChannelID = '${index}' and CommunityID = '${req.body.commID}';`;
      uniqueID = await db.query(connection, sql);
      while (uniqueID.length) {
        index += 1;
        sql = `SELECT ChannelID from CHANNEL where ChannelID = '${index}' and CommunityID = '${req.body.commID}';`;
        uniqueID = await db.query(connection, sql);
      }
      sql = `INSERT INTO CHANNEL VALUES ('${index}','${req.body.commID}','${req.body.channelName}');`;
      await db.query(connection, sql);
      //---------------

      sql = `SELECT ChannelID, ChannelName from CHANNEL WHERE CommunityID = '${req.body.commID}';`;
      channelData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log("Sending Channel Data Back\n");
    res.send(channelData);
  })

  //Delete a Channel
  app.post('/deleteChannel', jsonParser, async function (req, res) {
    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let channelData;

    // Make Query
    try {
      let sql = `DELETE from MESSAGE where CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}';`;
      await db.query(connection, sql);

      console.log("Channel Messages Deleted Successfully")

      sql = `DELETE from CHANNEL where CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}';`;
      await db.query(connection, sql);
      console.log("Channel Deleted Successfully")

      sql = `SELECT ChannelID, ChannelName from CHANNEL WHERE CommunityID = '${req.body.commID}'`;
      channelData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log("Sending Data Back\n");
    res.send(channelData);
  })

  // Create Calendar Event
  app.post('/createCalendarEvent', jsonParser, async function (req, res) {
    console.log("\nCalendar Event Creation API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Add Event
    // Generate Unique announcementID
    let num = Date.now().toString(2);
    let eventID = parseInt(num.substring(num.length-5, num.length));

    // store announcement data
    let eventData;

    // make query
    try {
      let sql = `INSERT into EVENT VALUES ('${eventID}', '${req.body.communityID}' , '${req.body.eventTitle}' , '${req.body.eventDescription}', '${req.body.eventDateTime}', '${req.body.eventLocation}')`;
      eventData = await db.query(connection, sql);
    }  catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }
    console.log("Sending Data Back\n");
    res.send(eventData);
  })

  // Delete Calendar Event
  app.post('/deleteCalendarEvent', jsonParser, async function (req, res) {
    console.log("\nDelete Calendar Event API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM EVENT WHERE EventID = (${req.body.eventID});`;
    db.query(connection, sql);
  })

  // Edit Calendar Event
  app.post('/editCalendarEvent', jsonParser, async function (req, res) {
    console.log("\nEdit Calender Event API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM Event WHERE EventID = '${req.body.EventID}'`;
    db.query(connection, sql);

    sql = `INSERT into EVENT VALUES (${req.body.eventID}, ${req.body.communityID}, '${req.body.calendarEventName}' , '${req.body.calendarEventDesc}' , '${req.body.calendarEventDay}' , '${req.body.calendarEventLocation}')`;
    db.query(connection, sql);

    await db.close(connection);
  })

  //LoadCalendar
  app.post('/loadCalendar', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let calendarData;

    // Make Query
    try {
      let sql = `SELECT EventID, EventTitle, EventDescription, EventDateTime, EventLocation From Event WHERE CommunityID = '${req.body.communityID}'`;
      calendarData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log(calendarData[0]);
    console.log("Sending Data Back\n");
    res.send(calendarData);
  })

  // Create Announcement
  app.post('/createAnnouncement', jsonParser, async function (req, res) {
    console.log("\nAnnouncement Creation API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Add Event
    // Generate Unique announcementID
    let num = Date.now().toString(2);
    let announcementID = parseInt(num.substring(num.length-5, num.length));

    // set announcement to not pinned by default
    const current = new Date();
    const date = `${current.getFullYear()}-${current.getMonth()+1}-${current.getDate()}`;

    // store announcement data
    let announcementData;

    // make query
    try {
      let sql = `INSERT into ANNOUNCEMENT VALUES ('${announcementID}', '${req.body.communityID}', '${req.body.announcementTitle}' , '${req.body.announcementDesc}')`;
      announcementData = await db.query(connection, sql);
    }  catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }
    console.log("Sending Data Back\n");
    res.send(announcementData);
  })

  // Update Community
  app.post('/updateCommunity', jsonParser, async function (req, res) {
    console.log("\nCommunity Update API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // store announcement data
    let communityData;

    // make query
    try {
      let sql = `UPDATE COMMUNITY SET CommunityName = '${req.body.communityName}', CommunityDescription='${req.body.communityDesc}', CommunityRules='${req.body.communityRules}' WHERE CommunityID='${req.body.communityID}'`;
      communityData = await db.query(connection, sql);
    }  catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }


    res.send(communityData);
  })

  //Delete Announcement
  app.post('/deleteAnnouncement', jsonParser, async function (req, res) {
    console.log("\nDelete Announcement API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM Announcement WHERE AnnouncementID = '${req.body.announcementID}'`;
    db.query(connection, sql);

    await db.close(connection);
  })

  //Edit Announcement
  app.post('/editAnnouncement', jsonParser, async function (req, res) {
    console.log("\nEdit Announcement API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM Announcement WHERE AnnouncementID = '${req.body.announcementID}'`;
    db.query(connection, sql);

    sql = `INSERT into ANNOUNCEMENT VALUES ('${req.body.announcementID}', '${req.body.communityID}' , '${req.body.announcementTitle}' , '${req.body.announcementContents}')`;
    db.query(connection, sql);

    await db.close(connection);
  })

  //LoadAnnouncement
  app.post('/loadAnnouncement', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let announcementData;

    // Make Query
    try {
      let sql = `SELECT AnnouncementID, AnnouncementTitle, AnnouncementText FROM Announcement WHERE CommunityID = '${req.body.communityID}'`;
      announcementData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log(announcementData[0]);
    console.log("Sending Data Back\n");
    res.send(announcementData);
  })

  /* I think the directory table is redundant since the same data is stored in the usercommunity table
  //addToDirectory
  app.post('/addToDirectory', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED TO ADD USER TO DIRECTORY");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Make Query
    try {
      let sql = `INSERT into DIRECTORY VALUES ('${req.body.communityID}', '${req.body.userID}')`;
      db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    console.log("Succesfully Added User to Directory");
  })
  
  //removeUserFromDirectory
  
  //loadDirectory
  app.post('/loadDirectory', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED TO Load Directory USERS");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let usernameData
    let directoryData;

    // Make Query
    try {
      sql = `select UserName FROM Member Member Inner Join Directory Directory ON Member.UserID = Directory.UserID AND directory.CommunityID = ${req.body.communityID};`;
      directoryData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }



    // Send the data back
    console.log(directoryData[0]);
    console.log("Sending Data Back\n");
    res.send(directoryData);
  })

  */

  // Upload Profile Image
  app.post('/uploadProfilePhoto', profilePhotoUpload.single('profilePhoto'), function (req, res, next) {
    console.log("Photo Uploaded by " + req.body.uid);
  });

  // Upload Community Icon
  app.post('/uploadCommunityIcon', communityIconUpload.single('communityIcon'), function (req, res, next) {
    console.log("Updated Icon for " + req.body.CommunityID);
  });

  // Upload Community Header
  app.post('/uploadCommunityHeader', communityHeaderUpload.single('communityHeader'), function (req, res, next) {
    console.log("Updated Header for " + req.body.CommunityID);
  });

}

main();
