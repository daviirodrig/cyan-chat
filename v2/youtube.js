// currently need to get from another program
const liveChatId = "KicKGFVDUHdiYm1qTlhOeE0tNHMxMjh3Y01wURILaXFBdy0wNTE4UXM"

// implement a proper callback(?) to check if gapi client is actually loaded
gapi.load("client");
var gapiChecker = setInterval(function(){
	// Find it with a selector
	if(typeof gapi.client != "undefined"){
		console.log("gapi.client loaded");
		clearInterval(gapiChecker);
		loadClient()
	}
}, 1000);

function loadClient() {
	console.log("attempting to load gapi client")
	gapi.client.setApiKey(yt_api);
	return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
		.then(function() { console.log("GAPI client loaded for API"); execute(); },
		// .then(function() { console.log("GAPI client loaded for API");}, // uncomment to disable requests
			function(err) { console.error("Error loading GAPI client for API", err); });
}

// store all message["id"]
yt_messages = []

// ignore messages sent before website opened (epoch in ms)
start_time = new Date().getTime()

// check for new messages + convert them for jchat processing
// to-do: handle responses in other pages (channel too small to consider this sadge)
function processMessages(items)
{
	if(items != undefined)
	{
		current_messages = []
		first_index = 0

		items.forEach((message, index) => {
			if(!yt_messages.includes(message["id"])) // ignore messages sent before website is run
			{
				message_time = Date.parse(message["snippet"]["publishedAt"])
				if(message_time >= start_time)
				{
					if(first_index == 0) {first_index = index}

					badges = ""
					badge_info = true // change when memberships are added
					if(message["authorDetails"]["isChatOwner"])
					{
						badges += "broadcaster/1"
					}
					if(message["authorDetails"]["isChatModerator"])
					{
						badges += "moderator/1"
					}
					if(message["authorDetails"]["isVerified"]) // can't test, hopefully shows verified channels
					{
						badges += "partner/1"
					}
					if(message["authorDetails"]["isChatSponsor"]) // can't test, will implement when i get memberships
					{
						badges += "subscriber/0"
					}
					if(badges == "")
					{
						badges = true
					}
					info = {
						"badge-info": badge_info,
						badges: badges, // (only check for listed below)
						color: true,
						"display-name": message["authorDetails"]["displayName"],
						emotes: true,
						"first-msg": "0",
						flags: true,
						id: String(hashFnv32a(message["id"])),
						mod: String(message["authorDetails"]["isChatModerator"] ? 1 : 0),
						"returning-chatter": "0",
						"room-id": "133875470", // change?
						subscriber: "0", // update for memberships
						"tmi-sent-ts": String(message_time), // (epoch time) (find conversion)
						turbo: "0",
						"user-id": message["authorDetails"]["channelId"],
						"user-type": true
					}

					Chat.write(message["authorDetails"]["channelId"], info, message["snippet"]["displayMessage"], "youtube")
				}
				yt_messages.push(message["id"])
			}
			current_messages.push(message["id"])
		});
		
		// remove deleted messages (i'm just gonna hope this works and doesn't break in production)
		offset = 0
		for(let i = 0; i < yt_messages.length; i++)
		{
			if(yt_messages[i + offset] != current_messages[i])
			{
				Chat.clearMessage(String(hashFnv32a(yt_messages[i + offset])))
				offset++
			}
		}
		yt_messages = current_messages
	}
	else
	{
		console.log("no items found")
	}
}

// https://blog.trannhat.xyz/generate-a-hash-from-string-in-javascript/
function hashFnv32a(str, asString, seed) { // fixes a bug when deleting a message
    /*jshint bitwise:false */
    var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if( asString ){
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}

const message_wait = 10000 // wait 5s between requests
async function execute() {
	if(typeof gapi.client != "undefined")
	{
		return gapi.client.youtube.liveChatMessages.list({
		"liveChatId": liveChatId,
		"part": [
			"snippet,authorDetails"
		]
		})
		.then(function(response) {
			// console.log(response.result.items)
			processMessages(response.result.items)
			setTimeout(execute, message_wait)
		},
		function(err) { console.error("yt request encountered an error, retrying...", err); setTimeout(execute, message_wait)});
	}
	else
	{
		console.log("gapi client has not been loaded yet, attempting request again...")
		setTimeout(execute, message_wait)
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