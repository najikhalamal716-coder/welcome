const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const possiblePaths = [
    path.join(__dirname, 'levels.json'),
    path.join(__dirname, 'level.json'),
    path.join(__dirname, 'data', 'levels.json')
];

function getLevelFromXP(xp) {
    const req = [0,50,105,210,315,420,525,630,735,845,950,1055,1160,1265,1370,1475,1580,1685,1790,1895,2000];
    let lvl = 1;
    let nextXP = req[1];
    for(let i=0;i<req.length;i++){
        if(xp>=req[i]){
            lvl=i+1;
            nextXP = req[i+1] || req[i];
        }
    }
    const currentReq = req[lvl-1] || 0;
    return { level: lvl, nextXP, currentReq };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Lihat level kamu')
        .addUserOption(o=>o.setName('user').setDescription('Lihat orang lain').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(()=>null);
        const displayName = member?.displayName || targetUser.globalName || targetUser.username;

        let levels={};
        try {
            for(const p of possiblePaths){
                if(fs.existsSync(p)){
                    const raw = fs.readFileSync(p,'utf8').trim();
                    if(raw) levels=JSON.parse(raw);
                    break;
                }
            }
        } catch(e){}

        const key = `${targetUser.id}-${interaction.guild.id}`;
        const data = levels[key] || { xp: 0 };
        const { level, nextXP } = getLevelFromXP(data.xp);

        const embed = new EmbedBuilder()
            .setAuthor({ name: displayName, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`✦ LEVEL ${String(level).padStart(2,'0')} • ${data.xp} / ${nextXP} XP\n\nProgress menuju level selanjutnya!`)
            .setColor(0x2f3136)
            .setThumbnail(targetUser.displayAvatarURL({size:256}))
            .setFooter({ text: `BOT PADEPOKAN • ${displayName}` })
            .setTimestamp();

        await interaction.editReply({embeds:[embed]});
    }
};
