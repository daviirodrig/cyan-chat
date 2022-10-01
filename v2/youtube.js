// currently need to get from another program
const liveChatId = "KicKGFVDUHdiYm1qTlhOeE0tNHMxMjh3Y01wURILaXFBdy0wNTE4UXM"

function loadClient() {
	console.log("attempting to load gapi client")
	gapi.client.setApiKey(yt_api);
	return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
		.then(function() { console.log("GAPI client loaded for API"); },
			function(err) { console.error("Error loading GAPI client for API", err); });
}

gapi.load("client");
var gapiChecker = setInterval(function(){
	// Find it with a selector
	if(typeof gapi.client != "undefined"){
		console.log("gapi.client loaded");
		clearInterval(gapiChecker);
		loadClient()
	}
}, 500);

function execute() {
	if(typeof gapi.client != "undefined")
	{
		return gapi.client.youtube.liveChatMessages.list({
		"liveChatId": liveChatId,
		"part": [
			"snippet,authorDetails"
		]
		})
		.then(function(response) {
			console.log("Response", response);
		},
		function(err) { console.error("could not get gapi response", err); });
	}
	else
	{
		console.log("gapi client has not been loaded yet")
	}
}

// nick
// thathypedperson
// set as authorDetails["channelId"]

// info
// {
// 	"badge-info": "subscriber/8", (test with different accounts)
// 	badges: "broadcaster/1,subscriber/0,glhf-pledge/1", (only check for listed below)
// 	color: "#8A2BE2", (ignore?) (true?)
// 	"display-name": "ThatHypedPerson", (authorDetails["displayName"])
// 	emotes: true,
// 	"first-msg": "0",
// 	flags: true,
// 	id: "ef2b4afe-1038-4cd3-b7f5-51bb024bbcf5", (items["id"])
// 	mod: "0", (authorDetails["isChatModerator"])
// 	"returning-chatter": "0",
// 	"room-id": "133875470",
// 	subscriber: "1",
// 	"tmi-sent-ts": "1664614269893", (epoch time)
// 	turbo: "0",
// 	"user-id": "133875470", (authorDetails["channelId"]?)
// 	"user-type": true
// }
// 
// mod
// {
// 	"badge-info": true,
// 	badges: "moderator/1",
// 	color: true,
// 	"display-name": "ddepyh",
// 	emotes: true,
// 	"first-msg": "0",
// 	flags: true,
// 	id: "b23fdc56-f5d2-4bf8-94f7-0dd168483077",
// 	mod: "1",
// 	"returning-chatter": "0",
// 	"room-id": "133875470",
// 	subscriber: "0",
// 	"tmi-sent-ts": "1664615202719",
// 	turbo: "0",
// 	"user-id": "615959677",
// 	"user-type": "mod"
// }
// 
// regular
// {
// 	"badge-info": true,
// 	badges: true,
// 	color: true,
// 	"display-name": "ddepyh",
// 	emotes: true,
// 	"first-msg": "0",
// 	flags: true,
// 	id: "11fa175e-a0fd-4340-8ea3-6c395caff78a",
// 	mod: "0",
// 	"returning-chatter": "0",
// 	"room-id": "133875470",
// 	subscriber: "0",
// 	"tmi-sent-ts": "1664615520811",
// 	turbo: "0",
// 	"user-id": "615959677",
// 	"user-type": true
// }

// message
// chat message
// snippet["textMessageDetails"]["messageText"]

// "broadcaster:1 (streamer) (authorDetails["isChatOwner"])
// "moderator:1" (moderator) (authorDetails["isChatModerator"])
// "partner:1" (verified channels?) (authorDetails["isVerified"])
// "subscriber:0" (sponsors [i wish], last number is months) (authorDetails["isChatSponsor"])

// send(nick, info, message)