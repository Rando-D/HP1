const Discord = require("discord.js");
const client = new Discord.Client();
const moment = require('moment');
const ytdl = require('ytdl-core');
const request = require('request');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const fs = require('fs');
const dateFormat = require('dateformat');
const arraySort = require('array-sort'),
      table = require('table');

client.on('message' , async (message) => {
    if(message.content.startsWith(prefix + ".topinv")) {

  let invites = await message.guild.fetchInvites();

    invites = invites.array();

    arraySort(invites, 'uses', { reverse: true });

    let possibleInvites = [['User', 'Uses']];
    invites.forEach(i => {
      possibleInvites.push([i.inviter.username , i.uses]);
    })
    const embed = new Discord.RichEmbed()
    .setColor(0x7289da)
    .setTitle("دعوات السيرفر")
    .addField(' المتصدرين' , `\`\`\`${table.table(possibleInvites)}\`\`\``)

    message.channel.send(embed)
    }
});

const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
const prefix = '.';
const discord_token = process.env.BOT_TOKEN;
client.login(discord_token);
client.on('ready', function() {
	console.log(`i am ready ${client.user.username}`);
    client.user.setGame(prefix + 'مساعدة || Moha');
});
/*
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
*/
var servers = [];
var queue = [];
var guilds = [];
var queueNames = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];
var now_playing = [];
/*
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////
*/
client.on('ready', () => {});
var download = function(uri, filename, callback) {
	request.head(uri, function(err, res, body) {
		console.log('content-type:', res.headers['content-type']);
		console.log('content-length:', res.headers['content-length']);

		request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
	});
};

