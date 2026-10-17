const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const possiblePaths = [
    path.join(__dirname, 'levels.json'),
    path.join(__dirname, 'level.json'),
    path.join(__dirname, 'data', 'levels.json'),
    path.join(__dirname, 'data', 'level.json')
];

const levelRequirements = [
    { level: 1, xp: 0 }, { level: 2, xp: 50 }, { level: 3, xp: 105 },
    { level: 4, xp: 210 }, { level: 5, xp: 315 }, { level: 6, xp: 420 },
    { level: 7, xp: 525 }, { level: 8, xp: 630 }, { level: 9, xp: 735 },
    { level: 10, xp: 845 }, { level: 11, xp: 950 }, { level: 12, xp: 1055 },
    { level: 13, xp: 1160 }, { level: 14, xp: 1265 }, { level: 15, xp: 1370 },
    { level: 16, xp: 1475 }, { level: 17, xp: 1580 }, { level: 18, xp: 1685 },
    { level: 19, xp: 1790 }, { level: 20, xp: 1895 }, { level: 21, xp: 2000 },
    { level: 22, xp: 2105 }, { level: 23, xp: 2210 }, { level: 24, xp: 2315 },
    { level: 25, xp: 2420 }, { level: 26, xp: 2525 }, { level: 27, xp: 2630 },
    { level: 28, xp: 2735 }, { level: 29, xp: 2840 }, { level: 30, xp: 2945 },
    { level: 31, xp: 3050 }, { level: 32, xp: 3155 }, { level: 33, xp: 3260 },
    { level: 34, xp: 3365 }, { level: 35, xp: 3470 }, { level: 36, xp: 3575 },
    { level: 37, xp: 3680 }, { level: 38, xp: 3785 }, { level: 39, xp: 3890 },
    { level: 40, xp: 3995 }
];

function getLevelFromXP(xp) {
    let currentLevel = 1;
    for (const r of levelRequirements) {
        if (xp >= r.xp) currentLevel = r.level;
    }
    return currentLevel;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Lihat top 10 level tertinggi di server ini'),

    async execute(interaction) {
        let levels = {};
        let foundPath = null;
        try {
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    foundPath = p;
                    const content = fs.readFileSync(p, 'utf8');
                    levels = content.trim() ? JSON.parse(content) : {};
                    break;
                }
            }
            if (!foundPath) {
                return interaction.reply({ content: '📜 Belum ada data level di server ini. Chat dulu bos!', flags: 64 });
            }
        } catch (e) {
            console.error('Leaderboard error:', e);
            return interaction.reply({ content: '❌ Data leaderboard sedang mengalami masalah.', flags: 64 });
        }

        const guildId = interaction.guild.id;

        // Filter hanya data guild ini + format lu yang pake userId + guildId
        const guildData = Object.values(levels).filter(d => 
            d && d.guildId === guildId && d.userId
        );

        if (guildData.length === 0) {
            return interaction.reply({ content: '📜 Belum ada data level di server ini.', flags: 64 });
        }

        // Sort XP tertinggi
        const sorted = guildData.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);

        // Bikin list
        const list = await Promise.all(sorted.map(async (data, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i+1}.**`;
            const level = getLevelFromXP(data.xp || 0);
            try {
                const user = await interaction.client.users.fetch(data.userId);
                return `${medal} ${user.username} — Level ${level} (${data.xp} XP)`;
            } catch {
                return `${medal} <@${data.userId}> — Level ${level} (${data.xp} XP)`;
            }
        }));

        const embed = new EmbedBuilder()
            .setTitle(`🏆 LEADERBOARD - ${interaction.guild.name}`)
            .setDescription(
                `〔 📜 PAPAN PERINGKAT PADEPOKAN 〕\n\n` +
                list.join('\n') +
                `\n\n“Terus aktif dan ukir namamu di puncak.”\n\nBOT PADEPOKAN • SISTEM SERVER`
            )
            .setColor(0xFFD700)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
