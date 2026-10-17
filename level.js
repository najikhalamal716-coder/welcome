const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

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
        .addUserOption(o=>o.setName('user').setDescription('Lihat level orang lain').setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // AMBIL DISPLAY NAME BOS - INI KUNCINYA
        const member = await interaction.guild.members.fetch(targetUser.id).catch(()=>null);
        const displayName = member?.displayName || targetUser.globalName || targetUser.displayName || targetUser.username;

        let levels={};
        try {
            for(const p of possiblePaths){
                if(fs.existsSync(p)){
                    levels=JSON.parse(fs.readFileSync(p,'utf8'));
                    break;
                }
            }
        } catch {}

        const key = `${targetUser.id}-${interaction.guild.id}`;
        const data = levels[key] || { xp: 0 };
        const { level, nextXP, currentReq } = getLevelFromXP(data.xp);

        const xpInLevel = data.xp - currentReq;
        const xpNeeded = nextXP - currentReq;
        const percent = Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));

        // BIKIN CARD CANVAS
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        // Avatar
        try {
            const avatarURL = targetUser.displayAvatarURL({extension:'png', size:128});
            const res = await fetch(avatarURL);
            const buf = Buffer.from(await res.arrayBuffer());
            // bulat
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 125, 70, 0, Math.PI*2);
            ctx.clip();
            const { loadImage } = require('@napi-rs/canvas');
            const img = await loadImage(buf);
            ctx.drawImage(img, 30, 55, 140, 140);
            ctx.restore();
        } catch {}

        // Display Name (bukan username)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(displayName, 200, 90);

        // Level Text
        ctx.fillStyle = '#b9bbbe';
        ctx.font = '20px sans-serif';
        ctx.fillText(`LEVEL ${String(level).padStart(2,'0')} • ${data.xp} / ${nextXP} XP`, 200, 125);

        // Progress Bar BG
        ctx.fillStyle = '#4f545c';
        ctx.fillRect(200, 150, 550, 25);

        // Progress Bar Fill
        ctx.fillStyle = '#5865f2';
        ctx.fillRect(200, 150, 550 * (percent/100), 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText(`${Math.floor(percent)}%`, 200, 200);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {name:'level.png'});

        const embed = new EmbedBuilder()
            .setDescription(`✦ **${displayName}**\nLEVEL ${String(level).padStart(2,'0')} • ${data.xp} XP`)
            .setColor(0x2f3136)
            .setImage('attachment://level.png');

        await interaction.reply({embeds:[embed], files:[attachment]});
    }
};