client.on('message', function(message) {
	const member = message.member;
	const mess = message.content.toLowerCase();
	const args = message.content.split(' ').slice(1).join(' ');

	if (mess.startsWith(prefix + 'شغل')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		// if user is not insert the URL or song title
		if (args.length == 0) {
			let play_info = new Discord.RichEmbed()
				.setAuthor(client.user.username, client.user.avatarURL)
				.setFooter('طلب بواسطة: ' + message.author.tag)
				.setDescription('**قم بإدراج رابط او اسم الأغنيه**')
			message.channel.sendEmbed(play_info)
			return;
		}
		if (queue.length > 0 || isPlaying) {
			getID(args, function(id) {
				add_to_queue(id);
				fetchVideoInfo(id, function(err, videoInfo) {
					if (err) throw new Error(err);
					let play_info = new Discord.RichEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
						  ${videoInfo.title}
						  **`)
						.setColor("RANDOM")
						.setFooter('|| ' + message.author.tag)
						.setThumbnail(videoInfo.thumbnailUrl)
					message.channel.sendEmbed(play_info);
					queueNames.push(videoInfo.title);
					now_playing.push(videoInfo.title);

				});
			});
		}
		else {

			isPlaying = true;
			getID(args, function(id) {
				queue.push('placeholder');
				playMusic(id, message);
				fetchVideoInfo(id, function(err, videoInfo) {
					if (err) throw new Error(err);
					let play_info = new Discord.RichEmbed()
						.setAuthor(client.user.username, client.user.avatarURL)
						.addField('||**__تم تشغيل __**', `**${videoInfo.title}
							  **`)
						.setColor("RANDOM")
                        .addField(`__من قبل__: ${message.author.username}`, `**__Moha__**`)
						.setThumbnail(videoInfo.thumbnailUrl)
							
					// .setDescription('?')
					message.channel.sendEmbed(play_info)
					message.channel.send(`__تم التشغيل__
							**${videoInfo.title}** __اسم الأغنية__
		      ${message.author.username}         __بواسطة__ `)
					// client.user.setGame(videoInfo.title,'https://www.twitch.tv/Moha');
				});
			});
		}
	}
	else if (mess.startsWith(prefix + 'تخطي')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		message.channel.send(':ok:').then(() => {
			skip_song(message);
			var server = server = servers[message.guild.id];
			if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
		});
	}
	else if (message.content.startsWith(prefix + 'صوت')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		// console.log(args)
		if (args > 999999999) return message.channel.send('1 - 999999999 || **__لا أكثر ولا أقل__**')
		if (args < 1) return message.channel.send('1 - 999999999 || **__لا أكثر ولا أقل__**')
		dispatcher.setVolume(1 * args / 50);
		message.channel.sendMessage(`**__ ${dispatcher.volume*50}% مستوى الصوت __**`);
	}
	else if (mess.startsWith(prefix + 'وقف')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		message.channel.send(':ok:').then(() => {
			dispatcher.pause();
		});
	}
	else if (mess.startsWith(prefix + 'كمل')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
			message.channel.send(':ok:').then(() => {
			dispatcher.resume();
		});
	}
	else if (mess.startsWith(prefix + 'اطلع')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		message.channel.send(':ok:');
		var server = server = servers[message.guild.id];
		if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
	}
	else if (mess.startsWith(prefix + 'تعال')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		message.member.voiceChannel.join().then(message.channel.send(':ok:'));
	}
	else if (mess.startsWith(prefix + 'شغل')) {
		if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
		if (isPlaying == false) return message.channel.send(':anger: || **__تم التوقيف__**');
		let playing_now_info = new Discord.RichEmbed()
			.setAuthor(client.user.username, client.user.avatarURL)
			.addField('تمت إضافةالاغنيه بقائمة الإنتظار', `**
				  ${videoInfo.title}
				  **`)
			.setColor("RANDOM")
			.setFooter('طلب بواسطة: ' + message.author.tag)
			.setThumbnail(videoInfo.thumbnailUrl)
		//.setDescription('?')
		message.channel.sendEmbed(playing_now_info);
	}
});

function skip_song(message) {
	if (!message.member.voiceChannel) return message.channel.send(':no_entry: || **__يجب ان تكون في روم صوتي__**');
	dispatcher.end();
}

function playMusic(id, message) {
	voiceChannel = message.member.voiceChannel;


	voiceChannel.join().then(function(connectoin) {
		let stream = ytdl('https://www.youtube.com/watch?v=' + id, {
			filter: 'audioonly'
		});
		skipReq = 0;
		skippers = [];

		dispatcher = connectoin.playStream(stream);
		dispatcher.on('end', function() {
			skipReq = 0;
			skippers = [];
			queue.shift();
			queueNames.shift();
			if (queue.length === 0) {
				queue = [];
				queueNames = [];
				isPlaying = false;
			}
			else {
				setTimeout(function() {
					playMusic(queue[0], message);
				}, 500);
			}
		});
	});
}

function getID(str, cb) {
	if (isYoutube(str)) {
		cb(getYoutubeID(str));
	}
	else {
		search_video(str, function(id) {
			cb(id);
		});
	}
}

function add_to_queue(strID) {
	if (isYoutube(strID)) {
		queue.push(getYoutubeID(strID));
	}
	else {
		queue.push(strID);
	}
}

function search_video(query, cb) {
	request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
		var json = JSON.parse(body);
		cb(json.items[0].id.videoId);
	});
}


function isYoutube(str) {
	return str.toLowerCase().indexOf('youtube.com') > -1;
}
 client.on('message', message => {
     if (message.content === prefix +"مساعدة") {
    const embed = new Discord.RichEmbed()
     .setColor("RANDOM")
     .addField(`**__أوامر البوت__**`,`
.    **${prefix}تعال**
	 عشان يدخل البوت الروم
	 **${prefix}شغل**
	 امر تشغيل الأغنية , !شغل الرابط او اسم الأعنية
	 **${prefix}تخطي**
	 تغير الأغنية
	 **${prefix}وقف**
	 ايقاف الأغنية
	 **${prefix}كمل**
     مواصلة الأغنية
	 **${prefix}صوت**
	 مستوى الصوت 1-999999999
	 **${prefix}اطلع**
	 خروج البوت من الروم
	 
	 
	 prefix = ${prefix}
	 ping = ${Date.now() - message.createdTimestamp}ms
	 for help = <@!2344543680726302839> 
	 By Moha	 `)

      message.channel.send({embed});
	 }
	});

client.on('message', message => {
var prefix = "#";

  if (!message.content.startsWith(prefix)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id == 410835593451405312)
return;
if (message.content.startsWith(prefix + 'dnd')) {
  if (message.author.id !== '234454368072630283') return message.react('⚠')
client.user.setStatus('dnd');  
message.react("✅")
}
                        
 });


client.on('message', message => {
var prefix = "#";

  if (!message.content.startsWith(prefix)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id == 410835593451405312)
return;


if (message.content.startsWith(prefix + 'online')) {
  if (message.author.id !== '234454368072630283') return message.react('⚠')
  client.user.setStatus('online');  
message.react("✅")
}
                        
 });


client.on('message', message => {
var prefix = "#";

  if (!message.content.startsWith(prefix)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id == 428733432731009024)
return;
if (message.content.startsWith(prefix + 'idle')) {
   if (message.author.id !== '234454368072630283') return message.react('⚠')
client.user.setStatus('idle');  
message.react("✅")
}
                        
 });


client.on('message', message => {
var prefix = "#";

  if (!message.content.startsWith(prefix)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id == 428733432731009024)
return;


if (message.content.startsWith(prefix + 'offline')) {
    if (message.author.id !== '234454368072630283') return message.react('⚠')
client.user.setStatus('invisible');  
message.react("✔")
}
                        
 });
 


  
  client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('Pong!');
    }
  });

client.on('message', msg => {
    if (msg.content === '.inviter') {
            msg.guild.fetchInvites()
     .then(invites => msg.reply(`انت جبت   ${invites.find(invite => invite.inviter.id === msg.author.id).uses} عضو لهاذا السيرفر`)) 
    }
  });

  client.on('ready',  () => {
    console.log('تم تشغيل :dragon  ');
    console.log(`Logged in as * [ " ${client.user.username} " ] servers! [ " ${client.guilds.size} " ]`);
    console.log(`Logged in as * [ " ${client.user.username} " ] Users! [ " ${client.users.size} " ]`);
    console.log(`Logged in as * [ " ${client.user.username} " ] channels! [ " ${client.channels.size} " ]`);
  });


 
 client.on("message", message => {
    var prefix = ".";
    const command = message.content.split(" ")[0];

    if(command == prefix+"vc"){

        if (!message.guild.member(message.author).hasPermission('MOVE_MEMBERS') || !message.guild.member(message.author).hasPermission('ADMINISTRATOR')) {
            return message.reply('you do not have permission to perform this action!');
        }

        var member = message.guild.members.get(message.mentions.users.array()[0].id);
        if(!message.mentions.users){
            message.reply("please mention the member")
            return;
        }

    if(!member.voiceChannel){
    message.reply("i can't include voice channel for member!")
    return;
    }
              message.guild.createChannel('voicekick', 'voice').then(c => {
                member.setVoiceChannel(c).then(() => {
                    c.delete(305).catch(console.log)
        


    
      });
     });
    }
});
var dat = JSON.parse("{}");
function forEachObject(obj, func) {
    Object.keys(obj).forEach(function (key) { func(key, obj[key]) })
}
client.on("ready", () => {
    var guild;
    while (!guild)
        guild = client.guilds.find("name", "HP ( Horrifying Players )")
    guild.fetchInvites().then((data) => {
        data.forEach((Invite, key, map) => {
            var Inv = Invite.code;
            dat[Inv] = Invite.uses;
        })
    })
})
client.on("guildMemberAdd", (member) => {
    let channel = member.guild.channels.find('name', 'chat');
    if (!channel) {
        console.log("!channel fails");
        return;
    }
    if (member.id == client.user.id) {
        return;
    }
    console.log('made it till here!');
    var guild;
    while (!guild)
        guild = client.guilds.find("name", "HP ( Horrifying Players )")
    guild.fetchInvites().then((data) => {
        data.forEach((Invite, key, map) => {
            var Inv = Invite.code;
            if (dat[Inv])
                if (dat[Inv] < Invite.uses) {
                    console.log(3);
                    console.log(`${member} joined over ${Invite.inviter}'s invite ${Invite.code}`)
 channel.send(` :hearts: **تم دعوته من قبل ${Invite.inviter} :hearts: 
:hearts: رابط الدعوه --> https://discord.gg/${Invite.code} :hearts:
:hearts: عضو رقم --> ${member.guild.memberCount} :hearts: **`)            
 }
            dat[Inv] = Invite.uses;
        })
    })
});
let points = JSON.parse(fs.readFileSync('./fkk/3wasmPTS.json', 'utf8'));
     
var prefix = ".";

client.on('message', message => {
if (!points[message.author.id]) points[message.author.id] = {
	points: 0,
  };
if (message.content.startsWith(prefix + 'عواصم')) {
	if(!message.channel.guild) return

const type = require('./fkk/3wasm.json');
const item = type[Math.floor(Math.random() * type.length)];
const filter = response => {
    return item.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase());
};
message.channel.send('**لديك 10 ثانية لتجيب**').then(msg => {

			
msg.channel.send(`${item.type}`).then(() => {
        message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ['time'] })
        .then((collected) => {
		message.channel.send(`${collected.first().author} ✅ **مبروك لقد كسبت نقطه
لمعرفة نقطاك الرجاء كتابة .نقاطي**`);
		console.log(`[Typing] ${collected.first().author} typed the word.`);
			let userData = points[message.author.id];
			userData.points++;
          })
          .catch(collected => {
            message.channel.send(`:x: **خطأ حاول مرة اخرى**`);
			console.log('[Typing] Error: No one type the word.');
          })
		})
	})
}
});

