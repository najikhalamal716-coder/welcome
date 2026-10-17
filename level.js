const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const dbPath = './levels.json';
function getLevels() {
    if (!fs.existsSync(dbPath)) return {};
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Cek level kamu')
        .addUserOption(opt => opt.setName('user').setDescription('Cek user lain').setRequired(false)),
    async execute(interaction) {
        try {
            const target = interaction.options.getUser('user') || interaction.user;
            const levels = getLevels();
            const data = levels[`${interaction.guild.id}_${target.id}`];

            if (!data) {
                return interaction.reply({ content: `❌ ${target.username} belum ada data level! Chat dulu bos!`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📊 Level - ${target.username}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '⭐ Level', value: `${data.level}`, inline: true },
                    { name: '💬 XP', value: `${data.xp} / ${data.level * 300}`, inline: true },
                    { name: '🏆 Total XP', value: `${data.totalXp || data.xp}`, inline: true }
                )
                .setColor(0xFFD700)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (e) {
            await interaction.reply({ content: `❌ Error level!`, ephemeral: true });
        }
    }
};
