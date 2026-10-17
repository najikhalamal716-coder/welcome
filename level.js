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

function getNextLevelXP(level) {
    const nextLevel = levelRequirements.find(
        requirement => requirement.level === level + 1
    );

    if (!nextLevel) {
        return null;
    }

    return nextLevel.xp;
}

function createProgressBar(currentXP, currentLevel) {

    const currentRequirement =
        levelRequirements.find(
            requirement => requirement.level === currentLevel
        );

    const nextXP = getNextLevelXP(currentLevel);

    if (!nextXP) {
        return '━━━━━━━━━━━━━━━━━━━━';
    }

    const currentLevelXP = currentRequirement.xp;

    const progressXP = currentXP - currentLevelXP;
    const requiredXP = nextXP - currentLevelXP;

    let percentage =
        progressXP / requiredXP;

    if (percentage < 0) {
        percentage = 0;
    }

    if (percentage > 1) {
        percentage = 1;
    }

    const totalBlocks = 10;

    const filledBlocks =
        Math.floor(percentage * totalBlocks);

    const emptyBlocks =
        totalBlocks - filledBlocks;

    return (
        '▰'.repeat(filledBlocks) +
        '▱'.repeat(emptyBlocks)
    );
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription(
            'Melihat level dan XP kamu'
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
                    '❌ Data level sedang mengalami masalah.',
                ephemeral: true
            });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const userKey =
            guildId + '-' + userId;

        const userData = levels[userKey];

        if (!userData) {

            return interaction.reply({
                content:
                    '📜 Kamu belum memiliki XP. Kirim pesan di server untuk mulai mendapatkan XP!',
                ephemeral: true
            });
        }

        const xp = userData.xp;
        const level = getLevelFromXP(xp);

        const nextXP =
            getNextLevelXP(level);

        const progressBar =
            createProgressBar(
                xp,
                level
            );

        let progressText;

        if (nextXP) {

            const remainingXP =
                nextXP - xp;

            progressText =
                progressBar +
                '\n' +
                xp +
                ' / ' +
                nextXP +
                ' XP\n\n' +
                '✦ XP menuju LEVEL ' +
                String(level + 1).padStart(2, '0') +
                ': **' +
                remainingXP +
                ' XP**';

        } else {

            progressText =
                progressBar +
                '\n' +
                xp +
                ' XP\n\n' +
                '✦ **LEVEL MAKSIMAL TERCAPAI**';
        }

        const levelEmbed =
            new EmbedBuilder()
                .setDescription(
                    '〔 📜 LEVEL PADEPOKAN 〕\n\n' +
                    '👤 **' +
                    interaction.member.displayName +
                    '**\n\n' +
                    '✦ **LEVEL ' +
                    String(level).padStart(2, '0') +
                    '**\n' +
                    '✦ **' +
                    xp +
                    ' XP**\n\n' +
                    progressText +
                    '\n\n' +
                    '**BOT PADEPOKAN • SISTEM SERVER**'
                )
                .setColor(0x2f3136);

        await interaction.reply({
            embeds: [levelEmbed]
        });
    }
};