const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();

const bi = require("./bitint.js");

const fs = require("fs");

var mines = require("./mines.json");

var kaid = '';
var selfBot = false; //Not used because tokens removed from safeapp version
var msgembedded;

var returnProfileRequest = function(username) {
	return "http://www.khanacademy.org/api/internal/user/profile?username=" + username;
};

var returnDiscussionRequest = function(username) {
	return "https://www.khanacademy.org/api/internal/user/discussion/statistics?casing=camel&username=" + username + "&lang=en&_=1483022720085";
};

var requestKAData = function(username, callback, message, requestType) {
	request(requestType(username), function(error, response, body) {
		if (!JSON.parse(body)) {
			message.channel.sendMessage("Profile does not exist");
			return;
		}
		console.log(JSON.parse(body).kaid || username || "");
		callback(body);
	});
};


client.on('ready', () => {
	console.log('I am ready!');
});

var createEmbed = function(data, discussion) {
	if (!discussion) {
		msgembedded = {
			embed: {
				color: 3447003,
				author: {
					name: data.preferred,
					icon_url: data.avatarURL
				},
				title: data.username,
				url: ('https://www.khanacademy.org/profile/' + data.kaid + '/projects'),
				description: data.userLookup,
				fields: [{
					name: 'Current Bio:',
					value: data.bio
				}, ],
				timestamp: new Date(),
				footer: {
					icon_url: data.avatarURL,
					text: data.kaid
				}
			}
		};
	} else {
		msgembedded = {
			embed: {
				color: 0x00AE86,
				author: {
					name: data.preferred,
				},
				title: data.userLookup,
				url: ('https://www.khanacademy.org/profile/' + data.userLookup + '/discussion'),
				description: "Profile Discussion Data for " + data.userLookup,
				fields: [{
					name: 'Votes:',
					value: data.votes
				}, {
					name: 'Evaluation requests:',
					value: data.projectquestions
				}, {
					name: 'Answers Given',
					value: data.answers
				}, {
					name: 'Projects Evaluated:',
					value: data.projectanswers
				}, {
					name: 'Flags sent:',
					value: data.flags
				}, {
					name: 'Number of comments:',
					value: data.comments
				}, {
					name: 'Number of replies:',
					value: data.replies
				}],
				timestamp: new Date(),
				footer: {
					//icon_url: data.avatarURL,
					text: "Discussion info"
				}
			}
		};
	}
	if (data.vendor) {
		({
			name: "Vendorship Info:",
			value: "**" + data.vendor.preferred + "**\n" + data.vendor.desc
		});
	}
};

var defaultCallback = function(err) {
	console.log(err);
};

var msg2 = function(arg) {
	arg.avatar
	return "**Added new user!**\n***" + arg.Preferred + "***\n```markdown\n" + arg.Preferred + "\n==============\n[Username]: " + arg.User + "\n[Kaid]: " + arg.kaid + "\n```";
};

const help = "Help Screen**\n```markdown\n List of Commands\n==============\n[ $ping	   ]: returns pong\n[ $pong	   ]: returns ping\n[ $avatar	 ]: returns your discord profile picture\n[ $help	   ]: Shows this help screen.\n[ $info	   ]: Show a KA user's profile\n[ $discussion ]: Show KA user's discussion stats\n";