client.on('message', message => {
if (!points[message.author.id]) points[message.author.id] = {
	points: 0,
  };
if (message.content.startsWith(prefix + 'فكك')) {
	if(!message.channel.guild) return

const type = require('./fkk/fkkk.json');
const item = type[Math.floor(Math.random() * type.length)];
const filter = response => {
    return item.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase());
};
message.channel.send('**لديك 15 ثانية لتجيب**').then(msg => {

			
msg.channel.send(`${item.type}`).then(() => {
        message.channel.awaitMessages(filter, { maxMatches: 1, time: 15000, errors: ['time'] })
        .then((collected) => {
		message.channel.send(`${collected.first().author} ✅ **مبروك لقد كسبت نقطه
لمعرفة نقطاك الرجاء كتابة .نقاطي**`);
		console.log(`[Typing] ${collected.first().author} typed the word.`);
			let userData = points[message.author.id];
			userData.points++;
          })
          .catch(collected => {
            message.channel.send(`:x: **خطأ حاول مرة اخرى**`);
			console.log('[Typing] Error: No one type the word.');
          })
		})
	})
}
});



client.on('message', message => {
if (message.content.startsWith(prefix + 'نقاطي')) {
	if(!message.channel.guild) return
	let userData = points[message.author.id];
	let embed = new Discord.RichEmbed()
    .setAuthor(`${message.author.tag}`, message.author.avatarURL)
	.setColor('#000000')
	.setDescription(`نقاطك: \`${userData.points}\``)
	message.channel.sendEmbed(embed)
  }
  fs.writeFile("./l3b/3wasmPTS.json", JSON.stringify(points), (err) => {  
    if (err) console.error(err)
  })
});

