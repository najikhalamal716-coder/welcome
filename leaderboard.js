const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const levelFile = path.join(
    __dirname,
    '..',
    'data',
    'levels.json'
);

const levelRequirements = [
    { level: 1, xp: 0 },
    { level: 2, xp: 50 },
    { level: 3, xp: 105 },
    { level: 4, xp: 210 },
    { level: 5, xp: 315 },
    { level: 6, xp: 420 },
    { level: 7, xp: 525 },
    { level: 8, xp: 630 },
    { level: 9, xp: 735 },
    { level: 10, xp: 845 },
    { level: 11, xp: 950 },
    { level: 12, xp: 1055 },
    { level: 13, xp: 1160 },
    { level: 14, xp: 1265 },
    { level: 15, xp: 1370 },
    { level: 16, xp: 1475 },
    { level: 17, xp: 1580 },
    { level: 18, xp: 1685 },
    { level: 19, xp: 1790 },
    { level: 20, xp: 1895 },
    { level: 21, xp: 2000 },
    { level: 22, xp: 2105 },
    { level: 23, xp: 2210 },
    { level: 24, xp: 2315 },
    { level: 25, xp: 2420 },
    { level: 26, xp: 2525 },
    { level: 27, xp: 2630 },
    { level: 28, xp: 2735 },
    { level: 29, xp: 2840 },
    { level: 30, xp: 2945 },
    { level: 31, xp: 3050 },
    { level: 32, xp: 3155 },
    { level: 33, xp: 3260 },
    { level: 34, xp: 3365 },
    { level: 35, xp: 3470 },
    { level: 36, xp: 3575 },
    { level: 37, xp: 3680 },
    { level: 38, xp: 3785 },
    { level: 39, xp: 3890 },
    { level: 40, xp: 3995 }
];

function getLevelFromXP(xp) {

    let currentLevel = 1;

    for (const requirement of levelRequirements) {

        if (xp >= requirement.xp) {
            currentLevel = requirement.level;
        }

    }

    return currentLevel;
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(
            'Melihat peringkat XP member PADEPOKAN NJAM'
        ),

    async execute(interaction) {

        let levels = {};

        try {

            levels = JSON.parse(
                fs.readFileSync(
                    levelFile,
                    'utf8'
                )
            );

        } catch (error) {

            console.error(
                '❌ GAGAL MEMBACA LEVELS.JSON:',
                error
            );

            return interaction.reply({
                content:
                    '❌ Data leaderboard sedang mengalami masalah.',
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;

        const guildMembers = await interaction.guild.members.fetch();

        const guildLevels = Object.values(levels)
            .filter(data => data.guildId === guildId)
            .map(data => {

                const member = guildMembers.get(
                    data.userId
                );

                if (!member) {
                    return null;
                }

                return {
                    userId: data.userId,
                    xp: data.xp,
                    level: getLevelFromXP(data.xp),
                    displayName: member.displayName
                };

            })
            .filter(data => data !== null)
            .sort((a, b) => b.xp - a.xp);

        if (guildLevels.length === 0) {

            return interaction.reply({
                content:
                    '📜 Belum ada data XP member di server.',
                ephemeral: true
            });
        }

        const topMembers =
            guildLevels.slice(0, 10);

        let leaderboardText = '';

        topMembers.forEach((member, index) => {

            let position;

            if (index === 0) {
                position = '🥇';
            } else if (index === 1) {
                position = '🥈';
            } else if (index === 2) {
                position = '🥉';
            } else {
                position =
                    (index + 1) + '️⃣';
            }

            leaderboardText +=
                position +
                ' **' +
                member.displayName +
                '**\n' +
                '　✦ LEVEL ' +
                String(member.level).padStart(2, '0') +
                ' • ' +
                member.xp +
                ' XP\n\n';

        });

        const userIndex =
            guildLevels.findIndex(
                member =>
                    member.userId === interaction.user.id
            );

        let userPositionText =
            'Belum masuk leaderboard.';

        if (userIndex !== -1) {

            const userData =
                guildLevels[userIndex];

            userPositionText =
                '#' +
                (userIndex + 1) +
                ' • LEVEL ' +
                String(userData.level).padStart(2, '0') +
                ' • ' +
                userData.xp +
                ' XP';
        }

        const leaderboardEmbed =
            new EmbedBuilder()
                .setDescription(
                    '〔 🏆 LEADERBOARD PADEPOKAN 〕\n\n' +
                    leaderboardText +
                    '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                    '👤 **Posisi Kamu**\n' +
                    userPositionText +
                    '\n\n' +
                    '**BOT PADEPOKAN • SISTEM SERVER**'
                )
                .setColor(0x2f3136);

        await interaction.reply({
            embeds: [leaderboardEmbed]
        });

    }
};