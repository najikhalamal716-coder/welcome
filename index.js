const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './levels.json';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const LEVEL_CHANNEL_ID = '1555838676150394911';
const XP_COOLDOWN = 60 * 1000; // 60 detik
const cooldowns = new Map();

// Load Data
let levels = {};
if (fs.existsSync(path)) {
  levels = JSON.parse(fs.readFileSync(path));
}

function saveData() {
  fs.writeFileSync(path, JSON.stringify(levels, null, 2));
}

function getLevelFromXp(xp) {
  let level = 0;
  while (xp >= getXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

function getXpForLevel(level) {
  // Formula: Makin tinggi makin susah. Lv1=100, Lv2=250, Lv3=450, dst
  return 5 * (level * level) + 50 * level + 100;
}

function createProgressBar(currentXp, level) {
  const nextLevelXp = getXpForLevel(level + 1);
  const prevLevelXp = getXpForLevel(level);
  const needed = nextLevelXp - prevLevelXp;
  const current = currentXp - prevLevelXp;
  const percent = Math.min(Math.floor((current / needed) * 10), 10);
  
  const bar = '█'.repeat(percent) + '░'.repeat(10 - percent);
  return { bar, current, needed, nextLevelXp };
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const userId = message.author.id;
  const key = `${message.guild.id}-${userId}`;

  // Cooldown 60 detik
  if (cooldowns.has(key)) {
    const expiration = cooldowns.get(key) + XP_COOLDOWN;
    if (Date.now() < expiration) return;
  }

  // 5-15 Random XP
  const xpToAdd = Math.floor(Math.random() * 11) + 5;

  if (!levels[key]) {
    levels[key] = { xp: 0, level: 0 };
  }

  const oldLevel = getLevelFromXp(levels[key].xp);
  levels[key].xp += xpToAdd;
  const newLevel = getLevelFromXp(levels[key].xp);

  cooldowns.set(key, Date.now());
  saveData();

  // Kalo Naik Level
  if (newLevel > oldLevel) {
    levels[key].level = newLevel;
    saveData();

    const { bar, nextLevelXp } = createProgressBar(levels[key].xp, newLevel);

    const embed = new EmbedBuilder()
      .setColor('#5865F2') // Gradient biru-ungu Discord
      .setTitle('🎉 LEVEL UP!')
      .setDescription(`Selamat ${message.author}! Kamu telah mencapai **Level ${newLevel}**! ✨\n\nTerima kasih sudah aktif di server, pertahankan ya!`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📊 Total XP', value: `**${levels[key].xp}**`, inline: true },
        { name: '📈 Progress', value: `\`${bar}\` \n ${levels[key].xp} / ${nextLevelXp} XP menuju Level ${newLevel + 1}`, inline: false }
      )
      .setFooter({ text: `Level ${newLevel} • Keep chatting to gain more XP!` })
      .setTimestamp();

    try {
      const levelChannel = await client.channels.fetch(LEVEL_CHANNEL_ID);
      if (levelChannel) {
        levelChannel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.log('Channel level gak ketemu:', err);
    }
  }
});

client.once('ready', () => {
  console.log(`✅ Bot Online sebagai ${client.user.tag}`);
  console.log(`📢 Notif Level Up di channel: ${LEVEL_CHANNEL_ID}`);
});

client.login(process.env.TOKEN);