client.on('message', message => {

	var lcoin = '<:lcoin:245927166771068929>';
	//Local server Coin emoji, deprecated in safeapp.js

	//Only intended to run in whitelisted servers and not in PM.
	if (message.content.startsWith("$") && (selfBot ? message.author.id === "218539292803203072" : message.guild && (message.guild.id === "249987163402272768" || message.guild.id === "219096380457746433" || message.guild.id === "246149868807127041"))) {
		if (message.content === '$ping') {
			message.reply('pong');
		}
		if (message.content === '$pong') {
			message.reply(('ping in <#' + message.channel.id + '>'));
		}
		if (message.content === '$avatar') {
			var args = message.content.substring(('$avatar '.length));
			// send the user's avatar URL
			message.reply(message.author.avatarURL);
		}
		if (message.content.startsWith('$createdAt')) {
			var args = message.content.substring(('$whereAt '.length));
			message.channel.sendMessage(message.author.createdAt);
		}
		if (message.content.startsWith('$summary')) {
			//var args = message.content.substring(('$whereAt '.length));
			message.author.sendMessage("This is a DM", msgembedded);
		}

		if (message.content.startsWith('$help')) {

			var args = message.content.substring(('$help '.length));
			var helpcode = args.trim();
			if (helpcode === "") {
				message.channel.sendMessage(help);
			}
			if (helpcode === "ping") {
				message.channel.sendMessage("**lolwut about $ping Lolwut?**\nusage:```\n$ping```");
			}
			if (helpcode === "avatar") {
				message.channel.sendMessage("**Get the url of your profile picture **\nusage:```\n$avatar```");
			}
			if (helpcode === "pong") {
				message.channel.sendMessage("**Lolwut about $pong **\nusage:```\n$pong```");
			}
			if (helpcode === "info") {
				message.channel.sendMessage("**Info about $info:**\nusage:```\n$info [Valid KA username]```");
			}
			if (helpcode === "discussion") {
				message.channel.sendMessage("**Info about $discussion **\nusage:```\n$discussion [Valid KA username]```");
			}
		}
		if (message.content.startsWith('$info ')) {
			var args = message.content.substring(('$info '.length)).split(";");
			var a = 1000;
			kaid = '';
			requestKAData(args[1] || args[0], function(body) {
				var parsed = JSON.parse(body);
				var obj = {
					preferred: args[0] || "",
					userLookup: args[1] || args[0],
					username: parsed.nickname || "*No Nickname*",
					kaid: parsed.kaid,
					avatarURL: parsed.thumbnailSrc || null,
					bio: parsed.bio || "*No Bio*",
					vendor: args[3] ? {
						preferred: args[2],
						desc: args[3]
					} : false
				};
				if (!obj.kaid) {
					return;
				}
				createEmbed(obj);
				var newembed = message.channel.sendMessage("", msgembedded);

			}, message, returnProfileRequest);

		}
		if (message.content.startsWith('$discussion ')) {
			var args = message.content.substring(('$discussion '.length)).split(";");
			var a = 1000;
			kaid = '';
			requestKAData(args[1] || args[0], function(body) {
				var parsed = JSON.parse(body);
				var obj = {
					preferred: args[0] || "",
					userLookup: args[1] || args[0],
					votes: parsed.votes || "[0]",
					projectquestions: parsed.projectquestions || "[0]",
					answers: parsed.answers || "[0]",
					projectanswers: parsed.projectanswers || "[0]",
					flags: parsed.flags || "[0]",
					comments: parsed.comments || "[0]",
					questions: parsed.questions || "[0]",
					replies: parsed.replies || "[0]"
				};

				createEmbed(obj, true);
				var newembed = message.channel.sendMessage("", msgembedded);

			}, message, returnDiscussionRequest);
		}
		
		if (message.content.startsWith("$mine")) {
			if (mines[message.author.id] && mines[message.author.id].mining) {
				message.reply("sorry! You can't be in two mines at once!");
				
				return;
			}
			
			var a = bi.rand(64);
			var b = bi.rand(64);
			var c = bi.lpm([1, 0], a, b);
			
			mines[message.author.id].mining = true;
			mines[message.author.id].b = b;
			mines[message.author.id].c = c;
			mines[message.author.id].wrong = 0;
			
			fs.writeFile("./mines.json", JSON.stringify(mines));
			
			message.reply("check your PMs!");
			message.author.sendMessage("```2^a mod b = c\n\nIn binary:\n\nb = " + b.join("") + "\nc = " + c.join("") + "```\nCalculate `a` to get 5 IK.\n\nGood luck!");
		}
		
		if (message.content.startsWith("$mined ")) {
			if (mines[message.author.id] && !mines[message.author.id].mining) {
				message.reply("sorry! You aren't in a mine!");
				
				return;
			}
			
			var a = message.content.substring(7).split("");
			var b = mines[message.author.id].b;
			var c1 = mines[message.author.id].c;
			var c2 = bi.lpm([1, 0], a, b);
			
			if (bi.eq(c1, c2)) {
				message.reply("you're a winner! +5 " + lcoin);
				
				mines[message.author.id].mining = false;
			} else {
				message.reply("sorry! That answer is wrong. Please try again!");
				
				mines[message.author.id].wrong ++;
			}
			
			fs.writeFile("./mines.json", JSON.stringify(mines));
		}
	}
});
/**/
function success(token) {
	// handle success
	console.log("Success: Bot is ready " + token);
}

function err(error) {
	// handle error
	console.log(error);
	console.log("Failed login: C'mon Bot, y u fail?");
}
/**/
