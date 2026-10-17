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

// Load semua file command (termasuk claimrole.js lu)
const commandFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of commandFiles) {
    try {
        const command = require(path.join(__dirname, file));
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        }
    } catch (e) {
        console.log(`Gagal load ${file}: ${e.message}`);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`BOT ONLINE BOS! ${client.user.tag}`);
});

// === HANDLER LENGKAP - COMMAND + TOMBOL CLAIM ROLE ===
client.on(Events.InteractionCreate, async interaction => {
    // 1. HANDLE SLASH COMMAND (/claimrole, dll)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Error bos!', ephemeral: true }).catch(()=>{});
            }
        }
        return;
    }
    
    // 2. HANDLE TOMBOL CLAIM LAKI / PEREMPUAN (PUNYA LU)
    if (interaction.isButton()) {
        const roleMap = {
            'claim_laki': 'LAKI-LAKI',
            'claim_perempuan': 'PEREMPUAN'
        };

        const roleName = roleMap[interaction.customId];
        if (!roleName) return;

        const role = interaction.guild.roles.cache.find(r => r.name.toUpperCase() === roleName);
        if (!role) {
            return interaction.reply({ 
                content: `❌ Role **${roleName}** belum ada bos! Bikin dulu di Server Settings > Roles > Create Role nama persis **${roleName}**`, 
                ephemeral: true 
            });
        }

        const member = interaction.member;
        const otherRoleName = roleName === 'LAKI-LAKI' ? 'PEREMPUAN' : 'LAKI-LAKI';
        const otherRole = interaction.guild.roles.cache.find(r => r.name.toUpperCase() === otherRoleName);

        try {
            // Hapus role lawan jenis biar cuma 1
            if (otherRole && member.roles.cache.has(otherRole.id)) {
                await member.roles.remove(otherRole);
            }

            if (member.roles.cache.has(role.id)) {
                await interaction.reply({ content: `Kamu sudah punya role **${roleName}**! ${roleName === 'LAKI-LAKI' ? '👨' : '👩'}`, ephemeral: true });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `✅ Berhasil! Kamu sekarang **${roleName}** ${roleName === 'LAKI-LAKI' ? '👨' : '👩'}`, ephemeral: true });
            }
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: '❌ Bot gak punya izin! Naikin posisi role bot di atas role LAKI-LAKI/PEREMPUAN di Server Settings > Roles!', ephemeral: true });
        }
    }
});

// === WELCOME IMAGE - PRESISI & ANTI KOTAK ===
async function createWelcomeImage(member, type) {
    const possibleFiles = type === 'join' ? ['welcome-bg.png','welcome-bg.jpg'] : ['goodbye-bg.png','goodbye-bg.jpg'];
    let bgPath = null;
    for (const f of possibleFiles) {
        const p = path.join(__dirname, 'assets', f);
        if (fs.existsSync(p)) { bgPath = p; break; }
    }
    if (!bgPath) return null;

    const background = await loadImage(bgPath);
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.525;
    const avatarRadius = canvas.height * 0.255;

    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 1024, forceStatic: true });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, centerX - avatarRadius, centerY - avatarRadius, avatarRadius*2, avatarRadius*2);
        ctx.restore();
    } catch(e){}

    ctx.textAlign = 'center';
    ctx.fillStyle = '#E9C57A';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 10;
    let cleanName = member.user.username.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 16);
    if (cleanName.length < 2) cleanName = "MEMBER BARU";
    ctx.font = `bold ${Math.floor(canvas.width * 0.042)}px Sans`;
    ctx.fillText(cleanName, centerX, canvas.height * 0.89);

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
        await channel.send({ content: `Halo ${member}! Selamat datang di **${member.guild.name}** 🙏`, files: [{ attachment: buffer, name: 'welcome.png' }] });
    } catch(e){ console.error('Welcome error:', e) }
});

client.on(Events.GuildMemberRemove, async member => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;
    try {
        const buffer = await createWelcomeImage(member, 'leave');
        if (!buffer) return;
        await channel.send({ content: `**${member.user.username}** telah keluar.`, files: [{ attachment: buffer, name: 'goodbye.png' }] });
    } catch(e){ console.error('Goodbye error:', e) }
});

client.login(process.env.TOKEN);
