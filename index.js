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

// --- HANDLE WELCOME JOIN/LEAVE - PAS SAMA BACKGROUND EMAS BOS! ---
async function createWelcomeImage(member, type) {
    // Load background dari folder assets
    const bgPath = path.join(__dirname, 'assets', type === 'join' ? 'welcome-bg.png' : 'goodbye-bg.png');
    const background = await loadImage(bgPath);

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Gambar background mewah lu
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // === POSISI AVATAR - DI TENGAH LINGKARAN EMAS ===
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.47; // pas tengah lingkaran
    const avatarRadius = canvas.width * 0.11; // besar avatar biar pas lingkaran
    const avatarSize = avatarRadius * 2;

    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'jpg', size: 512 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, centerX - avatarRadius, centerY - avatarRadius, avatarSize, avatarSize);
        ctx.restore();
    } catch (e) { 
        console.log('Gagal load avatar', e) 
    }

    // === TEKS USERNAME - PAS DI BAWAH LINGKARAN ===
    ctx.textAlign = 'center';
    
    // Username gold
    ctx.fillStyle = '#E9C57A';
    ctx.font = `bold ${Math.floor(canvas.width * 0.055)}px serif`;
    const username = member.user.username.toUpperCase().substring(0, 20);
    ctx.fillText(username, centerX, canvas.height * 0.765);

    // Subtitle bawahnya
    ctx.fillStyle = '#E8DCC0';
    ctx.font = `${Math.floor(canvas.width * 0.022)}px serif`;
    const subText = type === 'join' ? 'Selamat Datang di Padepokan Njam.' : 'Sampai Jumpa Lagi - Padepokan Njam';
    ctx.fillText(subText, centerX, canvas.height * 0.825);

    return canvas.toBuffer('image/png');
}

client.on(Events.GuildMemberAdd, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const buffer = await createWelcomeImage(member, 'join');
    await channel.send({ 
        content: `Halo ${member}! Selamat datang di **${member.guild.name}** 🙏`, 
        files: [{ attachment: buffer, name: 'welcome.png' }] 
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
        files: [{ attachment: buffer, name: 'goodbye.png' }] 
    });
});

client.login(process.env.TOKEN);
