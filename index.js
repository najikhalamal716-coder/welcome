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

// === WELCOME/GOODBYE - BROADCAST APP VERSI LAMA BAHASA BAGUS (NO GAMBAR) ===
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1550581721538494547';
const CLAIM_ROLE_CHANNEL_ID = '1550728594421055648';

client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return console.log('Channel welcome ga ketemu bos!');
    try {
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
        
        // Biar tampil kayak APP kayak screenshot lu
        await channel.send({ embeds: [embed] });
    } catch(e){ console.error('Welcome error:', e) }
});

client.on(Events.GuildMemberRemove, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return console.log('Channel welcome ga ketemu bos!');
    try {
        const embed = new EmbedBuilder()
            .setTitle('👋 Selamat Jalan!')
            .setDescription(
                `**${member.user?.username || member.displayName}** telah meninggalkan **PADEPOKAN NJAM**.\n\n` +
                `Terima kasih telah menjadi bagian dari server kami. Sampai jumpa di lain kesempatan!`
            )
            .setColor(0x2B2D31)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch(e){ console.error('Goodbye error:', e) }
});

client.login(process.env.TOKEN);
