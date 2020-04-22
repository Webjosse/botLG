//UPLOAD PAR ZiJo
//Charge main.js
const discord = require("discord.js");
//Le client, appelé Bot
const bot = new discord.Client();

//Les paramètres (token et préfixe)
const config = require("./config.json");

//Lorsque le bot est prêt
bot.on("ready",() => {
	//
	//Affiche dans la console l'exécution APRÈS l'activité du bot
	bot.user.setActivity("Disponible");
	console.log("Bot <"+bot.user.username+"> Connecté!");
});

//Variables globales:
//game: booléenne (partie en cours?)
//compo: composition
//lgnames: noms des loups pour PF
global.game = false;
//global.compo = ["wolf","wolf","seer","hunter","villager","villager","villager","villager"];
global.compo = ["wolf","witch","hunter","seer","villager"];
//global.compo = ["witch","hunter","wolf","wolf","villager","villager","villager","villager"];
global.lgnames = ["Loup Koum", "Loup Che", "Loup Ysiane", "Le gars roux","Loup Ykatorze"];

//Variable globale des morts
global.dies = [];

//roles: dictionnaire des rôles
global.roles = {"villager": "Simple Villageois", "wolf": "Loup-Garou", "hunter":"Chasseur","pf": "Somnambule","witch":"Sorcière","seer":"Voyante"};
//Rpic : Images des rôles
global.Rpic = {"villager":"https://i.ibb.co/9nHtFy2/villager.png", "wolf":"https://i.ibb.co/F4ZkjcD/wolf.png","witch":"https://i.ibb.co/vBTg7KM/Sorciere.png","seer":"https://i.ibb.co/wKPNFhP/seer.png", "hunter": "https://i.ibb.co/jgPTxFd/Chasseur.png"};
//messages de timer
global.timerMessage = 0
async function timerInit(second){
	var L = [];
	let p;
	for (p in Gplayers){
		L.push(await Gplayers[p].member.send("Secondes restantes: "+second.toString(10)));
	};
	let t;
	if (timerMessage !== 0){
		for (t in timerMessage){
			await timerMessage[t].delete();
		};
	};
	timerMessage = L;
};
//Actualiser timer
async function stepTime(second){
	for (m in timerMessage){
		await timerMessage[m].edit("Secondes restantes: "+second.toString(10));
	};
};
//Gchats : Liste des chats actuels
global.Gchats = {
	"wait": null,
	"wolf": null,
	"village": null,
	"deads":null,
	"cupid": null,
	"guard": null,
	"dark": null,
	"witch": null,
	"seer": null,
	"hunter": null,
	"white" : null
};
//Objets "Player": Contienne l'utilisateur associé, son rôle, son vote, sa situation...
//member: utilisateur, auth: booléenne (droit de modifier compo?)
class Player{
	constructor(member,auth){
		this.member = member;
		this.name = member.username;
		this.auth = auth;
		this.role = null;
		this.chat = Gchats["wait"];
		this.dead = false;
		this.votes = [];
	};
	//Envoi de message
	async send(content){
		this.chat.send(content,this);
	};
	//Vote
	async vote(player){
		if (player == NaN){
			await this.member.send({embed:{title:"Mets un Numéro!"}});
		};
		for (p in Gplayers){
			if (Gplayers[p].votes.includes(this)){
				Gplayers[p].votes.splice( Gplayers[p].votes.indexOf(this), 1 );
			};
		};
		if (player !== undefined){
			player.votes.push(this);
			await this.send("//*vote **"+player.name+"***");
			await this.member.send({embed:{title:"Vous votez "+player.name}});
		}else{
			this.send("//*ne vote plus*");
		};
	};
};
global.IDembed = undefined
//gestion des votes
function reinitVotes(){
	for (p in Gplayers){
		Gplayers[p].votes = [];
	};
};
function getByVotes(){
	let maxVotes = undefined;
	let p;
	for (p in Gplayers){
		if (Gplayers[p].votes.length > 0 && (maxVotes === undefined || Gplayers[p].votes.length > maxVotes.votes.length)){
			maxVotes = Gplayers[p];
		};
		if (Gplayers[p].votes.length > maxVotes.votes.length) maxVotes = undefined;
	};
	return maxVotes;
};
//Nombre de nuits
global.nights = 0
global.timePassed = 0;
//Pour savoir si le rôle est présent et en vie
function IsLiving(role){
	for (P in Gplayers){
		if (Gplayers[P].role === role && !Gplayers[P].dead){
			return true;
		};
	};
	return false;
};
//annoncer à tous les joueurs
async function announce(content){
	let i;
	for (i in Gplayers){
		await Gplayers[i].member.send({embed:{color:7237375,title:content}})
	};
};
//Pour le timer en général
async function mainTimer(sec){
	await setTimeout(function(){
	if (timePassed >= sec){
		Next();
	}else {
		timePassed += 5;
		stepTime(sec-timePassed);
		mainTimer(sec);
	};
	}, 5000);
};
//Fonction de déroulement de la partie
async function Next(){
	console.log(Gchats);
	var sec = 0;
	var VillageLife = false;
	var i;
	//Vérification (pour les victoires)
	for (i in compo){
		if (IsLiving(compo[i]) && !(["wolf","dark","white"].includes(compo[i]))){
			VillageLife = true;
		};
	};
	var WolfLife = false;
	for (i in ["wolf","dark","white"]){
		if (IsLiving(["wolf","dark","white"][i])){
			WolfLife = true;
		};
	};
	if (VillageLife && !WolfLife){
		game = false;
		for (i in Gplayers){
			await Gplayers[i].member.send({embed:{color:16711680,title:"Les villageois ont gagné"}})
		};
		return;
	}else if (WolfLife && !VillageLife){
		game = false;
		for (i in Gplayers){
			await Gplayers[i].member.send({embed:{color:16776960,title:"Les loups ont gagné"}})
		};
		return;
	} else if (!(WolfLife || VillageLife)){
		game = false;
		for (i in Gplayers){
			await Gplayers[i].member.send({embed:{title:"Tout le monde est mort"}})
		};
		return;
	};
	//On passe au tour de CUPI
	if (Gchats["wait"] !== null || Gchats["village"] !== null){
		if (Gchats["wait"] !== null){
			nights = 1;
		}
		else if (Gchats["hunter"] !== null){
			await destroy(Gchats["village"]);
			await destroy(Gchats["hunter"]);
			Gchats["hunter"] = null;
			Gplayers.filter(x => (x.role == "hunter"))[0].dead = true;
			Gchats["wait"] = new Chat([],"#ff97a1",null);
		}else{
			nights++;
		};
		let Murdered = getByVotes();
		if (Murdered !== undefined){
			await announce("Vous avez tué "+Murdered.name+" qui était "+roles[Murdered.role]);
			reinitVotes();
			if (Murdered.role == "hunter"){
				Gchats["village"].commands = [];
				Gchats["hunter"] = new Chat(Gplayers.filter(x => (x.role == "hunter")),["shoot"],"#009900", null);
				Gchats["hunter"].list();
				sec = 30;
				timePassed = 0;
				await timerInit(sec);
				await mainTimer(sec);
				return;
			}else{
				Murdered.dead = true;
			};
			Next();
			return;
		};
		dies = [];
		await destroy(Gchats["wait"]);
		Gchats["wait"] = null;
		await destroy(Gchats["village"]);
		Gchats["village"] = null;
		Gchats["cupid"] = new Chat(Gplayers.filter(x => x.role === "cupid"),["love"],"#ff97a1",null);
		if (IsLiving("cupid") && nights === 1){
			sec = 30;
			await announce("C'est au tour de cupidon")
			Gchats["cupid"].list();
		};
	} else if (Gchats["cupid"] !== null){//PUIS TOUR DU GARDE
		await destroy(Gchats["cupid"]);
		Gchats["cupid"] = null;
		Gchats["guard"] = new Chat(Gplayers.filter(x => x.role === "guard"),["defend"],"#b4b4b4",null);
		if (IsLiving("guard")){
			sec = 30;
			await announce("C'est au tour du garde")
			Gchats["guard"].list();
		};
	} else if (Gchats["guard"] !== null){// TOUR DES LOUPS
		await destroy(Gchats["guard"])
		reinitVotes();
		Gchats["guard"] = null;
		Gchats["wolf"] = new Chat(Gplayers.filter(x => (["wolf","dark","white"].includes(x.role) && !x.dead)),["eat"],"#d00000",null);
		sec = 30;
		await announce("C'est au tour des Loups Garous")
		Gchats["wolf"].list();
	} else if (Gchats["wolf"] !== null){// TOUR LGB/LGN
		let Murdered = getByVotes()
		if (Murdered !== undefined){
			dies.push(Murdered);
		};
		await destroy(Gchats["wolf"])
		Gchats["wolf"] = null;
		Gchats["dark"] = new Chat(Gplayers,["infect"],"#654000",null);
		Gchats["white"] = new Chat(Gplayers,["murder"],"#d5d5d5",null);
		if (IsLiving("dark") || IsLiving("white")){
			sec = 30;
			await announce("C'est au tour de loup blanc/noir")
			Gchats["white"].list();
		};
	} else if (Gchats["dark"] !== null || Gchats["white"] !== null){//TOUR SORCIERE + VOVO
		await destroy(Gchats["dark"]);
		Gchats["dark"] = null;
		await destroy(Gchats["white"]);
		Gchats["white"] = null;
		Gchats["witch"] = new Chat(Gplayers.filter(x => (x.role === "witch" && !x.dead)),["kill","save"],"#ff0050",null);
		Gchats["seer"] = new Chat(Gplayers.filter(x => (x.role === "seer" && !x.dead)),["see"],"#660066",null);
		if (IsLiving("witch") || IsLiving("seer")){
			sec = 30;
			await announce("C'est au tour de la sorcière/voyante")
			Gchats["witch"].list();
			//ANNONCE DES MORTS à SOSO
			if (Gchats["witch"].players[0] !== undefined && !Gchats["witch"].players[0].dead){
				if (dies.length == 0){
					Gchats["witch"].players[0].member.send({embed:{color:433703,description:"Personne n'est en danger de mort"}});
				} else if (dies.length == 1){
					Gchats["witch"].players[0].member.send({embed:{color:433703,description:dies[0].name + "est en danger de mort"}});
				}else{
					let dd;
					var DangerS = "";
					for (dd in dies){
						DangerS += dies[dd].name + " , ";
					};
					DangerS += " sont en danger!";
					Gchats["witch"].players[0].member.send({embed:{color:433703,description:DangerS}});
					delete DangerS;
				};
			};
			Gchats["seer"].list();
		};
	} else if (Gchats["seer"] !== null || Gchats["witch"] !== null){//ET ENFIN, LE VILLAGE
		await destroy(Gchats["witch"]);
		Gchats["witch"] = null;
		await destroy(Gchats["seer"]);
		Gchats["seer"] = null;
		if (dies === null){
			dies = [];
		} else{
			console.log(dies.length);
			if (dies.length === 0){
				await announce("Personne n'est mort cette nuit");
			} else{
				var deadStr = "";
				for (i in dies){
					if (deadStr !== ""){
						deadStr += ", ";
					};
					deadStr += dies[i].name + "["+roles[dies[i].role]+"]";
				};
				for (i in Gplayers){
					if (dies.includes(Gplayers[i]) && Gplayers[i].role !== "hunter"){
						Gplayers[i].dead = true;
					};
					await Gplayers[i].member.send({embed:{color:7237375,title:"Cette nuit, sont morts: "+deadStr}})
				};
				if (dies.includes(Gplayers.filter(x => (x.role == "hunter"))[0] !== [])){
					console.log("MAIS");
					Gchats["hunter"] = new Chat(Gplayers.filter(x => (x.role == "hunter")),["shoot"],"#009900", null);
					evening = false;
				};
				dies = [];
			};
		};
		reinitVotes();
		if (Gchats["hunter"] !== null){//AH OUI! Et le chasseur si il ""meurt""
			Gchats["hunter"].list();
			sec = 30;
		}else{
			Gchats["village"] = new Chat(Gplayers.filter(x => (x.dead !== true)),["vote"],"#ffff00",null);
			Gchats["village"].list();
			sec = 120;
		};
	} else if (Gchats["hunter"] !== null){//ENCORE pour le chasseur, dur à dev celui-là
		destroy(Gchats["hunter"]);
		Gchats["hunter"] = null;
		Gplayers.filter(x => (x.role == "hunter"))[0].dead = true;
		Gchats["village"] = new Chat(Gplayers.filter(x => (x.dead !== true)),["vote"],"#ffff00",null);
		reinitVotes();
		Gchats["village"].list();
		sec = 120;
	};
	timePassed = 0;
	if (sec === 0){
		await Next();
		return;
	};
	let u;
	await timerInit(sec);
	await mainTimer(sec);
};

