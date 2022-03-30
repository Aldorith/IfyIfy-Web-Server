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
	CommunityDescription VARCHAR(250),
	LogoID integer,
	HeaderID integer,
	primaryColor VARCHAR(20),
	secondaryColor VARCHAR(20),
	communityJoinCode VARCHAR(7),
	CONSTRAINT Community_PK PRIMARY KEY(CommunityID)) engine = innodb;

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
	CONSTRAINT Channel_FK FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

CREATE TABLE MESSAGE (
	MessageID integer not null,
	ChannelID integer not null,
	CommunityID integer not null,
	UserID VARCHAR(128),
	MessageText VARCHAR(150),
	MessageDateTime TIMESTAMP,
	CONSTRAINT Message_PK PRIMARY KEY (MessageID, ChannelID, CommunityID),
	CONSTRAINT Message_FK1 FOREIGN KEY (ChannelID) references CHANNEL(ChannelID),
	CONSTRAINT Message_FK2 FOREIGN KEY (CommunityID) references COMMUNITY(CommunityID)) engine = innodb;

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
	CurrentDate Date,
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

INSERT INTO MEMBER VALUES
	(1, 'KyleMeister', 'Kyle', 'McCotter', 'kyle.McCotter@biola.edu', 111),
	(2, 'MuraneMan', 'Connor', 'Murane', 'Connor.Murrane@biola.edu', 112),
	(3, 'Baconator', 'Connor', 'Bacon', 'Connor.Bacon@biola.edu', 114),
	(4, 'Broderson', 'Brody', 'Schippa', 'brody.schippa@biola.edu', 113);

INSERT INTO COMMUNITY VALUES
	(1, 'Zion', 'X','011', '0','Black', 'Purple', 'AGz2753'),
	(2, 'Commuters', 'X','012', '0','Brown', 'Beige', 'CommUtr'),
	(3, 'Sigma', 'X','013', '0', 'Green', 'Yellow', 'SigMerz');

INSERT INTO USERCOMMUNITY VALUES
	(1, 1, 1, 0),
	(2, 2, 1, 0),
	(3, 3, 1, 0),
	(4, 1, 0, 0);

INSERT INTO CHANNEL VALUES
	(1, 1, 'General'),
	(2, 1, 'Fun Quotes'),
	(3, 1, 'Why Not?'),
	(1, 2, 'COMMUTERSUNITE!'),
	(2, 2, 'Events'),
	(1, 3, 'General'),
	(2, 3, 'BecauseConnorsaidso');

INSERT INTO MESSAGE VALUES
	(1, 1, 1, 1, 'Welcome to the general chat for our community', '2022-02-11 00:00:01'),
	(2, 1, 1, 4, 'Thanks @Kyle!', '2022-02-12 00:00:03'),
	(1, 1, 2, 1, 'If your email ends in Biola.edu, you can join biola.edu communities...', '2022-02-14 00:03:01'),
	(1, 2, 1, 2, 'Hello Commuters! My name is Connor! Welcome to this chat!', '2022-02-16 00:04:01'),
	(1, 2, 3, 3, 'Yo', '2022-02-13 00:00:00');

CREATE USER 'ServerAdmin'@'localhost' IDENTIFIED BY 'ifyify';

GRANT INSERT, DELETE, SELECT, UPDATE ON ifyify . * TO 'ServerAdmin'@'localhost';

FLUSH PRIVILEGES;
