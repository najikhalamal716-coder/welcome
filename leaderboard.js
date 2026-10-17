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
    for(let i=0;i<req.length;i++){ if(xp>=req[i]) lvl=i+1; }
    return lvl;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Lihat papan peringkat level'),
    async execute(interaction) {
        let levels={};
        try {
            for(const p of possiblePaths){
                if(fs.existsSync(p)){ 
                    levels=JSON.parse(fs.readFileSync(p,'utf8')); 
                    break; 
                }
            }
        } catch { return interaction.reply({content:'❌ Data error.', flags:64}); }

        const guildData = Object.values(levels).filter(d=>d.guildId===interaction.guild.id).sort((a,b)=>b.xp-a.xp).slice(0,6);
        if(!guildData.length) return interaction.reply({content:'📜 Belum ada data level. Chat dulu!', flags:64});

        let desc = `〔 🏆 LEADERBOARD PADEPOKAN 〕\n\n`;

        for(let i=0;i<guildData.length;i++){
            const d = guildData[i];
            const lvl = getLevelFromXP(d.xp);
            const icon = i===0?'🥇' : i===1?'🥈' : i===2?'🥉' : `**${i+1}**`;

            try {
                // AMBIL DISPLAY NAME BOS
                const member = await interaction.guild.members.fetch(d.userId).catch(()=>null);
                const user = member ? member.user : await interaction.client.users.fetch(d.userId);
                
                // PRIORITAS: Nickname Server > Display Name Global > Username
                const displayName = member?.displayName || user.globalName || user.displayName || user.username;

                desc += `${icon} ${displayName}\n✦ LEVEL ${String(lvl).padStart(2,'0')} • ${d.xp} XP\n\n`;
            } catch {
                desc += `${icon} <@${d.userId}>\n✦ LEVEL ${String(lvl).padStart(2,'0')} • ${d.xp} XP\n\n`;
            }
        }

        // Posisi kamu
        const sortedAll = Object.values(levels).filter(d=>d.guildId===interaction.guild.id).sort((a,b)=>b.xp-a.xp);
        const myIndex = sortedAll.findIndex(d=>d.userId===interaction.user.id);
        if(myIndex!==-1){
            const myData = sortedAll[myIndex];
            const myLvl = getLevelFromXP(myData.xp);
            desc += `────────────────────\n\n👤 **Posisi Kamu**\n#${myIndex+1} • LEVEL ${String(myLvl).padStart(2,'0')} • ${myData.xp} XP\n\n`;
        }

        desc += `**BOT PADEPOKAN • SISTEM SERVER**`;

        const embed = new EmbedBuilder()
            .setDescription(desc)
            .setColor(0x2f3136)
            .setTimestamp();

        await interaction.reply({embeds:[embed]});
    }
};