//Pour passer d'un chat à l'autre
//Objet "Chat" pour le Chatting
//membres, commandes disponibles, couleur du chat (hex) et listener (pour PF)
class Chat{
	constructor(players,commands,color,listener){
		this.players = players;
		let p;
		for (p in players){
			players[p].chat = this;
		};
		this.listener = listener;
		this.color = color;
		this.commands = commands
	};
	async send(content,player){
		if (!this.players.includes(player)) return;
		const messageEmbed = new discord.RichEmbed()
			.setColor(this.color)
			.setTitle(player.name)
			.setDescription(content);
		let P;
		for (P in  this.players) {
			//On envoie à tous, sauf au joueur lui-même
			if (this.players[P] != player){
				await this.players[P].member.send(messageEmbed);
			};
		};
		if (this.listener !== null){
			//Si c'est les loups, on change le pseudo pour la PF
			if (color == "#ff0000"){
				let n = players.indexOf(player);
				messageEmbed = messageEmbed.setTitle(lgnames[n]);
			};
			let P;
			for (P in  this.listener) {
				await this.listener[P].member.send(messageEmbed);
			};
		};
	};
	//envoi de la list d'ID
	async list(){
		reinitList();
		let p;
		var S = "Les commandes sont: ";
		let c;
		for (c in this.commands){
			S += "**"+config.prefix+this.commands[c]+"** ";
		};
		for (p in this.players){
			await this.players[p].member.send(IDembed);
			await this.players[p].member.send(S);
		};
	};
	// LA GROSSE PARTIE DES COMMANDES
	async command(cmd, player){
		console.log(cmd);
		if (!this.commands.includes(cmd.split(" ")[0]))return;
		if (cmd.startsWith("start")) {
			game = true;
			if (this.players.length == compo.length){
				let DistributionL = Gplayers.slice();
				let P;
				//Distribution des rôles
				for (P in compo) {
					let n = Math.floor(Math.random()*DistributionL.length);
					Gplayers[Gplayers.indexOf(DistributionL[n])].role = compo[P];
					if (compo[P] == "witch"){
						Gplayers[Gplayers.indexOf(DistributionL[n])].potions = ["kill","save"];
					};
					DistributionL.splice(n,1);
				};
				for (P in Gplayers) {
					let RoleEmbed = new discord.RichEmbed()
						.setTitle("Tu es "+roles[Gplayers[P].role])
						.setColor("#00ff00")
						.setImage(Rpic[Gplayers[P].role]);
					await Gplayers[P].member.send(RoleEmbed);
				};
				await Next();
			}
			else {
				player.member.send({embed:{color:433703,description:"Il n'y a pas le bon nombre de joueurs"}});
			};
		};
		if (cmd.startsWith("vote") && cmd.split(" ").length > 1) {
			let i = parseInt(cmd.split(" ")[1]);
			console.log(i);
			if (i !== NaN && i > 0){
				if (Gplayers[i-1].dead) return;
				await player.vote(Gplayers[i-1]);
			};
		};
		if (cmd.startsWith("eat") && cmd.split(" ").length > 1) {
			let i = parseInt(cmd.split(" ")[1]);
			if (i !== NaN && i > 0){
				if (Gplayers[i-1].dead) return;
				await player.vote(Gplayers[i-1]);
			};
		};
		//COMMANDE POUR LA VOVO
		if (cmd.startsWith("see") && cmd.split(" ").length > 1) {
			let i = parseInt(cmd.split(" ")[1]);
			if (i !== NaN && i > 0){
				if (Gplayers[i-1].dead) return;
				await player.member.send({embed:{color:433703,description:Gplayers[i-1].name + " est "+roles[Gplayers[i-1].role]}});
				Gchats["seer"].players = [];
			};
		};
		//COMMANDE DE CHASSOU
		if (cmd.startsWith("shoot") && cmd.split(" ").length > 1) {
			console.log("ok");
			let i = parseInt(cmd.split(" ")[1]);
			if (i !== NaN && i > 0){
				var deathIs = Gplayers[i-1];
				if (deathIs.dead) return;
				var deadStr = deathIs.name+"["+roles[deathIs.role]+"]";
				for (i in Gplayers){
					if (deathIs == Gplayers[i] || Gplayers[i].role == "hunter"){
						Gplayers[i].dead = true;
					};
					await Gplayers[i].member.send({embed:{color:7237375,title:"Le chasseur a tiré sur "+deadStr}})
				};
				Gchats["hunter"].players = [];
				timePassed += 30;
			};
		};
		if (cmd.startsWith("kill") && cmd.split(" ").length > 1 && player.potions.includes("kill")) {
			let i = parseInt(cmd.split(" ")[1]);
			if (i !== NaN && i > 0){
				if (Gplayers[i-1].dead ) return;
				if (dies.includes(Gplayers[i-1])) return await player.member.send({embed:{color:433703,description:Gplayers[i-1].name + " est déjà en danger de mort"}});
				await player.member.send({embed:{color:433703,description:"Vous empoisonnez "+Gplayers[i-1].name}});
				dies.push(Gplayers[i-1]);
				player.potions.splice(player.potions.indexOf("kill"), 1);
			};
		};
		if (cmd.startsWith("save") && cmd.split(" ").length > 1 && player.potions.includes("save")) {
			let i = parseInt(cmd.split(" ")[1]);
			if (i !== NaN && i > 0){
				if (Gplayers[i-1].dead) return;
				if (!dies.includes(Gplayers[i-1])) return await player.member.send({embed:{color:433703,description:Gplayers[i-1].name + " n'a pas besoin de soins"}});
				await player.member.send({embed:{color:433703,description:"Vous sauvez "+Gplayers[i-1].name}});
				dies.splice(dies.indexOf(Gplayers[i-1]), 1);
				player.potions.splice(player.potions.indexOf("save"), 1);
			};
		};
	};
};
//Detruire un chat
async function destroy(chat){
	if (chat == null){
		return;
	};
	let p;
	for (p in chat.players){
		chat.players[p].chat = null;
	};
};
//Embed de l'aide
let HelpEmbed = new discord.RichEmbed()
	.setColor("#301300")
	.setTitle("Aide")
	.setDescription("**)play** en MP pour jouer");
