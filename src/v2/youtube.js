if (Chat.info.yt) {
	// Determine the WebSocket protocol (ws:// or wss://) based on the current page protocol
	const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

	// Construct the WebSocket URL using the current host and the relative path
	const wsUrl = `${wsProtocol}//yt-websocket.justdavi.dev/ws`;

	// Track YouTube authorId -> nick to support REMOVE_AUTHOR events
	const ytAuthorIdToNick = {};

	// Create the WebSocket connection
	var yt_socket = new ReconnectingWebSocket(wsUrl, null, { reconnectInterval: 5000 });

	// Keep-alive ping interval
	let pingInterval = null;

	function startPing() {
		if (pingInterval) return;
		pingInterval = setInterval(() => {
			try {
				if (yt_socket && yt_socket.readyState === WebSocket.OPEN) {
					yt_socket.send('ping');
				}
			} catch (e) {
				// ignore
			}
		}, 30000);
	}

	function stopPing() {
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}
	}

	function toRunsFromFragments(fragments) {
		const runs = [];
		if (!Array.isArray(fragments)) return runs;
		fragments.forEach((frag) => {
			if (frag && typeof frag.emoji === 'string') {
				runs.push({ emoji: { image: [{ url: frag.emoji }] } });
			} else if (frag && typeof frag.text === 'string') {
				runs.push({ text: frag.text });
			}
		});
		return runs;
	}

	function fragmentsToPlainText(fragments) {
		if (!Array.isArray(fragments)) return '';
		return fragments.map((frag) => (typeof frag.text === 'string' ? frag.text : '')).join(' ').trim();
	}

	function formatYouTubeInfo(msg) {
		// Build badges: use string youtubemod/1 for priority mod badge if moderator, plus array of image urls
		let stringBadges = '';
		if (msg.is_moderator) stringBadges = 'youtubemod/1';
		const arrayBadges = Array.isArray(msg.badges)
			? msg.badges.filter(Boolean).map((url) => ({ url }))
			: [];

		const info = {
			'badge-info': true,
			badges: stringBadges || arrayBadges, // string takes precedence for priority badge handling
			color: msg.color || true,
			'display-name': msg.author || '',
			emotes: true,
			'first-msg': '0',
			flags: true,
			id: (msg.id || '').toString().replace(/\./g, ''),
			mod: msg.is_moderator ? 1 : 0,
			'returning-chatter': '0',
			'room-id': 'youtube',
			subscriber: '0',
			'tmi-sent-ts': Date.now().toString(),
			turbo: '0',
			'user-id': (msg.authorId || '').toString(),
			'user-type': true,
			runs: toRunsFromFragments(msg.messageFragments),
		};
		return info;
	}

	function subscribeToHandle() {
		const handle = (Chat.info.yt || '').replace(/^@/, '');
		if (!handle) return;
		try {
			yt_socket.send(`subscribe ${handle}`);
		} catch (e) {
			console.error('YouTube: Failed to send subscribe command', e);
		}
	}

	yt_socket.onopen = function () {
		console.log('YouTube: Connected');
		subscribeToHandle();
		startPing();
	};

	yt_socket.onclose = function () {
		console.log('YouTube: Disconnected');
		stopPing();
	};

	yt_socket.onmessage = function (event) {
		const data = event.data;

		// Health check reply
		if (typeof data === 'string' && data === 'pong') {
			// console.log('YouTube: pong');
			return;
		}

		let payload = null;
		try {
			payload = typeof data === 'string' ? JSON.parse(data) : data;
		} catch (e) {
			// Not JSON, ignore
			return;
		}

		if (!payload || !payload.type) return;

		switch (payload.type) {
			case 'ADD': {
				const msg = payload.msg || {};
				// Remember nick by authorId for future removals
				if (msg.authorId && msg.author) {
					const sanitized = Chat.sanitizeUsername(msg.author);
					ytAuthorIdToNick[msg.authorId] = sanitized;
				}

				const info = formatYouTubeInfo(msg);
				const plain = fragmentsToPlainText(msg.messageFragments);
				Chat.write(info['display-name'], info, plain, 'youtube');
				break;
			}
			case 'REMOVE': {
				const msg = payload.msg || {};
				if (msg.id) {
					Chat.clearMessage(msg.id.toString().replace(/\./g, ''));
				}
				break;
			}
			case 'REMOVE_AUTHOR': {
				const msg = payload.msg || {};
				const authorId = msg.authorId;
				if (authorId && ytAuthorIdToNick[authorId]) {
					Chat.clearUser(ytAuthorIdToNick[authorId]);
				}
				break;
			}
			case 'ERROR': {
				console.error('YouTube WS ERROR:', payload.msg);
				break;
			}
			default: {
				// Unknown type, ignore
				break;
			}
		}
	};
}