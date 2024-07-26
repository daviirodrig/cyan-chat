class EmoteChanged {
    constructor(data) {
        this.op = data.op;
        this.d = data.d;
    }
}

function seven_ws(channel) {
    (async () => {
        var info = await getUserInfo(Chat.info.channelID);
        var id = info.id;
        var emoteSetID = info.emoteSetID;
        var currentEmoteSetID = emoteSetID
        if (id === null || emoteSetID === null) {
            return
        }

        const options = {
            debug: true,
            reconnectInterval: 3000,
            maxReconnectInterval: 30000,
        };

        const conn = new ReconnectingWebSocket('wss://events.7tv.io/v3', [], options);

        conn.onopen = function () {
            console.log(`[${channel}] Successfully connected to websocket!`);

            // Subscribe to emote set events for the channel
            conn.send(JSON.stringify({
                op: 35, // subscribe opcode
                d: {
                    type: "emote_set.*", // subscription type
                    condition: {
                        object_id: emoteSetID // Emote set ID
                    }
                }
            }));
            // // Subscribe to emote events for the channel
            // conn.send(JSON.stringify({
            //     op: 35, // subscribe opcode
            //     d: {
            //         type: "emote.*", // subscription type
            //         condition: {
            //             object_id: id // channel ID
            //         }
            //     }
            // }));
            // Subscribe to user events for the channel
            conn.send(JSON.stringify({
                op: 35, // subscribe opcode
                d: {
                    type: "user.*", // subscription type
                    condition: {
                        object_id: id // channel ID
                    }
                }
            }));
        };

        conn.onmessage = function (event) {
            try {
                const msg = JSON.parse(event.data);
                const emoteEvent = new EmoteChanged(msg);

                if (msg.op === 1) {
                    console.log(`[${channel}] Connection info received | HB Interval: ${emoteEvent.d.heartbeat_interval} | Session ID: ${emoteEvent.d.session_id} | Subscription Limit: ${emoteEvent.d.subscription_limit}`);
                } else if (msg.op === 2) {
                    // heartbeat
                } else if (msg.op === 6 || emoteEvent.op === 7) {
                    console.log(`[${channel}] Error occurred, reconnecting...`);
                    conn.refresh();
                } else if (msg.op === 4) {
                    console.log(`[${channel}] The server requested a reconnect, reconnecting...`);
                    conn.refresh();
                } else if (msg.op === 5) {
                    var type = msg.d.data.type
                    var command = msg.d.command
                    if (command === "SUBSCRIBE") {
                        console.log(`[${channel}] Successfully subscribed to ${type}`)
                    } else if (command === "UNSUBSCRIBE") {
                        console.log(`[${channel}] Successfully unsubscribed from ${type}`)
                    } else {
                        console.log(`[${channel}] Unknown confirmation command: ${command}`)
                    }
                } else if (msg.op === 0) {
                    if (msg.d.type === "emote_set.update") {
                        if (emoteEvent.d && emoteEvent.d.body) {
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
                    } else if (msg.d.type === "user.update") {
                        Chat.loadEmotes(Chat.info.channelID);
                        var oldEmoteSetName = msg.d.body.updated[0].value[0].old_value.name
                        var newEmoteSetName = msg.d.body.updated[0].value[0].value.name
                        var newEmoteSetID = msg.d.body.updated[0].value[0].value.id
                        var actor = msg.d.body.actor.display_name
                        SendInfoText(`${actor} changed the Emote Set to "${newEmoteSetName}"`)
                        // Unsubscribe from the current emote set events for the channel
                        conn.send(JSON.stringify({
                            op: 36, // unsubscribe opcode
                            d: {
                                type: "emote_set.*", // subscription type
                                condition: {
                                    object_id: currentEmoteSetID // Emote set ID
                                }
                            }
                        }));
                        // Subscribe to emote set events for the channel
                        conn.send(JSON.stringify({
                            op: 35, // subscribe opcode
                            d: {
                                type: "emote_set.*", // subscription type
                                condition: {
                                    object_id: newEmoteSetID // Emote set ID
                                }
                            }
                        }));
                        currentEmoteSetID = newEmoteSetID
                    } else {
                        console.log(`Unknown event: ${event.data}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing message: ${error}`);
            }
        };

        conn.onclose = function (event) {
            console.log(`[${channel}] WebSocket closed. Reason: ${event.reason}`);
        };

        conn.onerror = function (error) {
            console.error(`[${channel}] WebSocket error: ${error}`);
        };
    })();
}

// Usage example:
// const channelId = 'your_channel_id';
// const channelName = 'your_channel_name';
// ws(channelId, channelName);