//Gplayers : Liste des joueurs de la partie
global.Gplayers = Array()
//Joueur actuel
//Lorsqu'il reçois un message
bot.on("message", async message =>  {
	//Empêcher les bots d'exécuter une commande
	if(message.author.bot) return;
	// Trouver le joueur actuel s'il est inscrit
	let actualPlayer = undefined;
	actualPlayer = Gplayers.filter(x => (x.member.id == message.author.id))[0];
	// Si c'est en MP
	if (message.channel.type == "dm") {
		//Si ça commaence par un préfixe
		if (message.content.startsWith(config.prefix)){
			console.log("-" + message.content);
			if (game){
				if (actualPlayer !== undefined && message.content.startsWith(config.prefix+"list")){
					await actualPlayer.member.send(IDembed);
				};
			}
			else {
				//Si la partie n'a pas été lancée, commandes: )play et )leave
				if(actualPlayer == undefined && message.content.startsWith(config.prefix+"play")){
					if (Gchats["wait"] === null){
						Gchats["wait"]= new Chat(Gplayers,["start"],"#000000",null);
					};
					Gplayers.push(new Player(message.author, [358520708932042754,376387562161438730].includes(message.author.id)));
					console.log(message.author.username+"inscrit");
					await Gplayers.slice(-1)[0].send("//*VIENT DE SE CONNECTER*");
					await message.author.send({embed:{color:433703,title:"Tu as rejoint"}});
				};
				if(actualPlayer != undefined && message.content.startsWith(config.prefix+"leave")){
					if (Gchats["wait"].players === []){
						await destroy(Gchats["wait"]);
						Gchats["wait"] = null;
					}else {
						await actualPlayer.send("//*A QUITTÉ*");
					};
					Gplayers.splice( Gplayers.indexOf(actualPlayer), 1 );
					console.log(message.author.username+"désinscrit");
					await message.author.send({embed:{color:433703,title:"Tu as quitté"}});
				};
			};
			if (actualPlayer !== undefined && actualPlayer.chat !== null) {
				console.log(message.content);
				await actualPlayer.chat.command(message.content.substr(1),actualPlayer);
			};
		}//Si ça ne commence PAS par un préfixe: message dans le chat
		else {
			if(actualPlayer!=undefined && actualPlayer.chat != null && !message.content.startsWith("//")){
				actualPlayer.send(message.content);
				message.react("\ud83d\udc4c");
			};
		};
	}
	else if(message.content.startsWith(config.prefix+"help")){
		await message.channel.send(HelpEmbed);
	};
});
//(re)faire l'Embed list
function reinitList(){
	S = "Les identifiants sont:"
	let i;
	for (i in Gplayers){
		if (!Gplayers[i].dead){
			var I = parseInt(i);
			I += 1;
			S += "\n**"+I.toString(10)+"** - *"+Gplayers[i].name+"*"
			delete I;
		};
	};
	IDembed = new discord.RichEmbed()
	.setColor('#a4d3ff')
	.setTitle('Liste des identifiants')
	.setDescription(S)
};
reinitList();
bot.login(config.token);
