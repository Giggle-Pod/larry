const { Client, IntentsBitField } = require("discord.js");
const fs = require("fs");
const { CronJob } = require("cron");

//login to discord
const client = new Client({intents: [IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.DirectMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.Guilds]});
let token = fs.readFileSync("token.txt", "utf-8").trim();
client.login(token);

let morning;

client.on("ready", () => {
    console.log(`Connected as ${client.user.username}`);

    //schedule chores to be assigned in the morning
    morning = new Date(Date.now());
    //set to tomorrow if it is already past time today
    if (morning.getHours() >=6 && morning.getMinutes() > 0)
        morning.setDate(morning.getDate() + 1);
    morning.setHours(6);
    morning.setMinutes(0);
    morning.setSeconds(morning.getSeconds() + 5);
    new CronJob(morning, assignChores, null, true, "America/Indiana/Indianapolis");

    assignChores();

    //schedule callout for when chore is not done by a certain time
});

async function assignChores() {
    console.log(`Assigning chores: ${new Date(Date.now())}`);
    //config for roommate discord IDs and chores
    let config = JSON.parse(fs.readFileSync("config.json"));
    let newRoommates = [];
    let guild = await client.guilds.fetch(config.guildId);
    await guild.members.fetch(); //load server members into cache

    for (let i = 0; i < config.roommates.length; i++) {
        let newIndex = (i + 1) % config.roommates.length;
        newRoommates[newIndex] = config.roommates[i];
        let guildMember = await guild.members.fetch(newRoommates[newIndex].id);
        console.log(`${newRoommates[newIndex].id}: ${config.chores[newIndex]}`);
        //await guildMember.user.send(`Your chore for today is: ${config.chores[newIndex]}`);
    }

    config.roommates = newRoommates;
    fs.writeFileSync("config.json", JSON.stringify(config, null, 4));

    //schedule for the next day
    console.log(`next time: ${morning}`);
}