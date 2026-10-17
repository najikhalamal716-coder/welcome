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

// --- WELCOME IMAGE FINAL - ANTI KOTAK & PAS TENGAH BOS! ---
async function createWelcomeImage(member, type) {
    // Load background bersih yang baru
    const bgPath = path.join(__dirname, 'assets', type === 'join' ? 'welcome-bg.png' : 'goodbye-bg.png');
    const background = await loadImage(bgPath);

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Gambar background mewah
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // === AVATAR - PAS DI TENGAH LINGKARAN EMAS ===
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.50; // tengah lingkaran
    const avatarRadius = canvas.width * 0.195; // pas sama lingkaran

    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 1024, forceStatic: false });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        // Gambar avatar full di dalam lingkaran
        ctx.drawImage(avatar, centerX - avatarRadius, centerY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
    } catch (e) { 
        console.log('Gagal load avatar', e);
    }

    // === USERNAME - DI SPACE KOSONG BAWAH LINGKARAN ===
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E9C57A'; // Gold mewah
    
    // PAKAI SANS BIAR GAK KOTAK-KOTAK DI LINUX RAILWAY
    ctx.font = `bold ${Math.floor(canvas.width * 0.065)}px Sans`;
    
    // Bersihin nama dari emoji/karakter aneh biar gak kotak
    let displayName = member.displayName || member.user.username;
    let cleanName = displayName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().substring(0, 18);
    if (!cleanName) cleanName = member.user.username.toUpperCase().substring(0, 18);
    
    // Kasih shadow biar glowing mewah
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 2;
    ctx.fillText(cleanName, centerX, canvas.height * 0.835);
    ctx.shadowBlur = 0;

    return canvas.toBuffer('image/png');
}

client.on(Events.GuildMemberAdd, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const buffer = await createWelcomeImage(member, 'join');
        await channel.send({ 
            content: `Halo ${member}! Selamat datang di **${member.guild.name}** 🙏`, 
            files: [{ attachment: buffer, name: 'welcome.png' }] 
        });
    } catch(e){ console.error('Error welcome:', e) }
});

client.on(Events.GuildMemberRemove, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const buffer = await createWelcomeImage(member, 'leave');
        await channel.send({ 
            content: `${member.user.username} telah keluar dari server.`, 
            files: [{ attachment: buffer, name: 'goodbye.png' }] 
        });
    } catch(e){ console.error('Error goodbye:', e) }
});

client.login(process.env.TOKEN);
