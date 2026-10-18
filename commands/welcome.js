const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Menampilkan informasi member baru'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🏯 INFORMASI MEMBER BARU')
            .setDescription(
                '✨ **SELAMAT DATANG DI PADEPOKAN NJAM!**\n\n' +
                '🪪 **CLAIM ROLE**\n' +
                'Bagi member yang baru bergabung, silakan menuju:\n\n' +
                '<#1550728594421055648>\n\n' +
                'untuk melakukan **CLAIM ROLE**.'
            )
            .addFields(
                {
                    name: '🧑‍🤝‍🧑 PILIH ROLE',
                    value:
                        '🔹 **Laki-Laki**\n' +
                        '🔸 **Perempuan**'
                },
                {
                    name: '🚨 CLAIM ROLE WAJIB',
                    value:
                        'Setelah melakukan **Claim Role**, kamu akan mendapatkan **akses ke seluruh channel** yang tersedia di server.'
                },
                {
                    name: '📖 SEBELUM BERAKTIVITAS',
                    value:
                        '📌 Silakan membaca dan memahami **Rules** server terlebih dahulu.'
                },
                {
                    name: '🤲 SELAMAT BERGABUNG',
                    value:
                        'Selamat bergabung di **PADEPOKAN NJAM**.\n' +
                        '✨ *Semoga betah, nyaman, dan dapat beraktivitas dengan baik di sini.*'
                }
            )
            .setFooter({
                text: 'SATPAM PADEPOKAN • PENGAWAS SERVER'
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};
