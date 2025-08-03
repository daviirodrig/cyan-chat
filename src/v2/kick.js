class KickWebSocketClient {
  constructor(
    appKey = "32cbd69e4b950bf97679",
    endpoint = "wss://ws-us2.pusher.com"
  ) {
    this.appKey = appKey;
    this.endpoint = endpoint;
    this.ws = null;
    this.isConnected = false;
    this.subscriptions = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 10000; // Max 10 seconds
    this.reconnectTimeout = null;
  }

  connect() {
    const url = `${this.endpoint}/app/${this.appKey}?protocol=7&client=js&version=8.4.0&flash=false`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this.handleOpen();
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onclose = () => this.handleClose();
    this.ws.onerror = (error) => this.handleError(error);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribeToChannel(channel) {
    if (!this.subscriptions.includes(channel)) {
      this.subscriptions.push(channel);
    }

    if (this.isConnected) {
      this.sendSubscription(channel);
    }
  }

  reconnect() {
    // if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    //   console.error("Max reconnection attempts reached");
    //   return;
    // }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  handleOpen() {
    console.log("WebSocket connection established");
    this.isConnected = true;
    this.reconnectAttempts = 0; // Reset on successful connection

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case "pusher:connection_established":
          this.handleConnectionEstablished(message.data);
          break;
        case "pusher_internal:subscription_succeeded":
          this.handleSubscriptionSucceeded(message);
          break;
        case "App\\Events\\ChatMessageEvent":
          this.handleChatMessage(message);
          break;
        case "App\\Events\\MessageDeletedEvent":
          this.handleMessageDeleted(message);
          break;
        case "App\\Events\\UserBannedEvent":
          this.handleUserBanned(message);
          break;
        case "pusher:ping":
          // Respond with pusher:pong
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event: "pusher:pong", data: "{}" }));
            console.log("Responded to pusher:ping with pusher:pong");
          }
          break;
        default:
          console.log(`Unhandled event: ${message.event}`);
          console.log(`Message data: ${JSON.stringify(message)}`);
      }

      console.log(`Message received: ${JSON.stringify(message)}`);
    } catch (error) {
      console.error(`Failed to parse message: ${error}`);
    }
  }

  handleMessageDeleted(message) {
    try {
      const data = JSON.parse(message.data);
      if (this.onMessageDeleted) {
        this.onMessageDeleted(data);
      }
    } catch (e) {
      console.error("Failed to handle MessageDeletedEvent", e);
    }
  }

  handleUserBanned(message) {
    try {
      const data = JSON.parse(message.data);
      if (this.onUserBanned) {
        this.onUserBanned(data);
      }
    } catch (e) {
      console.error("Failed to handle UserBannedEvent", e);
    }
  }

  handleConnectionEstablished(data) {
    if (data) {
      const connectionData = JSON.parse(data);
      console.log(
        `Connection established with socket ID: ${connectionData.socket_id}`
      );
    }

    // Subscribe to all pending channels
    this.subscriptions.forEach((channel) => {
      this.sendSubscription(channel);
    });
  }

  handleSubscriptionSucceeded(message) {
    const channel = message.channel;
    console.log(`Successfully subscribed to channel: ${channel}`);

    // Emit custom event for subscription success
    if (this.onSubscriptionSucceeded) {
      this.onSubscriptionSucceeded(channel);
    }
  }

  handleChatMessage(message) {
    if (!message.data) return;

    try {
      const chatData = JSON.parse(message.data);
      console.log(
        `Chat message from ${chatData.sender.username}: ${chatData.content}`
      );

      // Emit custom event for chat messages
      if (this.onChatMessage) {
        this.onChatMessage(chatData, message.channel);
      }
    } catch (error) {
      console.error(`Failed to parse chat message: ${error}`);
    }
  }

  sendSubscription(channel) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscription = {
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: channel,
      },
    };

    this.ws.send(JSON.stringify(subscription));
    console.log(`Subscribed to channel: ${channel}`);
  }

  handleClose() {
    console.log("WebSocket connection closed");
    this.isConnected = false;
    this.reconnect();
  }

  handleError(error) {
    console.error(`WebSocket error: ${error}`);
  }
}