client.on('message', message => {
    var prefix = ".";
    
      if (!message.content.startsWith(prefix)) return;
      var args = message.content.split(' ').slice(1);
      var argresult = args.join(' ');
      if (message.author.id == 410835593451405312) return;
    
    
    if (message.content.startsWith(prefix + 'playing')) {
    if (message.author.id !== '234454368072630283') return message.reply('** هذا الأمر فقط لصاحب البوت و شكراًً **')
    client.user.setGame(argresult);
        message.channel.sendMessage(`**${argresult}** : تم تغيير الحالة`)
    } else
    
     
    if (message.content.startsWith(prefix + 'streem')) {
    if (message.author.id !== '234454368072630283') return message.reply('** هذا الأمر فقط لصاحب البوت و شكراًً **')
    client.user.setGame(argresult, "http://twitch.tv/HP");
        message.channel.sendMessage(`**${argresult}** :تم تغيير الحالة الى ستريمنج`)
    } else
    
    if (message.content.startsWith(prefix + 'setname')) {
    if (message.author.id !== '234454368072630283') return message.reply('** هذا الأمر فقط لصاحب البوت و شكراًً **')
      client.user.setUsername(argresult).then
          message.channel.sendMessage(`**${argresult}** : تم تغير الأسم`)
      return message.reply("**لا تستطيع تغير الأسم الا بعد ساعتين**");
    } else
        
    if (message.content.startsWith(prefix + 'setavatar')) {
    if (message.author.id !== '234454368072630283') return message.reply('** هذا الأمر فقط لصاحب البوت و شكراًً **')
    client.user.setAvatar(argresult);
        message.channel.sendMessage(`**${argresult}** : تم تغير صورة البوت`);
    } else
    
    
    if (message.content.startsWith(prefix + 'watching')) {
    if (message.author.id !== '234454368072630283') return message.reply('** هذا الأمر فقط لصاحب البوت و شكراًً **')
        client.user.setActivity(argresult, {type : 'watching'});
     message.channel.sendMessage(`**${argresult}** : تم تغيير الووتشينق الى`)
    }
    
     });

  client.on('message', message => {
        var prefix = ".";
    if (message.content === "server") {
        if (!message.member.hasPermission("ADMINISTRATOR"))  return message.reply("**هذة الأمر للأدارة فقط**");
    if(!message.channel.guild) return;
    const millis = new Date().getTime() - message.guild.createdAt.getTime();
    const now = new Date();
    
    const verificationLevels = ['None', 'Low', 'Medium', 'Insane', 'Extreme'];
    const days = millis / 1000 / 60 / 60 / 24;
    let roles = client.guilds.get(message.guild.id).roles.map(r => r.name);
    var embed  = new Discord.RichEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL)
    .addField("**🆔 ايدي السيرفر**", "**"+message.guild.id+"**",true)
    .addField("**👑 صاحب السيرفر**", "**"+message.guild.owner+"**" ,true)
    .addField("**🌍 موقع السيرفر **" , "**"+message.guild.region+"**",true)
    .addField('**💬 عدد الرومات الكتابية **',`**[ ${message.guild.channels.filter(m => m.type === 'text').size} ] Channel **`,true)
    .addField('**👪 عدد المجموعات **',`**[ ${message.guild.channels.filter(m => m.type === 'category').size} ] Category **`,true)
    .addField("**📣 عدد الرومات الصوتية **", ` ** [ ${message.guild.channels.filter(m => m.type === 'voice').size} ] Channel ** `,true)
    .addField("**🤔عدد ايام انشاء السيرفر**", ` ** [ ${days.toFixed(0)} ] ** Day ` ,true)
    .addField("**👔 عدد الرتب **",`**[${message.guild.roles.size}]** Role `,true)
    .addField("**💠 مســتوى حمــاية الســيرفر**", ` ** [ ${verificationLevels[message.guild.verificationLevel]} ] ** `,true)
    
    .addField("👥Members",`
    **${message.guild.memberCount}**`)
    .setThumbnail(message.guild.iconURL)
    .setColor('RANDOM')
    message.channel.sendEmbed(embed)
    
    }
    });
    client.on("message", message => {
        if (message.author.bot) return;
       
        let command = message.content.split(" ")[0];
       
        if (command === "اسكت") {
              if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply("** لا يوجد لديك برمشن 'Manage Roles' **").catch(console.error);
        let user = message.mentions.users.first();
        let modlog = client.channels.find('name', 'mute-log');
        let muteRole = client.guilds.get(message.guild.id).roles.find('name', 'Muted');
        if (!muteRole) return message.reply("** لا يوجد رتبة الميوت 'Muted' **").catch(console.error);
        if (message.mentions.users.size < 1) return message.reply('** يجب عليك المنشن اولاً **').catch(console.error);
       
        const embed = new Discord.RichEmbed()
          .setColor(0x00AE86)
          .setTimestamp()
          .addField('الأستعمال:', 'اسكت/احكي')
          .addField('تم ميوت:', `${user.username}#${user.discriminator} (${user.id})`)
          .addField('بواسطة:', `${message.author.username}#${message.author.discriminator}`)
         
         if (!message.guild.member(client.user).hasPermission('MANAGE_ROLES_OR_PERMISSIONS')) return message.reply('** لا يوجد لدي برمشن Manage Roles **').catch(console.error);
       
        if (message.guild.member(user).roles.has(muteRole.id)) {
           return message.reply("** تم اعطاء العضو المحدد ميوت  **").catch(console.error);
        } else {
          message.guild.member(user).addRole(muteRole).then(() => {
            return message.reply("** تم اعطاء العضو المحدد ميوت كتابي .. **").catch(console.error);
          });
        }
       
      };
       
      });



      client.on("message", message => {
        if (message.author.bot) return;
       
        let command = message.content.split(" ")[0];
       
        if (command === "تكلم") {
              if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply("** لا يوجد لديك برمشن 'Manage Roles' **").catch(console.error);
        let user = message.mentions.users.first();
        let modlog = client.channels.find('name', 'mute-log');
        let muteRole = client.guilds.get(message.guild.id).roles.find('name', 'Muted');
        if (!muteRole) return message.reply("** لا يوجد رتبة الميوت 'Muted' **").catch(console.error);
        if (message.mentions.users.size < 1) return message.reply('** يجب عليك المنشن اولاً **').catch(console.error);
        const embed = new Discord.RichEmbed()
          .setColor(0x00AE86)
          .setTimestamp()
          .addField('الأستعمال:', 'اسكت/احكي')
          .addField('تم فك الميوت عن:', `${user.username}#${user.discriminator} (${user.id})`)
          .addField('بواسطة:', `${message.author.username}#${message.author.discriminator}`)
       
        if (!message.guild.member(client.user).hasPermission('MANAGE_ROLES_OR_PERMISSIONS')) return message.reply('** لا يوجد لدي برمشن Manage Roles **').catch(console.error);
       
        if (message.guild.member(user).removeRole(muteRole.id)) {
            return message.reply("** تم فك الميوت عن الشخص المحدد  .. **").catch(console.error);
        } else {
          message.guild.member(user).removeRole(muteRole).then(() => {
            return message.reply("** تم فك الميوت عن الشخص المحدد .. **").catch(console.error);
          });
        }
       
      };
       
      });
    client.on('message', message => {
        var prefix = ".";
        var args = message.content.split(" ").slice(1);    
        if(message.content.startsWith(prefix + 'id')) {
            if (!message.member.hasPermission("ADMINISTRATOR"))  return message.reply("**هذة الأمر للأدارة فقط**");
        var year = message.author.createdAt.getFullYear()
        var month = message.author.createdAt.getMonth()
        var day = message.author.createdAt.getDate()
        var men = message.mentions.users.first();  
        let args = message.content.split(' ').slice(1).join(' ');
        if (args == '') {
        var z = message.author;
        }else {
        var z = message.mentions.users.first();
        }
        
        let d = z.createdAt;          
        let n = d.toLocaleString();   
        let x;                       
        let y;                        
        
        if (z.presence.game !== null) {
        y = `${z.presence.game.name}`;
        } else {
        y = "No Playing... |💤.";
        }
        if (z.bot) {
        var w = 'بوت';
        }else {
        var w = 'عضو';
        }
        let embed = new Discord.RichEmbed()
        .setColor("#502faf")
        .addField('🔱| اسمك:',`**<@` + `${z.id}` + `>**`, true)
        .addField('🛡| ايدي:', "**"+ `${z.id}` +"**",true)
        .addField('♨| Playing:','**'+y+'**' , true)
        .addField('🤖| نوع حسابك:',"**"+ w + "**",true)    
        .addField('📛| الكود حق حسابك:',"**#" +  `${z.discriminator}**`,true)
        .addField('**التاريح الذي انشئ فيه حسابك | 📆 **: ' ,year + "-"+ month +"-"+ day)   
        .addField("**تاريخ دخولك للسيرفر| ⌚   :**", message.member.joinedAt.toLocaleString())   
        .addField('**⌚ | تاريخ انشاء حسابك الكامل:**', message.author.createdAt.toLocaleString())
        .addField("**اخر رسالة لك | 💬  :**", message.author.lastMessage)            
        
        .setThumbnail(`${z.avatarURL}`)
        .setFooter(message.author.username, message.author.avatarURL)
        
        message.channel.send({embed});
            if (!message) return message.reply('**ضع المينشان بشكل صحيح  ❌ **').catch(console.error);
        
        }
        
        });

    client.on('message', message => {
        if (message.content.startsWith("رابط")) {
    if(!message.guild.member(client.user).hasPermission("CREATE_INSTANT_INVITE")) return message.reply("**للأسف البوت يحتاج صلاحية`CREATE_INSTANT_INVITE`**") .then(msg => msg.delete(5000));;
            message.channel.createInvite({
            thing: true,
            maxUses: 1,
            maxAge: 3600,
        }).then(invite =>
          message.author.sendMessage(invite.url)
        )
        const embed = new Discord.RichEmbed()
            .setColor("RANDOM")
              .setDescription(" تم أرسال الرابط برسالة خاصة ")
               .setAuthor(client.user.username, client.user.avatarURL)
                     .setAuthor(client.user.username, client.user.avatarURL)
                    .setFooter('طلب بواسطة: ' + message.author.tag)
    
          message.channel.sendEmbed(embed).then(message => {message.delete(10000)})
                  const Embed11 = new Discord.RichEmbed()
            .setColor("RANDOM")
            
        .setDescription(" مدة الرابط : ساعه  عدد استخدامات الرابط : 1 ")
          message.author.sendEmbed(Embed11)
        }
    }); 
    client.on('message', message => {
        if (message.content.startsWith(".avatar")) {
            var mentionned = message.mentions.users.first();
        var x5bzm;
          if(mentionned){
              var x5bzm = mentionned;
          } else {
              var x5bzm = message.author;
              
          }
            const embed = new Discord.RichEmbed()
            .setColor("RANDOM")
            .setImage(`${x5bzm.avatarURL}`)
          message.channel.sendEmbed(embed);
        }
    });

    client.on('message', message => {
        var args = message.content.split(/[ ]+/)
        if(message.content.includes('gmail')){
            message.delete()
        return message.reply(`** لايمكنك نشر الجيمل  هنا **`)
        }
    });
    
    client.on('message', message => {
        var args = message.content.split(/[ ]+/)
        if(message.content.includes('snapchat')){
            message.delete()
        return message.reply(`** لايمكنك نشر سناب شات  هنا **`)
        }
    });
    
    
    client.on('message', message => {
        var args = message.content.split(/[ ]+/)
        if(message.content.includes('instagram')){
            message.delete()
        return message.reply(`** لايمكنك نشر الانستقرام هنا **`)
        }
    });
    
    
    client.on('message', message => {
        var args = message.content.split(/[ ]+/)
        if(message.content.includes('twitter')){
            message.delete()
        return message.reply(`** لايمكنك  نشر التويتر هنا **`)
        }
    });
    
    
    client.on('message', message => {
        var args = message.content.split(/[ ]+/)
        if(message.content.includes('facebook')){
            message.delete()
        return message.reply(`** لايمكنك نشر الفيس بوك هنا **`)
        }
    });
    

