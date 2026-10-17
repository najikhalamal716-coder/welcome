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
const commandFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of commandFiles) {
    try {
        const command = require(path.join(__dirname, file));
        if (command.data && command.execute) client.commands.set(command.data.name, command);
    } catch (e) {
        console.log(`Gagal load ${file}: ${e.message}`);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`BOT ONLINE BOS! ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    // SLASH COMMAND
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } catch (err) {
            console.error(err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Error bos!', ephemeral: true }).catch(()=>{});
            }
        }
        return;
    }
    
    // BUTTON CLAIM ROLE - VERSI FIX
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

// WELCOME & LEAVE - EMBED APP
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
        .setColor(0xFFD700).setTimestamp();
    await channel.send({ embeds: [embed] }).catch(console.error);
});

client.on(Events.GuildMemberRemove, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('👋 Selamat Jalan!')
        .setDescription(`**${member.user?.username || member.displayName}** telah meninggalkan **PADEPOKAN NJAM**.\n\nTerima kasih telah menjadi bagian dari server kami. Sampai jumpa di lain kesempatan!`)
        .setColor(0x2B2D31).setTimestamp();
    await channel.send({ embeds: [embed] }).catch(console.error);
});

client.login(process.env.TOKEN);
