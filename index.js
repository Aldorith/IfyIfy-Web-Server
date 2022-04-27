const express = require('express');
const app = express();
const port = 3000;
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
    console.log("\n /getUserData - API REQUEST RECEIVED");

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
        fs.copyFile('defaultProfilePhoto.png', "public/uploads/profilePhotos/" + req.body.uid + '.png', (err) => {
          if (err) throw err;
          console.log('Default Profile Photo Copied');
        });

        // Now Re-query the Database (This might be unnecessary as I think about it, but it keeps everything uniform at least, we may remove later)
        sql = `SELECT * from MEMBER WHERE UserID = '${req.body.uid}'`;
        userData = await db.query(connection, sql);

        // Here
        //communities = ....;
        //userData.communities = communities;

      } else {
        console.log("user already in database");
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
      let sql = `Select COMMUNITY.CommunityID, CommunityName, CommunityJoinCode, AdminTrue from USERCOMMUNITY, COMMUNITY where USERCOMMUNITY.UserID = '${req.body.uid}' and USERCOMMUNITY.CommunityID = COMMUNITY.CommunityID`;
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
    let isUnique;
    let index = 0;

    // Make Query
    try {
      let sql = `SELECT CommunityID from COMMUNITY where CommunityID = '${index}'`;
      isUnique = await db.query(connection, sql);
      while (isUnique.length) {
        index += 1;
        sql = `SELECT CommunityID from COMMUNITY where CommunityID = '${index}'`;
        isUnique = await db.query(connection, sql);
      }
      // Generate Unique CommunityID
      let num = Date.now().toString(36) + Math.random().toString(36).substr(2);
      let communityJoinCode = num.slice(3,10);

      sql = `INSERT INTO COMMUNITY (CommunityName, CommunityDescription, CommunityJoinCode) VALUES ('${req.body.communityName}', '${req.body.communityDesc}', '${communityJoinCode}');`;
      await db.query(connection, sql);

      sql = `SELECT LAST_INSERT_ID() AS ID`;
      let id = await db.query(connection, sql);
      id = id[0].ID;

      sql = `INSERT INTO CHANNEL (ChannelID, CommunityID, ChannelName) VALUES (1, '${id}', "Channel 1");`;
      await db.query(connection, sql);

      sql = `SELECT * from COMMUNITY WHERE CommunityID = '${id}';`;
      communityData = await db.query(connection, sql);

      //console.log(communityData);

      // Setup Default Images
      fs.copyFile('defaultCommunityIcon.png', "public/uploads/communityIcons/" + id + '.png', (err) => {
        if (err) throw err;
        console.log('Default Community Photo Copied');
      });
      fs.copyFile('defaultHeader.png', "public/uploads/communityHeaders/" + id + '.png', (err) => {
        if (err) throw err;
        console.log('Default Header Photo Copied');
      });


      sql = `INSERT INTO USERCOMMUNITY (UserID, CommunityID, AdminTrue, PriorityLevel) VALUES ('${req.body.uid}',${id}, 1, 1);`;
      await db.query(connection, sql);
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
        sql = `INSERT into USERCOMMUNITY (userID, communityID, AdminTrue, PriorityLevel) VALUES ('${req.body.uid}','${commID}', 0, 1);`;
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
      let sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID) ORDER BY MessageID`;
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

    // Make Query
    try {
      let sql = `INSERT INTO MESSAGE (ChannelID, CommunityID, UserID, MessageText, MessageDateTime)VALUES ('${req.body.chanID}', '${req.body.commID}', '${req.body.uid}', '${req.body.messageText}', '${req.body.messageDateTime}')`;
      db.query(connection, sql);

      sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID) ORDER BY MessageID`;
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

  //Delete Messages
  app.post('/deleteMessage', jsonParser, async function (req, res) {
    console.log("\nAPI REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    // Setup Response Data
    let messageData;

    // Make Query
    try {
      console.log("MessID: "+ req.body.messID);
      let sql = `DELETE FROM MESSAGE WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and MessageID = '${req.body.messID}';`;
      await db.query(connection, sql);

      sql = `SELECT UserName, MessageText, MessageDateTime, MessageID from MESSAGE, MEMBER WHERE CommunityID = '${req.body.commID}' and ChannelID = '${req.body.chanID}' and (MEMBER.UserID = MESSAGE.UserID) ORDER BY MessageID`;
      messageData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }

    // Send the data back
    console.log(messageData[0]);
    console.log("Sending Updated Message Data Back After Delete\n");
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
    let calendarData;

    try{
    let sql = `DELETE FROM EVENT WHERE EventID = '${req.body.eventID}' and CommunityID = '${req.body.commID}';`;
    await db.query(connection, sql);
    sql = `SELECT EventID, EventTitle, EventDescription, EventDateTime, EventLocation From EVENT WHERE CommunityID = '${req.body.commID}' ORDER BY EventDateTime ASC`;
    calendarData = await db.query(connection, sql);
  } catch (e) {
    console.log(e);
  } finally {
    await db.close(connection);
  }
  // Send the data back
  console.log("EVENT_DATA: "+calendarData[0]);
  console.log("Sending Data Back\n");
  res.send(calendarData);
  })

  // Edit Calendar Event
  app.post('/editCalendarEvent', jsonParser, async function (req, res) {
    console.log("\nEdit Calender Event API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM EVENT WHERE EventID = '${req.body.EventID}'`;
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
      let sql = `SELECT EventID, EventTitle, EventDescription, EventDateTime, EventLocation From EVENT WHERE CommunityID = '${req.body.communityID}' ORDER BY EventDateTime ASC`;
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
    console.log(req.body.communityID);
    console.log(req.body.announcementID);

    let announcementData;
    try {
      let sql = `DELETE FROM ANNOUNCEMENT WHERE AnnouncementID = '${req.body.announcementID}' and CommunityID = '${req.body.communityID}';`;
      await db.query(connection, sql);
      sql = `SELECT AnnouncementID, AnnouncementTitle, AnnouncementText FROM ANNOUNCEMENT WHERE CommunityID = '${req.body.communityID}'`;
      announcementData = await db.query(connection, sql);
    } catch (e) {
      console.log(e);
    } finally {
      await db.close(connection);
    }
    // Send the data back
    console.log("ANNOUNCEMENT_DATA: "+announcementData[0]);
    console.log("Sending Data Back\n");
    res.send(announcementData);
  })

  //Edit Announcement
  app.post('/editAnnouncement', jsonParser, async function (req, res) {
    console.log("\nEdit Announcement API REQUEST RECEIVED");

    // Establish Database Connection
    const connection = establishConnection();
    const db = makeDb();
    await db.connect(connection);

    let sql = `DELETE FROM ANNOUNCEMENT WHERE AnnouncementID = '${req.body.announcementID}'`;
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
      let sql = `SELECT AnnouncementID, AnnouncementTitle, AnnouncementText FROM ANNOUNCEMENT WHERE CommunityID = '${req.body.communityID}'`;
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
      let sql = `select UserName, USERCOMMUNITY.UserID as uid FROM MEMBER MEMBER Inner Join USERCOMMUNITY USERCOMMUNITY ON MEMBER.UserID = USERCOMMUNITY.UserID AND USERCOMMUNITY.CommunityID = ${req.body.communityID};`;
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