client.on("message", message => {
    var prefix = "ا";
            var args = message.content.substring(prefix.length).split(" ");
            if (message.content.startsWith(prefix +"مسح")) {
                if (!message.member.hasPermission("MANAGE_CHANNELS"))  return message.reply("**للأسف ليس لديك صلاحية `MANAGE_CHANNELS` Permission**");
if(!message.guild.member(client.user).hasPermission("MANAGE_CHANNELS")) return message.reply("**للأسف البوت يحتاج صلاحية`MANAGE_CHANNELS`**");
 if (!args[1]) {
                                let embed3 = new Discord.RichEmbed()
                                .setDescription("امسح <number>")
                                .setColor("RANDOM")
                                message.channel.sendEmbed(embed3);
                            } else {
                            let messagecount = parseInt(args[1]);
                            message.channel.fetchMessages({limit: messagecount}).then(messages => message.channel.bulkDelete(messages));
                                                          message.channel.fetchMessages({limit: messagecount}).then(messages => message.channel.bulkDelete(messages));
                            message.channel.fetchMessages({limit: messagecount}).then(messages => message.channel.bulkDelete(messages));
                            let embed4 = new Discord.RichEmbed()
                                                            .setColor("#008000")
                              .setDescription(":white_check_mark: | Delete " + args[1] + " Message!")
                                                                                        message.delete("3000");
                                message.channel.sendEmbed(embed4) .then(msg => msg.delete(3000));
                            }
                          }
});  


