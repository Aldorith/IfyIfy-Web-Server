DROP SCHEMA ifyify;
CREATE SCHEMA ifyify;

use ifyify;

CREATE TABLE MEMBER (
	UserID VARCHAR(128) not null,
	UserName VARCHAR(20),
	FirstName VARCHAR(20),
	LastName VARCHAR(30),
	Email VARCHAR(40),
	ProfileImageID integer,
	CONSTRAINT Member_PK PRIMARY KEY(UserID)) engine = innodb;


CREATE TABLE COMMUNITY (
	CommunityID integer not null AUTO_INCREMENT,
	CommunityName VARCHAR(30),
	CommunityDescription VARCHAR(500),
	CommunityRules VARCHAR(1000),
	communityJoinCode VARCHAR(7),
	CONSTRAINT Community_PK PRIMARY KEY(CommunityID)) engine = innodb;

CREATE TABLE DIRECTORY (
    CommunityID varchar(35)
     not null,
    UserID varchar(35) not null,
    CONSTRAINT DIRECTORY_PK PRIMARY KEY(CommunityID)) engine = innodb;

CREATE TABLE USERCOMMUNITY (
	UserID VARCHAR(128) not null,
	CommunityID integer not null,
	AdminTrue TINYINT not null,
	PriorityLevel integer not null,
	CONSTRAINT UserCommunity_PK PRIMARY KEY(UserID, CommunityID),
	CONSTRAINT UserCommunity_FK1 FOREIGN KEY(UserID) references MEMBER(UserID),
	CONSTRAINT UserCommunity_FK2 FOREIGN KEY(CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

CREATE TABLE CHANNEL (
	ChannelID integer not null,
	CommunityID integer not null,
	ChannelName VARCHAR(20),
	CONSTRAINT Channel_PK PRIMARY KEY (ChannelID, CommunityID),
	CONSTRAINT Channel_FK FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID) ON DELETE CASCADE) engine = innodb;

CREATE TABLE MESSAGE (
	MessageID integer not null,
	ChannelID integer not null,
	CommunityID integer not null,
	UserID VARCHAR(128),
	MessageText VARCHAR(150),
	MessageDateTime TIMESTAMP,
	CONSTRAINT Message_PK PRIMARY KEY (MessageID, ChannelID, CommunityID),
	CONSTRAINT Message_FK1 FOREIGN KEY (ChannelID) references CHANNEL(ChannelID),
	CONSTRAINT Message_FK2 FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID) ON DELETE CASCADE);

CREATE TABLE IMAGE (
	ImageID integer not null,
	ImagePath VARCHAR(1024),
	CONSTRAINT Image_PK PRIMARY KEY (ImageID)) engine = innodb;

CREATE TABLE TEXTBOX (
	TextboxID integer not null,
	CommunityID integer not null,
	TextboxText VARCHAR(300),
	CONSTRAINT Textbox_PK PRIMARY KEY (TextboxID, CommunityID),
	CONSTRAINT Textbox_FK FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

CREATE TABLE ANNOUNCEMENT (
	AnnouncementID integer not null,
	CommunityID integer not null,
	AnnouncementTitle VARCHAR(30),
	AnnouncementText VARCHAR(200),
	CONSTRAINT Announcement_PK PRIMARY KEY (AnnouncementID, CommunityID),
	CONSTRAINT Announcement_FK FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

CREATE TABLE EVENT (
	EventID integer not null,
	CommunityID integer not null,
	EventTitle VARCHAR(30),
	EventDescription VARCHAR(70),
	EventDateTime VARCHAR(45),
	EventLocation VARCHAR(45),
	CONSTRAINT Event_PK PRIMARY KEY (EventID, CommunityID),
	CONSTRAINT Event_FK FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

/*Inserting Test Data*/
INSERT INTO COMMUNITY VALUES
	(1, 'Zion', 'X','Rules', 'AGz2753'),
	(2, 'Commuters', 'X','Rules', 'CommUtr'),
	(3, 'Sigma', 'X','Rule', 'SigMerz');

INSERT INTO CHANNEL VALUES
	(1, 1, 'General'),
	(2, 1, 'Fun Quotes'),
	(3, 1, 'Why Not?'),
	(1, 2, 'COMMUTERSUNITE!'),
	(2, 2, 'Events'),
	(1, 3, 'General'),
	(2, 3, 'BecauseConnorsaidso');


/*
CREATE USER 'ServerAdmin'@'localhost' IDENTIFIED BY 'ifyify';

GRANT INSERT, DELETE, SELECT, UPDATE ON ifyify . * TO 'ServerAdmin'@'localhost';

FLUSH PRIVILEGES;
*/