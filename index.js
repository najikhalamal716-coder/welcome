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

// Handle Slash Command
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

// --- WELCOME IMAGE FINAL - PRESISI & ANTI KOTAK-KOTAK ---
async function createWelcomeImage(member, type) {
    const possibleFiles = type === 'join' 
        ? ['welcome-bg.png', 'welcome-bg.jpg', 'welcome-bg.jpeg'] 
        : ['goodbye-bg.png', 'goodbye-bg.jpg', 'goodbye-bg.jpeg'];
    
    let bgPath = null;
    for (const f of possibleFiles) {
        const p = path.join(__dirname, 'assets', f);
        if (fs.existsSync(p)) { bgPath = p; break; }
    }
    
    if (!bgPath) {
        console.error('[ERROR] File background gak ketemu di folder assets!');
        return null;
    }

    console.log(`[WELCOME] Load background: ${bgPath}`);
    const background = await loadImage(bgPath);
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // SETTINGAN PRESISI - PAS TENGAH FRAME EMAS
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.525; // Posisi Y pas di tengah lingkaran emas
    const avatarRadius = canvas.height * 0.255; // Ukuran kecil biar gak nutupin tulisan

    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 1024, forceStatic: false });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, centerX - avatarRadius, centerY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        // Border tipis biar rapih
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(233, 197, 122, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (e) { 
        console.log('Gagal load avatar', e);
    }

    // USERNAME - ANTI KOTAK-KOTAK 100%
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E9C57A';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    
    let rawName = member.displayName || member.user.username;
    // Hapus emoji & simbol aneh, sisain huruf angka doang
    let cleanName = rawName.replace(/[^\x00-\x7F]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim().toUpperCase().substring(0, 16);
    if (!cleanName) cleanName = member.user.username.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 16);
    if (!cleanName) cleanName = "MEMBER BARU";
    
    ctx.font = `bold ${Math.floor(canvas.width * 0.038)}px Sans`;
    ctx.fillText(cleanName, centerX, canvas.height * 0.89);
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
        if (!buffer) return;
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
        if (!buffer) return;
        await channel.send({ 
            content: `${member.user.username} telah keluar dari server.`, 
            files: [{ attachment: buffer, name: 'goodbye.png' }] 
        });
    } catch(e){ console.error('Error goodbye:', e) }
});

client.login(process.env.TOKEN);