client.on('message', message => {
    if(!message.channel.guild) return;
var prefix = ".";
if(message.content.startsWith(prefix + 'bc')) {
if(!message.channel.guild) return message.channel.send('**هذا الأمر فقط للسيرفرات**').then(m => m.delete(5000));
if(!message.member.hasPermission('MANAGE_SERVER')) return      message.channel.send('**للأسف لا تمتلك صلاحية** `MANAGE_SERVER`' );
let args = message.content.split(" ").join(" ").slice(2 + prefix.length);
let copy = "Test";
let request = `Requested By ${message.author.username}`;
if (!args) return message.reply('**يجب عليك كتابة كلمة او جملة لإرسال البرودكاست**');message.channel.send(`**هل أنت متأكد من إرسالك البرودكاست؟ \nمحتوى البرودكاست:** \` ${args}\``).then(msg => {
msg.react('✅')
.then(() => msg.react('❌'))
.then(() =>msg.react('✅'))

let reaction1Filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
let reaction2Filter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;

let reaction1 = msg.createReactionCollector(reaction1Filter, { time: 12000 });
let reaction2 = msg.createReactionCollector(reaction2Filter, { time: 12000 });

reaction1.on("collect", r => {
message.channel.send(`☑ | Done ... The Broadcast Message Has Been Sent For ${message.guild.members.size} Members`).then(m => m.delete(5000));
message.guild.members.forEach(m => {
var bc = new
Discord.RichEmbed()
.setColor('RANDOM')
.setTitle('Broadcast')
.addField('Server', message.guild.name)
.addField('Sender', message.author.username)
.addField('Message', args)
.setThumbnail(message.author.avatarURL)
.setFooter(copy, client.user.avatarURL);
m.send({ embed: bc })
msg.delete();
})
})
reaction2.on("collect", r => {
message.channel.send(`**Broadcast Canceled.**`).then(m => m.delete(5000));
msg.delete();
})
})
}
});
client.on("message", message => {
    var prefix = ".";
              
          if(!message.channel.guild) return;
   if(message.author.bot) return;
      if(message.content === prefix + "image"){ 
          const embed = new Discord.RichEmbed()
  
      .setTitle(`This is  ** ${message.guild.name} **  Photo !`)
  .setAuthor(message.author.username, message.guild.iconrURL)
    .setColor(0x164fe3)
    .setImage(message.guild.iconURL)
    .setURL(message.guild.iconrURL)
                    .setTimestamp()

   message.channel.send({embed});
      }
  });

