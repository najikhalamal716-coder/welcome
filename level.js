const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, 'levels.json');
const levelFileAlt = path.join(__dirname, 'data', 'levels.json');

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
        .setName('level')
        .setDescription('Cek level kamu')
        .addUserOption(opt => opt.setName('user').setDescription('Cek user lain').setRequired(false)),

    async execute(interaction) {
        let levels = {};
        try {
            if (fs.existsSync(levelFile)) {
                levels = JSON.parse(fs.readFileSync(levelFile, 'utf8'));
            } else if (fs.existsSync(levelFileAlt)) {
                levels = JSON.parse(fs.readFileSync(levelFileAlt, 'utf8'));
            } else {
                return interaction.reply({ content: '❌ File levels.json tidak ditemukan bos! Push dulu ke GitHub!', flags: 64 });
            }
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ Data level sedang mengalami masalah.', flags: 64 });
        }

        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guild.id;
        
        // SUPPORT 2 FORMAT KEY: PAKAI - DAN _
        let data = levels[`${guildId}-${target.id}`] || levels[`${guildId}_${target.id}`];
        
        // CARI JUGA LEWAT VALUES KALO KEY GA KETEMU
        if (!data) {
            data = Object.values(levels).find(v => v.userId === target.id && v.guildId === guildId);
        }

        if (!data) {
            return interaction.reply({ content: `❌ ${target.username} belum ada data level! Chat dulu bos!`, flags: 64 });
        }

        const currentXP = data.xp || 0;
        const currentLevel = getLevelFromXP(currentXP);
        const nextLevelReq = levelRequirements.find(r => r.level === currentLevel + 1);
        const nextXP = nextLevelReq ? nextLevelReq.xp : currentXP;
        const needed = nextLevelReq ? nextXP - currentXP : 0;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Level - ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `〔 📜 PERKEMBANGAN PADEPOKAN 〕\n\n` +
                `**${target.username}** telah mencapai tingkat baru.\n\n` +
                `✦ LEVEL ${String(currentLevel).padStart(2, '0')}\n` +
                `✦ ${currentXP} XP\n` +
                (nextLevelReq ? `✦ Butuh ${needed} XP lagi untuk Level ${currentLevel + 1}\n\n` : `\n`) +
                `“Jejak baru tercatat dalam perjalananmu, Terimakasih sudah aktif.”\n\n` +
                `BOT PADEPOKAN • SISTEM SERVER`
            )
            .setColor(0x2f3136)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
