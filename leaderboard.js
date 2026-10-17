const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const possiblePaths = [
    path.join(__dirname, 'levels.json'),
    path.join(__dirname, 'level.json'),
    path.join(__dirname, 'data', 'levels.json'),
    path.join(__dirname, 'data', 'level.json')
];

function getLevelFromXP(xp) {
    const req = [0,50,105,210,315,420,525,630,735,845,950,1055,1160,1265,1370,1475,1580,1685,1790,1895,2000,2105,2210,2315,2420];
    let lvl = 1;
    for(let i=0;i<req.length;i++){ if(xp>=req[i]) lvl=i+1; }
    return lvl;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Peringkat XP dan level kamu akan ditampilkan disini'),

    async execute(interaction) {
        let levels = {};
        try {
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    const content = fs.readFileSync(p, 'utf8');
                    levels = content.trim() ? JSON.parse(content) : {};
                    break;
                }
            }
        } catch (e) {
            return interaction.reply({ content: '❌ Data leaderboard error.', flags: 64 });
        }

        const guildId = interaction.guild.id;
        const guildData = Object.values(levels).filter(d => d && d.guildId === guildId && d.userId);

        if (guildData.length === 0) {
            return interaction.reply({ content: '📜 Belum ada data level.', flags: 64 });
        }

        const sorted = guildData.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const top6 = sorted.slice(0, 6);

        let desc = `〔 🏆 LEADERBOARD PADEPOKAN 〕\n\n`;

        for (let i = 0; i < top6.length; i++) {
            const d = top6[i];
            const lvl = getLevelFromXP(d.xp || 0);
            let icon = '';
            if (i === 0) icon = '🥇';
            else if (i === 1) icon = '🥈';
            else if (i === 2) icon = '🥉';
            else icon = `**${i+1}**`;

            try {
                const user = await interaction.client.users.fetch(d.userId);
                const name = user.username;
                // Format persis kayak foto
                if (i < 3) {
                    desc += `${icon} ${name}\n✦ LEVEL ${String(lvl).padStart(2, '0')} • ${d.xp} XP\n\n`;
                } else {
                    desc += `${icon} ${name}\n✦ LEVEL ${String(lvl).padStart(2, '0')} • ${d.xp} XP\n\n`;
                }
            } catch {
                desc += `${icon} <@${d.userId}>\n✦ LEVEL ${String(lvl).padStart(2, '0')} • ${d.xp} XP\n\n`;
            }
        }

        // Cari posisi kamu
        const myIndex = sorted.findIndex(d => d.userId === interaction.user.id);
        if (myIndex !== -1) {
            const myData = sorted[myIndex];
            const myLvl = getLevelFromXP(myData.xp || 0);
            desc += `────────────────────\n\n`;
            desc += `👤 **Posisi Kamu**\n#${myIndex + 1} • LEVEL ${String(myLvl).padStart(2, '0')} • ${myData.xp} XP\n\n`;
        }

        desc += `**BOT PADEPOKAN • SISTEM SERVER**`;

        const embed = new EmbedBuilder()
            .setDescription(desc)
            .setColor(0x2f3136) // warna hitam gelap persis kayak foto lu
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