client.on('message', message => {
        var prefix = ".";
    if (message.content.split(' ')[0] == 'bc2')
       message.guild.members.forEach( member => {
         if (!message.member.hasPermission("ADMINISTRATOR"))  return;


           member.send( `${member} ! ` + "**" + message.guild.name + " : ** " + message.content.substr(3));
                                                      message.delete();
            
                                                    });
            
                                                  });
   client.on("message", message => {
       var prefix = "#";
 
             var args = message.content.substring(prefix.length).split(" ");
                if (message.content.startsWith(prefix + "k")) {
                          if (!message.member.hasPermission("ADMINISTRATOR"))  return;

                          if (!args[1]) {
                            
                                 let embed3 = new Discord.RichEmbed()
                                     .setDescription(":white_check_mark: | تم ارسال رسالة لا يوجد فيها شيء")
                                       .setColor("#FF00FF")
                                          message.channel.sendEmbed(embed3);
                            
                                        } else {

                            
                                           let embed4 = new Discord.RichEmbed()
                                                            .setDescription(':white_check_mark: | تم ارسال الرساله للجميع ..')
                                                                .setColor("#99999")
                               
                                                                message.channel.sendEmbed(embed4);
                                                      message.delete();
                            }
                          }
});

client.on("message", message => {
    var prefix = ".";
   if (message.content.startsWith(prefix + "bc3")) {
                if (!message.member.hasPermission("ADMINISTRATOR"))  return;
let args = message.content.split(" ").slice(1);
var argresult = args.join(' '); 
message.guild.members.filter(m => m.presence.status !== 'offline').forEach(m => {
m.send(`${argresult}\n ${m}`);
})
message.channel.send(`\`${message.guild.members.filter(m => m.presence.status !== 'online').size}\` : عدد الاعضاء المستلمين`); 
message.delete(); 
};     
});
client.login(process.env.BOT_TOKEN);
