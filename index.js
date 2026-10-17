const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// === SISTEM XP - 5-15 + COOLDOWN 60 DETIK ===
const cooldowns = new Map();
const levelsPath = path.join(__dirname, 'data', 'levels.json');

// Bikin folder data kalo belum ada
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(levelsPath)) {
    fs.writeFileSync(levelsPath, '{}');
}

function getLevelFromXP(xp) {
    const req = [0,50,105,210,315,420,525,630,735,845,950,1055,1160,1265,1370,1475,1580,1685,1790,1895,2000,2105,2210,2315,2420,2525,2630,2735,2840,2945,3050,3155,3260,3365,3470,3575,3680,3785,3890,3995];
    let lvl = 1;
    for(let i=0;i<req.length;i++){ if(xp>=req[i]) lvl=i+1; else break; }
    return lvl;
}
// === END SISTEM XP ===

// Load semua command
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

// === TAMBAHAN BARU - XP DARI CHAT ===
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const key = `${message.author.id}-${message.guild.id}`;

    // 1. Cooldown 60 detik
    if (cooldowns.has(key)) {
        if (Date.now() - cooldowns.get(key) < 60000) return;
    }

    // 2. XP 5-15 random
    const xpToAdd = Math.floor(Math.random() * 11) + 5;

    let levels = {};
    try {
        levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8') || '{}');
    } catch { levels = {}; }

    if (!levels[key]) {
        levels[key] = { userId: message.author.id, guildId: message.guild.id, xp: 0, messages: 0 };
    }

    levels[key].xp += xpToAdd;
    levels[key].messages = (levels[key].messages || 0) + 1;

    fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2));
    cooldowns.set(key, Date.now());
});

// HANDLER COMMAND + BUTTON CLAIM ROLE
client.on(Events.InteractionCreate, async interaction => {
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
    
    if (interaction.isButton()) {
        if (!interaction.customId.startsWith('claim_')) return;
        const isLaki = interaction.customId === 'claim_laki';
        
        const targetRole = interaction.guild.roles.cache.find(r => 
            r.name.toUpperCase().includes(isLaki ? 'LAKI' : 'PEREMPUAN')
        );
        const otherRole = interaction.guild.roles.cache.find(r => 
            r.name.toUpperCase().includes(isLaki ? 'PEREMPUAN' : 'LAKI')
        );

        if (!targetRole) {
            return interaction.reply({ content: `❌ Role ga ketemu bos!`, ephemeral: true });
        }

        try {
            if (otherRole && interaction.member.roles.cache.has(otherRole.id)) {
                await interaction.member.roles.remove(otherRole);
            }
            if (interaction.member.roles.cache.has(targetRole.id)) {
                await interaction.reply({ content: `Kamu udah punya role **${targetRole.name}**!`, ephemeral: true });
            } else {
                await interaction.member.roles.add(targetRole);
                await interaction.reply({ content: `✅ Berhasil! Kamu sekarang **${targetRole.name}** ${isLaki ? '👨' : '👩'}`, ephemeral: true });
            }
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ GAGAL! Naikin role BOT PADEPOKAN di atas Laki-Laki/Perempuan!`, ephemeral: true });
        }
    }
});

// WELCOME & LEAVE
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1550581721538494547';
const CLAIM_ROLE_CHANNEL_ID = '1550728594421055648';

client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('👋 Selamat Datang!')
        .setDescription(
            `Selamat datang **${member.user.username}** di **PADEPOKAN NJAM**!\n\n` +
            `Senang rasanya kamu bergabung bersama kami. Semoga betah dan nyaman di sini.\n` +
            `Silakan menuju <#${CLAIM_ROLE_CHANNEL_ID}> untuk memilih peran **Laki-Laki** atau **Perempuan**.\n\n` +
            `*Welcome Aboard and Enjoy the Server!*`
        )
        .setColor(0xFFD700)
        .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(console.error);
});

client.on(Events.GuildMemberRemove, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('👋 Selamat Jalan!')
        .setDescription(`**${member.user?.username || member.displayName}** telah meninggalkan **PADEPOKAN NJAM**.\n\nTerima kasih telah menjadi bagian dari server kami. Sampai jumpa di lain kesempatan!`)
        .setColor(0x2B2D31)
        .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(console.error);
});

client.login(process.env.TOKEN);
