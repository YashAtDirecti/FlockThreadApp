var flock = require('flockos');
var config = require('./config.js');
var threadModel = require('./Model/threadManager.js')
var express = require('express');
var fs = require('fs');

flock.setAppId(config.appId);
flock.setAppSecret(config.appSecret);

var app = express();

// Listen for events on /events, and verify event tokens using the token verifier.
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);
app.get('/events', flock.events.listener);
app.get('/reply', flock.reply.listener);

// Read tokens from a local file, if possible.
var tokens;
try {
    tokens = require('./tokens.json');
} catch (e) {
    tokens = {};
}

var attachmentId;
try {
    attachmentId = require('./attachmentId.json');
} catch (e) {
    attachmentId = {};
}


// send text Message
var sendMessageToUser = function (userId, text){
	flock.chat.sendMessage(config.botSecret, {
	    to: userId,
	    text: text
	}, function (error, response) {
	    if (error)
	        console.log('error: ', error);
	    else
	        console.log('Return response:', response);
	});
}

// save tokens on app.install
flock.events.on('app.install', function (event) {
    tokens[event.userId] = event.token;
	sendMessageToUser(event.userId, 'Thread App installed');
});

flock.events.on('chat.receiveMessage', function (event) {
    console.log('Event: ', event);
	sendMessageToUser(event.userId, 'hello');
});

newAttachmentId = function(){
	var attachmentCount;
	
	if('attachmentId' in attachmentId)
	{
		console.log('AttachmentId: ', attachmentId['attachmentId']);
		attachmentCount = attachmentId['attachmentId'] + 1;
	}
	else
	{
		attachmentCount = 1;
	}
	
	attachmentId['attachmentId'] = attachmentCount;
	console.log('AttachmentId: ', attachmentId['attachmentId']);
	
	return 'attachmentId'+attachmentCount;
}

flock.events.on('client.slashCommand', function (event) {
    console.log('Event: ', event);
	//sendMessageToUser(event.userId, 'slash command received');
	//var params = event.text.split(/[\s]+/);
	var sub = event.text;
	//var count = params[1];
	//
	// for(var i = 0 ;  i < count; i++){
	// 	sendMessageToUser(event.userId, 'hello '+sub);
	// }
	
	var attachments = [{
		id: newAttachmentId(),
		appId: config.appId,
		color: '#0ABE51',
	    views: {
	        // For image, only "src" is mandatory, everything else is optional
			flockml: '<flockml><strong>Thread created by: </strong>'+event.userName+'<br/><strong>Sub:</strong> '+sub+'</flockml>',
	        // not vivible due to precedence
			// image: {
	        //     original: { src: 'https://i.flockusercontent2.com/e7140a714852755850a65a47', width: 400, height: 400 },
	        //     thumbnail: { src: "https://i.flockusercontent2.com/e7140a714852755850a65a47", width: 100, height: 100 },
	        //     filename: "Sample.png"
	        // }
	    },
		buttons: [ 
				{
			        name: 'View',
			        icon: '',
			        action: { type: 'openWidget', desktopType: 'modal', mobileType: 'modal', url: 'https://f008e7e5.ngrok.io/events' },
			        id: "viewThread"
			    }]
		}];
	
	var threadId = threadModel.addThread(sub, event);
	
	var id = event.chat;
	var sender = tokens[event.userId];
	
	if(id.startsWith('u:')){
		id = event.userId;
		sender = config.botSecret;;
	}
		
	flock.chat.sendMessage(sender, {
	    to: id,
	    text: 'Thread Created',
		attachments: attachments
	}, function (error, response) {
	    if (error)
	        console.log('error: ', error);
	    else{
			threadModel.associateThreadIdWithMessageId(threadId, response.uid);
	        console.log('Return response of slash command:', response);
		}
	});
});

