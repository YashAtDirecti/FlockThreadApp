var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/threadModelDB';

var chatsThreadCountList;
try {
    chatsThreadCountList = require('./chatsThreadCountList.json');
} catch (e) {
	console.log('chatsThreadCountList not found.');
    chatsThreadCountList = {};
}

var threadsDic;
try {
    threadsDic = require('./threadsDic.json');
} catch (e) {
    threadsDic = {};
}

var threadIdAndMessageMap;
try {
    threadIdAndMessageMap = require('./threadIdAndMessageMap.json');
} catch (e) {
    threadIdAndMessageMap = {};
}

var insertDocument = function(db, collection, document, callback) {
   db.collection(collection).insertOne( document, function(err, result) {
    assert.equal(err, null);
    console.log('Inserted a document into the '+collection+' collection.');
    callback();
  });
};

var replaceDocument = function(db, collection, condition, document, callback) {
   db.collection(collection).replaceOne(condition, document, function(err, result) {
    assert.equal(err, null);
    console.log('Replaced a document in the '+collection+' collection.');
    callback();
  });
};

var insertThread = function(thread)
{
	MongoClient.connect(url, function(err, db) {
 	   assert.equal(null, err);
	   console.log("Connected correctly to server.");
	   insertDocument(db, 'threadCollection', thread, function(){
		   db.close();
	   });
	});
}

var replaceThread = function(thread)
{
	MongoClient.connect(url, function(err, db) {
 	   assert.equal(null, err);
	   console.log("Connected correctly to server.");
	   replaceDocument(db, 'threadCollection', {id:thread.id}, thread, function(){
		   db.close();
	   });
	});
}

var insertThreadMessagePair = function(threadMessagePair)
{
	MongoClient.connect(url, function(err, db) {
 	   assert.equal(null, err);
	   console.log("Connected correctly to server.");
	   insertDocument(db, 'threadMessagePairCollection', threadMessagePair, function(){
		   db.close();
	   });
	});
}

var fetchDocument = function(db, collection, condition, callback){
	db.collection(collection).findOne(condition, function(err, doc){
		assert.equal(null, err);
		callback(doc);
	});
};

var fetchThreadFromDB = function(threadId, callback){
	MongoClient.connect(url, function(err, db) {
 	   assert.equal(null, err);
	   console.log("Connected correctly to server.");
	   fetchDocument(db, 'threadCollection', {id:threadId}, function(thread){
		   db.close();
		   callback(thread);
	   });
	});
}

var fetchThreadIdFromMessageId = function(messageId, callback){
	MongoClient.connect(url, function(err, db) {
 	   assert.equal(null, err);
	   console.log("Connected correctly to server.");
	   fetchDocument(db, 'threadCollection', {messageId:messageId}, function(messageIdThreadIdPair){
		   db.close();
		   callback(messageIdThreadIdPair.threadId);
	   });
	});
}

newThreadId = function(chatId){
	var threadCount;
	
	if(chatId in chatsThreadCountList)
	{
		console.log('ThreadId: ', chatsThreadCountList[chatId]);
		threadCount = chatsThreadCountList[chatId] + 1;
	}
	else
	{
		threadCount = 1;
	}
	
	chatsThreadCountList[chatId] = threadCount;
	
	return chatId+threadCount;
}

exports.addThread = function (sub, event) {
	var thread = {};
	thread.id = newThreadId(event.chat);
	thread.chatId = event.chat;
	thread.sub = sub;
	thread.createdBy = event.createdBy;
	thread.userName = event.userName;
	thread.messages = [];
	threadsDic[thread.id] = thread;
	console.log('Threads: %j', threadsDic);
	insertThread(thread);
	return thread.id;
};

exports.associateThreadIdWithMessageId = function (threadId, messageId) {
	console.log('Message Id: ', messageId);
	console.log('Thread Id: ', threadId);
	var threadMessagePair = {};
	threadMessagePair.messageId = messageId;
	threadMessagePair.threadId = threadId;
	
	insertThreadMessagePair(threadMessagePair);
	
	threadIdAndMessageMap[messageId] = threadId;
	console.log('ThreadMessageDic: %j', threadIdAndMessageMap);
};

exports.fetchThread = function(messageId){
	return threadsDic[threadIdAndMessageMap[messageId]];
};

exports.fetchThreadSubject = function(messageId){
	var thread = threadsDic[threadIdAndMessageMap[messageId]];
	return thread.sub;
};

exports.fetchThreadUserName = function(messageId){
	var thread = threadsDic[threadIdAndMessageMap[messageId]];
	return thread.userName;
};

createMessage = function(text, userName){
	var msg = {};
	msg.text = text;
	msg.userName = userName;
	
	return msg;
};

exports.addMessageInThread = function(messageId, text, userName){
	var thread = threadsDic[threadIdAndMessageMap[messageId]];
	thread.messages.push(createMessage(text,userName));
	//replaceThread(thread);
	threadsDic[thread.id] = thread;
};

exports.fetchThreadMessages = function(messageId){
	var thread = threadsDic[threadIdAndMessageMap[messageId]];
	return thread.messages;
};

exports.onExit = function(){
	console.log('Save files.');
	
	try{
    fs.writeFileSync('./Model/chatsThreadCountList.json', JSON.stringify(chatsThreadCountList));
    fs.writeFileSync('./Model/threadIdAndMessageMap.json', JSON.stringify(threadIdAndMessageMap));
    fs.writeFileSync('./Model/threadsDic.json', JSON.stringify(threadsDic));
	}
	catch (e){
		console.log('Save files.');
	}
};
