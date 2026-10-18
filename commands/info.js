const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Menampilkan informasi server'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('PADEPOKAN NJAM')
            .setDescription(
                'Selamat datang di PADEPOKAN NJAM.\n\n' +
                'Server ini menjadi tempat berkumpul, berkomunikasi, dan menjaga kebersamaan seluruh anggota.'
            )
            .addFields(
                {
                    name: '👑 PRESIDEN',
                    value:    'Njam',
                    inline: false
                },
                {
                    name: '🛡️ MODERATOR',
                    value:    'Otter',
                    inline: false
                },
                {
                    name: '👨 LAKI-LAKI',
                    value:    'Anak Lanang',
                    inline: true
                },
                {
                    name: '👩 PEREMPUAN',
                    value:    'Anak Wedok',
                    inline: true
                },
                {
                    name: '🤖 BOT',
                    value:    'Bot server',
                    inline: false
                }
            )
            .setFooter({
                text: 'PADEPOKAN NJAM'
            });

        await interaction.reply({
            embeds: [embed]
        });
    },
};