sendThreadReplyAttachmentMsg = function(event){
	var thread = threadModel.fetchThread(event.messageUid);
	
	var attachments = [{
		id: newAttachmentId(),
		appId: config.appId,
		color: '#0ABE51',
	    views: {
	        // For image, only "src" is mandatory, everything else is optional
			flockml: '<flockml><strong>'+event.userName+':</strong> '+event.replyMessage+'<br/></flockml>',
	        // not vivible due to precedence
			// image: {
	        //     original: { src: 'https://i.flockusercontent2.com/e7140a714852755850a65a47', width: 400, height: 400 },
	        //     thumbnail: { src: "https://i.flockusercontent2.com/e7140a714852755850a65a47", width: 100, height: 100 },
	        //     filename: "Sample.png"
	        // }
	    },
		buttons: [ 
				{
			        name: 'View',
			        icon: '',
			        action: { type: 'openWidget', desktopType: 'modal', mobileType: 'modal', url: 'https://f008e7e5.ngrok.io/events' },
			        id: "viewThread"
			    }]
		}];
		var attachments2 = [{
			id: newAttachmentId(),
			appId: config.appId,
			color: '#0ABE51',
		    views: {
		        // For image, only "src" is mandatory, everything else is optional
				flockml: '<flockml><strong>'+event.userName+':</strong> 2nd: '+event.replyMessage+'<br/></flockml>',
		        // not vivible due to precedence
				// image: {
		        //     original: { src: 'https://i.flockusercontent2.com/e7140a714852755850a65a47', width: 400, height: 400 },
		        //     thumbnail: { src: "https://i.flockusercontent2.com/e7140a714852755850a65a47", width: 100, height: 100 },
		        //     filename: "Sample.png"
		        // }
		    },
			buttons: [ 
					{
				        name: 'View',
				        icon: '',
				        action: { type: 'openWidget', desktopType: 'modal', mobileType: 'modal', url: 'https://f008e7e5.ngrok.io/events' },
				        id: "viewThread"
				    }]
			}];
			var attachments3 = [{
				id: newAttachmentId(),
				appId: config.appId,
				color: '#0ABE51',
			    views: {
			        // For image, only "src" is mandatory, everything else is optional
					flockml: '<flockml><strong>'+event.userName+':</strong> 3rd:'+event.replyMessage+'<br/></flockml>',
			        // not vivible due to precedence
					// image: {
			        //     original: { src: 'https://i.flockusercontent2.com/e7140a714852755850a65a47', width: 400, height: 400 },
			        //     thumbnail: { src: "https://i.flockusercontent2.com/e7140a714852755850a65a47", width: 100, height: 100 },
			        //     filename: "Sample.png"
			        // }
			    },
				buttons: [ 
						{
					        name: 'View',
					        icon: '',
					        action: { type: 'openWidget', desktopType: 'modal', mobileType: 'modal', url: 'https://f008e7e5.ngrok.io/events' },
					        id: "viewThread"
					    }]
				}];
			
	console.log('Thread:', thread);
	var id = thread.chatId;
	var sender = tokens[event.userId];
	
	if(id.startsWith('u:')){
		id = event.userId;
		sender = config.botSecret;;
	}
			
	flock.chat.sendMessage(sender, {
	    to: id,
	    text: event.userName+' has replied on the thread: '+thread.sub,
		attachments: attachments
	}, function (error, response) {
	    if (error)
	        console.log('error: ', error);
	    else{
	        console.log('Return response of Reply on thread:', response);
			threadModel.associateThreadIdWithMessageId(thread.id, response.uid);
			flock.chat.addAttachments(sender, {
			    messageUid: response.uid,
			    chat: id,
				attachments: attachments2
			}, function (error, response) {
			    if (error)
			        console.log('error: ', error);
			    else{
			        console.log('Return response of Reply on thread:', response);
				}
			});
			flock.chat.addAttachments(sender, {
			    messageUid: response.uid,
			    chat: id,
				attachments: attachments3
			}, function (error, response) {
			    if (error)
			        console.log('error: ', error);
			    else{
			        console.log('Return response of Reply on thread:', response);
				}
			});
		}
	});
}

sendThreadReply = function(event){
	var msgs = threadModel.fetchThreadMessages(event.messageUid);
	
	var msgtext = '';
	
	for(var i = 0 ;  i < msgs.length; i++){
		msgtext += '<B>'+msgs[i].userName+': </B>'+msgs[i].text+'<BR/><BR/>';
	}
	
	var page = '<HTML>\
				<HEAD>\
				<script src="/path/to/flock.js"></script>\
				</HEAD>\
				<BODY BGCOLOR="FFFFFF">\
				<B>Sub: </B>'+threadModel.fetchThreadSubject(event.messageUid)+'<BR/>\
				<B>Created By: </B>'+threadModel.fetchThreadUserName(event.messageUid)+'<BR/>\
				<HR>\
				'+msgtext+'\
				<HR>\
				<form action="https://f008e7e5.ngrok.io/reply" method="get">\
				<input type=hidden name=threadMessageUid value='+event.messageUid+'>\
				<input type=hidden name=userId value='+event.userId+'>\
				<input type=hidden name=userName value=\"'+event.userName+'\">\
				<input type=hidden name=eventName value="thread.replyMessage">\
				Reply : <br />\
				<textarea rows="5" cols="50" name="replyMessage" placeholder="Enter text..."></textarea>\
				<input type="submit" value="Send">\
				</form>\
				</BODY>\
				</HTML>';
		return page;
}

flock.events.on('client.pressButton', function (event) {
	if (event.buttonId == 'viewThread'){
		return sendThreadReply(event);
	}
	else
	{
		console.log('No action registered for this button id: ', event.buttonId);
	}
});

// add reply msg and send the updated html page
flock.reply.on('thread.replyMessage', function (event) {
    console.log('Flock Relpy received');
	threadModel.addMessageInThread(event.messageUid, event.replyMessage, event.userName);
	sendThreadReplyAttachmentMsg(event);
	return sendThreadReply(event);
});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function (event) {
    delete tokens[event.userId];
});

// Start the listener after reading the port from config
var port = config.port || 8080;
app.listen(port, function () {
    console.log('Listening on port: ' + port);
});

// exit handling -- save tokens in token.js before leaving
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function () {
	threadModel.onExit();
    fs.writeFileSync('./tokens.json', JSON.stringify(tokens));
    fs.writeFileSync('./attachmentId.json', JSON.stringify(attachmentId));
});

