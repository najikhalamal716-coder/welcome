const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claimrole')
        .setDescription('Pilih role member'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🎫  CLAIM ROLE')
            .setDescription(
                '**PADEPOKAN NJAM**\n' +
                '━━━━━━━━━━━━━━━━━━━━\n\n' +

                'Selamat datang di **PADEPOKAN NJAM**.\n\n' +

                'Sebelum mulai beraktivitas, silakan pilih salah satu role di bawah ini sesuai dengan identitasmu.\n\n' +

                '👨 **LAKI-LAKI**\n' +
                'Pilih tombol **Laki-Laki** untuk mendapatkan role tersebut.\n\n' +

                '👩 **PEREMPUAN**\n' +
                'Pilih tombol **Perempuan** untuk mendapatkan role tersebut.\n\n' +

                '━━━━━━━━━━━━━━━━━━━━\n' +
                '⚠️ **CATATAN**\n\n' +

                '• Kamu hanya dapat memiliki **satu role**.\n' +
                '• Jika memilih role lain, role sebelumnya akan otomatis dilepas.\n' +
                '• Pastikan pilihanmu sudah sesuai.\n\n' +

                '📖 Setelah mendapatkan role, silakan membaca **Rules** server sebelum beraktivitas.'
            )
            .setFooter({
                text: 'SATPAM PADEPOKAN • PENGAWAS SERVER'
            });

        const row = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('claim_laki')
                    .setLabel('Laki-Laki')
                    .setEmoji('👨')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('claim_perempuan')
                    .setLabel('Perempuan')
                    .setEmoji('👩')
                    .setStyle(ButtonStyle.Primary)

            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};