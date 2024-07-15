// update to real server later
var socket = new ReconnectingWebSocket('ws://baka.local:8765/', null, { reconnectInterval: 2000 });
// var socket = new ReconnectingWebSocket('ws://localhost:8765/', null, { reconnectInterval: 2000 });

socket.onopen = function() {
	console.log('YouTube: Connected');
};

socket.onclose = function() {
	console.log('YouTube: Disconnected');
};

socket.onmessage = function(data) {
	data = JSON.parse(data.data)
	console.log(data)
	if(data.info == "deleted")
	{
		Chat.clearMessage(String(data.message))
	}
	else
	{
		Chat.write(data.username, data.info, data.message, "youtube")
	}
}