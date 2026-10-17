const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Menghapus pesan di channel')
        .addIntegerOption(option =>
            option
                .setName('jumlah')
                .setDescription('Jumlah pesan yang ingin dihapus (1-500)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(500)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const jumlah = interaction.options.getInteger('jumlah');
        const channel = interaction.channel;

        if (!channel || !channel.isTextBased()) {
            return interaction.reply({
                content: 'Command ini hanya dapat digunakan di text channel.',
                ephemeral: true
            });
        }

        const permissions = channel.permissionsFor(interaction.client.user);

        if (!permissions || !permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: 'Bot tidak memiliki permission Manage Messages di channel ini.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        let totalDeleted = 0;
        let remaining = jumlah;

        try {
            while (remaining > 0) {
                const batchSize = Math.min(remaining, 100);

                const deleted = await channel.bulkDelete(batchSize, true);

                totalDeleted += deleted.size;
                remaining -= deleted.size;

                if (deleted.size === 0) {
                    break;
                }

                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            await interaction.editReply(
                'Berhasil menghapus ' + totalDeleted + ' pesan.'
            );

        } catch (error) {
            console.error('CLEAR ERROR:', error);

            await interaction.editReply(
                'Gagal menghapus pesan. Pastikan bot memiliki permission Manage Messages dan Read Message History.'
            );
        }
    }
};