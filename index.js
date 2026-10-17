const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const LEVEL_CHANNEL_ID = '1555838676150394911';
const levelsFile = '/app/data/levels.json';
let levels = {};
if (fs.existsSync(levelsFile)) {
  levels = JSON.parse(fs.readFileSync(levelsFile, 'utf8'));
}
const cooldowns = new Set();

function getLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

client.once('ready', async () => {
  console.log(`✅ Bot Online sebagai ${client.user.tag}`);
  const commands = [
    { name: 'level', description: 'Cek level kamu' },
    { name: 'leaderboard', description: 'Top 10 member teraktif' }
  ];
  await client.application.commands.set(commands);
  console.log('✅ Slash command terdaftar!');
});

// SISTEM XP - GAK GUE UBAH SAMA SEKALI
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (cooldowns.has(message.author.id)) return;

  const key = `${message.guild.id}-${message.author.id}`;
  if (!levels[key]) levels[key] = { xp: 0, level: 0 };

  const oldLevel = levels[key].level;
  const xpToAdd = Math.floor(Math.random() * 11) + 5;
  levels[key].xp += xpToAdd;
  levels[key].level = getLevel(levels[key].xp);

  if (levels[key].level > oldLevel) {
    const channel = await client.channels.fetch(LEVEL_CHANNEL_ID).catch(() => null);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 LEVEL UP!')
        .setDescription(`Selamat <@${message.author.id}>! Kamu telah mencapai **Level ${levels[key].level}**!`)
        .setThumbnail(message.author.displayAvatarURL());
      channel.send({ embeds: [embed] });
    }
  }

  fs.writeFileSync(levelsFile, JSON.stringify(levels, null, 2));
  cooldowns.add(message.author.id);
  setTimeout(() => cooldowns.delete(message.author.id), 60000);
});

// INI YANG GUE UBAH JADI EMBED CAKEP BOS!
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const key = `${interaction.guild.id}-${interaction.user.id}`;

  if (interaction.commandName === 'level') {
    if (!levels[key]) levels[key] = { xp: 0, level: 0 };
    const nextXp = Math.pow((levels[key].level + 1) / 0.1, 2);
    const currentXp = levels[key].xp;
    const nextLevelXp = Math.floor(nextXp);
    
    // Progress bar
    const percent = Math.min((currentXp / nextXp) * 100, 100);
    const progress = Math.floor(percent / 10);
    const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({ name: `Level Card - ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`**Level:** ${levels[key].level}\n**XP:** ${currentXp} / ${nextLevelXp}\n\n${bar} **${Math.floor(percent)}%**\n\n> Terus aktif chat biar cepet naik level! 🔥`)
      .setFooter({ text: `Requested by ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'leaderboard') {
    const guildLevels = Object.entries(levels).filter(([k]) => k.startsWith(interaction.guild.id));
    const sorted = guildLevels.sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);
    let desc = sorted.map((l, i) => `**${i+1}.** <@${l[0].split('-')[1]}> - Level ${l[1].level} (${l[1].xp} XP)`).join('\n');
    if (!desc) desc = 'Belum ada data level!';
    const embed = new EmbedBuilder().setTitle('🏆 LEADERBOARD').setDescription(desc).setColor('#FFD700');
    await interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