function formatKickMessage(message) {
  // message:
  //   id: string;
  // chatroom_id: number;
  // content: string;
  // type: string;
  // created_at: string;
  // sender: {
  //   id: number;
  //   username: string;
  //   slug: string;
  //   identity: {
  //     color: string;
  //     badges: unknown[];
  //   };
  // };
  // metadata: {
  //   message_ref: string;
  // };
  // Extract badges from sender.identity.badges
  let badges = "";
  let badge_info = {};
  let badgeImages = [];
  if (
    message.sender &&
    message.sender.identity &&
    Array.isArray(message.sender.identity.badges)
  ) {
    badges = message.sender.identity.badges
      .map((b) => b.type + (b.text ? "/" + b.text : ""))
      .join(",");
    badge_info = message.sender.identity.badges.reduce((acc, b) => {
      acc[b.type] = b.text || true;
      return acc;
    }, {});

    // Handle Kick moderator badge
    const modBadge = message.sender.identity.badges.find((b) => b.type === "moderator");
    if (modBadge) {
      badgeImages.push({
        description: modBadge.text || "moderator",
        url: "https://cdn.justdavi.dev/twitch-moderator.webp",
        priority: true,
      });
    }

    // Handle Kick subscriber badge
    const subBadge = message.sender.identity.badges.find((b) => b.type === "subscriber" && b.count);
    if (subBadge && window.Chat && Chat.info && Array.isArray(Chat.info.kickSubscriberBadges)) {
      // Find the badge with the highest months <= count
      let badge = null;
      for (let i = Chat.info.kickSubscriberBadges.length - 1; i >= 0; i--) {
        if (subBadge.count >= Chat.info.kickSubscriberBadges[i].months) {
          badge = Chat.info.kickSubscriberBadges[i];
          break;
        }
      }
      if (badge && badge.badge_image && badge.badge_image.src) {
        badgeImages.push({
          description: subBadge.text || "Subscriber",
          url: badge.badge_image.src,
        });
      }
    }
  }

  // Fix: Add space between consecutive [emote:...:...] tags if they are together
  if (typeof message.content === "string") {
    message.content = message.content.replace(/](?=\[emote:)/g, "] ");
  }

  let info = {
    "badge-info": badge_info,
    badges: badgeImages, // Will be used by Chat.write to render badges
    color:
      message.sender && message.sender.identity && message.sender.identity.color
        ? message.sender.identity.color
        : null,
    "display-name":
      message.sender && message.sender.username ? message.sender.username : "",
    emotes: true,
    "first-msg": "0",
    flags: true,
    id: message.id ? message.id.replace(/\./g, "") : "",
    mod: 0, // No mod info in sample
    "returning-chatter": "0",
    "room-id": message.chatroom_id ? String(message.chatroom_id) : "",
    subscriber: "0",
    "tmi-sent-ts": message.created_at || "",
    turbo: "0",
    "user-id":
      message.sender && message.sender.id ? String(message.sender.id) : "",
    "user-type": true,
    runs: message.runs,
  };

  console.log(`Formatted Kick message badges: ${JSON.stringify(info.badges)}`);

  return info;
}
if (Chat.info.kickuser) {
  // Usage example
  const client = new KickWebSocketClient();

  client.onChatMessage = (data, channel) => {
    const msg = formatKickMessage(data);
    Chat.write(msg["display-name"], msg, data.content, "kick");
  };

  client.onMessageDeleted = (data) => {
    if (data && data.message && data.message.id) {
      Chat.clearMessage(data.message.id.replace(/\./g, ""));
    }
  };

  client.onUserBanned = (data) => {
    if (data && data.user && data.user.username) {
      Chat.clearUser(data.user.username);
    }
  };

  client.connect();

  // Wait for Chat.info.kick to be set by the API call, then subscribe to channels
  const waitForKickId = setInterval(() => {
    if (Chat.info.kick) {
      clearInterval(waitForKickId);

      // Subscribe to channels using the dynamically obtained channel ID
      client.subscribeToChannel(`chatroom_${Chat.info.kick}`);
      client.subscribeToChannel(`chatrooms.${Chat.info.kick}.v2`);
      client.subscribeToChannel(`chatrooms.${Chat.info.kick}`);

      console.log(`Subscribed to Kick channels for channel ID: ${Chat.info.kick}`);
    }
  }, 100); // Check every 100ms
}
