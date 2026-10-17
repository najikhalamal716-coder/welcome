const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Load Commands
const commandFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of commandFiles) {
    const command = require(path.join(__dirname, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`BOT ONLINE BOS! Login sebagai ${client.user.tag} 🔥`);
});

// --- HANDLE SLASH COMMAND ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
    }
});

// --- HANDLE WELCOME JOIN/LEAVE BOS! ---
async function createWelcomeImage(member, type) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = type === 'join' ? '#2b2d31' : '#23272a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Sans';
    ctx.fillText(type === 'join' ? `SELAMAT DATANG!` : `SELAMAT JALAN!`, 250, 100);
    
    ctx.font = '30px Sans';
    ctx.fillText(`${member.user.username}`, 250, 160);
    ctx.font = '20px Sans';
    ctx.fillText(`di Ponpes Al-Njamroni`, 250, 190);

    // Avatar
    try {
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'jpg' }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 150, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 70, 160, 160);
        ctx.restore();
    } catch (e) { console.log('Gagal load avatar', e) }

    return canvas.toBuffer();
}

client.on(Events.GuildMemberAdd, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID; // NANTI ISI DI RAILWAY VARIABLES
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const buffer = await createWelcomeImage(member, 'join');
    await channel.send({ 
        content: `Halo ${member}! Selamat datang di **${member.guild.name}** 🙏`, 
        files: [{ attachment: buffer, name: 'welcome.jpg' }] 
    });
});

client.on(Events.GuildMemberRemove, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const buffer = await createWelcomeImage(member, 'leave');
    await channel.send({ 
        content: `${member.user.username} telah keluar dari server.`, 
        files: [{ attachment: buffer, name: 'goodbye.jpg' }] 
    });
});

client.login(process.env.TOKEN);
