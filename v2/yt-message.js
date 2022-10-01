// copied frin script.js, might need some changes to get working
function send(nick, info, message) {
	console.log(nick)
	console.log(info)
	console.log(message)
	if (info) {
		var $chatLine = $('<div></div>');
		$chatLine.addClass('chat_line');
		$chatLine.attr('data-nick', nick);
		$chatLine.attr('data-time', Date.now());
		$chatLine.attr('data-id', info.id);
		var $userInfo = $('<span></span>');
		$userInfo.addClass('user_info');

		// Writing badges
		if (Chat.info.hideBadges) {
			if (typeof(info.badges) === 'string') {
				info.badges.split(',').forEach(badge => {
					var $badge = $('<img/>');
					$badge.addClass('badge');
					badge = badge.split('/');
					$badge.attr('src', Chat.info.badges[badge[0] + ':' + badge[1]]);
					$userInfo.append($badge);
				});
			}
		} else {
			var badges = [];
			const priorityBadges = ['predictions', 'admin', 'global_mod', 'staff', 'twitchbot', 'broadcaster', 'moderator', 'vip'];
			if (typeof(info.badges) === 'string') {
				info.badges.split(',').forEach(badge => {
					badge = badge.split('/');
					var priority = (priorityBadges.includes(badge[0]) ? true : false);
					badges.push({
						description: badge[0],
						url: Chat.info.badges[badge[0] + ':' + badge[1]],
						priority: priority
					});
				});
			}
			var $modBadge;
			badges.forEach(badge => {
				if (badge.priority) {
					var $badge = $('<img/>');
					$badge.addClass('badge');
					$badge.attr('src', badge.url);
					if (badge.description === 'moderator') $modBadge = $badge;
					$userInfo.append($badge);
				}
			});
			if (Chat.info.userBadges[nick]) {
				Chat.info.userBadges[nick].forEach(badge => {
					var $badge = $('<img/>');
					$badge.addClass('badge');
					if (badge.color) $badge.css('background-color', badge.color);
					if (badge.description === 'Bot' && info.mod === '1') {
						$badge.css('background-color', 'rgb(0, 173, 3)');
						$modBadge.remove();
					}
					$badge.attr('src', badge.url);
					$userInfo.append($badge);
				});
			}
			badges.forEach(badge => {
				if (!badge.priority) {
					var $badge = $('<img/>');
					$badge.addClass('badge');
					$badge.attr('src', badge.url);
					$userInfo.append($badge);
				}
			});
		}

		// Writing username
		var $username = $('<span></span>');
		$username.addClass('nick');
		if (typeof(info.color) === 'string') {
			if (tinycolor(info.color).getBrightness() <= 50) var color = tinycolor(info.color).lighten(30);
			else var color = info.color;
		} else {
			const twitchColors = ["#FF0000", "#0000FF", "#008000", "#B22222", "#FF7F50", "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"];
			var color = twitchColors[nick.charCodeAt(0) % 15];
		}
		$username.css('color', color);
		$username.html(info['display-name'] ? info['display-name'] : nick);
		$userInfo.append($username);

		// Writing message
		var $message = $('<span></span>');
		$message.addClass('message');
		if (/^\x01ACTION.*\x01$/.test(message)) {
			$message.css('color', color);
			message = message.replace(/^\x01ACTION/, '').replace(/\x01$/, '').trim();
			$userInfo.append('<span>&nbsp;</span>');
		} else {
			$userInfo.append('<span class="colon">:</span>');
		}
		$chatLine.append($userInfo);

		// Replacing emotes and cheers
		var replacements = {};
		if (typeof(info.emotes) === 'string') {
			info.emotes.split('/').forEach(emoteData => {
				var twitchEmote = emoteData.split(':');
				var indexes = twitchEmote[1].split(',')[0].split('-');
				var emojis = new RegExp('[\u1000-\uFFFF]+', 'g');
				var aux = message.replace(emojis, ' ');
				var emoteCode = aux.substr(indexes[0], indexes[1] - indexes[0] + 1);
				replacements[emoteCode] = '<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/' + twitchEmote[0] + '/default/dark/3.0" />';
			});
		}

		Object.entries(Chat.info.emotes).forEach(emote => {
			if (message.search(escapeRegExp(emote[0])) > -1) {
				if (emote[1].upscale) replacements[emote[0]] = '<img class="emote upscale" src="' + emote[1].image + '" />';
				else if (emote[1].zeroWidth) replacements[emote[0]] = '<img class="emote" data-zw="true" src="' + emote[1].image + '" />';
				else replacements[emote[0]] = '<img class="emote" src="' + emote[1].image + '" />';
			}
		});

		message = escapeHtml(message);

		if (info.bits && parseInt(info.bits) > 0) {
			var bits = parseInt(info.bits);
			var parsed = false;
			for (cheerType of Object.entries(Chat.info.cheers)) {
				var regex = new RegExp(cheerType[0] + "\\d+\\s*", 'ig');
				if (message.search(regex) > -1) {
					message = message.replace(regex, '');

					if (!parsed) {
						var closest = 1;
						for (cheerTier of Object.keys(cheerType[1]).map(Number).sort((a, b) => a - b)) {
							if (bits >= cheerTier) closest = cheerTier;
							else break;
						}
						message = '<img class="cheer_emote" src="' + cheerType[1][closest].image + '" /><span class="cheer_bits" style="color: ' + cheerType[1][closest].color + ';">' + bits + '</span> ' + message;
						parsed = true;
					}
				}
			}
		}

		var replacementKeys = Object.keys(replacements);
		replacementKeys.sort(function(a, b) {
			return b.length - a.length;
		});

		replacementKeys.forEach(replacementKey => {
			var regex = new RegExp("(?<!\\S)(" + escapeRegExp(replacementKey) + ")(?!\\S)", 'g');
			message = message.replace(regex, replacements[replacementKey]);
		});

		message = twemoji.parse(message);
		$message.html(message);

		// Writing zero-width emotes
		messageNodes = $message.children();
		messageNodes.each(function(i) {
			if (i != 0 && $(this).data('zw') && ($(messageNodes[i - 1]).hasClass('emote') || $(messageNodes[i - 1]).hasClass('emoji')) && !$(messageNodes[i - 1]).data('zw')) {
				var $container = $('<span></span>');
				$container.addClass('zero-width_container');
				$(this).addClass('zero-width');
				$(this).before($container);
				$container.append(messageNodes[i - 1], this);
			}
		});
		$message.html($message.html().trim());
		$chatLine.append($message);
		Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
	}
	console.log("sent?")
}