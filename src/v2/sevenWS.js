class EmoteChanged {
    constructor(data) {
        this.op = data.op;
        this.d = data.d;
    }
}

function seven_ws(channel) {
    (async () => {
        var id = await getUserInfo(Chat.info.channelID);
        if (id === null) {
            return
        }
        // console.log('id for 7tv ws', id)

        const options = {
            debug: true,
            reconnectInterval: 3000,
            maxReconnectInterval: 30000,
        };

        const conn = new ReconnectingWebSocket('wss://events.7tv.io/v3', [], options);

        conn.onopen = function() {
            console.log(`[${channel}] Successfully connected to websocket!`);

            // Subscribe to emote events for the channel
            conn.send(JSON.stringify({
                op: 35, // subscribe opcode
                d: {
                    type: "emote_set.*", // subscription type
                    condition: {
                        object_id: id // channel ID
                    }
                }
            }));
            // Subscribe to emote events for the channel
            conn.send(JSON.stringify({
                op: 35, // subscribe opcode
                d: {
                    type: "emote.*", // subscription type
                    condition: {
                        object_id: id // channel ID
                    }
                }
            }));
        };

        conn.onmessage = function(event) {
            try {
                const msg = JSON.parse(event.data);
                const emoteEvent = new EmoteChanged(msg);

                if (emoteEvent.op === 1) {
                    console.log(`[${channel}] Connection info received | HB Interval: ${emoteEvent.d.heartbeat_interval} | Session ID: ${emoteEvent.d.session_id} | Subscription Limit: ${emoteEvent.d.subscription_limit}`);
                } else if (emoteEvent.op === 2) {
                    // Do nothing for op 2
                } else if (emoteEvent.op === 6 || emoteEvent.op === 7) {
                    console.log(`[${channel}] Error occurred, reconnecting...`);
                    conn.refresh();
                } else if (emoteEvent.op === 4) {
                    console.log(`[${channel}] The server requested a reconnect, reconnecting...`);
                    conn.refresh();
                } else if (emoteEvent.op === 5) {
                    console.log(`[${channel}] Successfully connected to websocket!`);
                } else if (emoteEvent.d && emoteEvent.d.body) {
                    // Chat.loadEmotes(id);
                    if (emoteEvent.d.body.pushed && emoteEvent.d.body.pushed.length > 0) {
                        console.log(`[${channel}] Added: ${emoteEvent.d.body.pushed[0].value.name}`);
                        SendInfoText(`Added: ${emoteEvent.d.body.pushed[0].value.name}`);
                        const emoteData = emoteEvent.d.body.pushed[0].value.data.host.files.pop();
                        Chat.info.emotes[emoteEvent.d.body.pushed[0].value.name] = {
                            id: emoteEvent.d.body.pushed[0].value.id,
                            image: `https:${emoteEvent.d.body.pushed[0].value.data.host.url}/${emoteData.name}`,
                            zeroWidth: emoteEvent.d.body.pushed[0].value.data.flags == 256,
                        };
                    } else if (emoteEvent.d.body.pulled && emoteEvent.d.body.pulled.length > 0) {
                        console.log(`[${channel}] Removed: ${emoteEvent.d.body.pulled[0].old_value.name}`);
                        SendInfoText(`Removed: ${emoteEvent.d.body.pulled[0].old_value.name}`);
                        delete Chat.info.emotes[emoteEvent.d.body.pulled[0].old_value.name];
                    } else if (emoteEvent.d.body.updated && emoteEvent.d.body.updated.length > 0) {
                        console.log(`[${channel}] Renamed: ${emoteEvent.d.body.updated[0].old_value.name} to ${emoteEvent.d.body.updated[0].value.name}`);
                        SendInfoText(`Renamed: ${emoteEvent.d.body.updated[0].old_value.name} to ${emoteEvent.d.body.updated[0].value.name}`);
                        delete Chat.info.emotes[emoteEvent.d.body.updated[0].old_value.name];
                        const emoteData = emoteEvent.d.body.updated[0].value.data.host.files.pop();
                        Chat.info.emotes[emoteEvent.d.body.updated[0].value.name] = {
                            id: emoteEvent.d.body.updated[0].value.id,
                            image: `https:${emoteEvent.d.body.updated[0].value.data.host.url}/${emoteData.name}`,
                            zeroWidth: emoteEvent.d.body.updated[0].value.data.flags == 256,
                        };
                    } else {
                        console.log(`Unknown event: ${event.data}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing message: ${error}`);
            }
        };

        conn.onclose = function(event) {
            console.log(`[${channel}] WebSocket closed. Reason: ${event.reason}`);
        };

        conn.onerror = function(error) {
            console.error(`[${channel}] WebSocket error: ${error}`);
        };
    })();
}

// Usage example:
// const channelId = 'your_channel_id';
// const channelName = 'your_channel_name';
// ws(channelId, channelName);
