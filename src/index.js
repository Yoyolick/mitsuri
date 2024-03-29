// normal lib declarations
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// openai
const { Configuration, OpenAIApi } = require("openai");

// pocketbase
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://db.zoogies.live');

// get the env and read from our config accordingly
const env = process.env.NODE_ENV || 'production';
let token, configuration, elevenTOKEN;

if (env === 'development') {
	console.log(">> launching in development mode");

	const configDev = require('./config-dev.json');
	token = configDev.token;
	configuration = new Configuration({
		apiKey: configDev.OPENAI_API_KEY
	});
	console.log(">> OPENAI_API_KEY LOADED");
	
	elevenTOKEN = configDev.eleven_api_key;
	console.log(">> ELEVEN API KEY LOADED");
	
	const authData = pb.admins.authWithPassword(configDev.pb_email, configDev.pb_password);
	console.log(">> Authenticated with db.zoogies.live");
} 
else {
	console.log(">> launching in production mode");

	const configProd = require('/usr/mitsuri/config.json');
	token = configProd.token;
	configuration = new Configuration({
		apiKey: configProd.OPENAI_API_KEY
	});

	console.log(">> ELEVEN API KEY LOADED");

	const { exec } = require('child_process');

	exec('npm run push', (error) => {
		if (error) {
		console.error(`Error: ${error}`);
		}
	});

	const pb_email = configProd.pb_email;
	const pb_pass = configProd.pb_password;
	const authData = pb.admins.authWithPassword(pb_email, pb_pass);
}

// build our client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// get version from package.json
const pkg = require("./package.json")
const ver = pkg.version;

// openai post init setup
const openai = new OpenAIApi(configuration);
module.exports = {
	openai,
	client,
	pb,
	env,
	ver,
	elevenTOKEN
}; // allow this openai object to be accessed from our slash commands

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	// console.log(">> Loading command "+filePath);
	const command = require(filePath);
	// console.log(">> ",command.data.name)
	// console.log(">> ",command.data)
	client.commands.set(command.data.name, command);
}
 
client.once(Events.ClientReady, () => {
	console.log(">> Mitsuri Bot v"+ver+" by Ryan Zmuda");
	rpc = 'with https://zoogies.live servers 😎';
	client.user.setActivity(rpc);
	console.log('>> RPC set -> Playing '+rpc);
	console.log('>> Being wholesome in '+client.guilds.cache.size.toString()+' guilds')
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);
console.log(">> Bot fully initialized.");