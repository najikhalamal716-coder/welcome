const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ==================================================
// 1. KONFIGURASI BOT PADEPOKAN NJAM
// ==================================================

const LEVEL_CHANNEL_ID = '1555838676150394911';
const WELCOME_CHANNEL_ID = '1550581721538494547';
const CLAIM_CHANNEL_ID = '1550728594421055648';

const DATA_DIR = '/app/data';
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');

const XP_MIN = 5;
const XP_MAX = 15;
const COOLDOWN_MS = 60_000;

const COLORS = {
    gold: 0xD4AF37,
    dark: 0x202124,
    silver: 0xC0C0C0,
    bronze: 0xCD7F32
};

const FOOTER_TEXT = 'BOT PADEPOKAN • SYSTEM SERVER';

console.log('🚀 INDEX.JS MULAI DIJALANKAN');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Map();

// ==================================================
// 2. MEMUAT COMMAND DARI FOLDER commands
// ==================================================

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of files) {
        try {
            const filePath = path.join(commandsPath, file);

            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Command dimuat: ${command.data.name}`);
            } else {
                console.warn(`⚠️ Format command tidak sesuai: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Gagal memuat ${file}:`, error);
        }
    }
} else {
    console.warn('⚠️ Folder commands tidak ditemukan.');
}

// ==================================================
// 3. SISTEM PENYIMPANAN XP
// ==================================================

fs.mkdirSync(DATA_DIR, { recursive: true });

let levels = {};

if (fs.existsSync(LEVELS_FILE)) {
    try {
        const rawData = fs.readFileSync(LEVELS_FILE, 'utf8');
        levels = JSON.parse(rawData);

        if (
            !levels ||
            typeof levels !== 'object' ||
            Array.isArray(levels)
        ) {
            throw new Error('Format levels.json tidak valid.');
        }

        console.log(
            `✅ Data XP dimuat: ${Object.keys(levels).length} record.`
        );
    } catch (error) {
        console.error(
            '❌ levels.json gagal dibaca. Bot dihentikan untuk melindungi data:',
            error
        );
        process.exit(1);
    }
} else {
    console.log('ℹ️ levels.json belum ada; file akan dibuat saat penyimpanan.');
}

function saveLevels() {
    const tempFile = `${LEVELS_FILE}.tmp`;

    try {
        fs.writeFileSync(
            tempFile,
            JSON.stringify(levels, null, 2),
            'utf8'
        );

        fs.renameSync(tempFile, LEVELS_FILE);
    } catch (error) {
        console.error('❌ Gagal menyimpan data XP:', error);

        try {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (cleanupError) {
            console.error('Gagal membersihkan file sementara:', cleanupError);
        }
    }
}

function getMemberKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

function ensureMemberData(key, guildId, userId) {
    if (!levels[key] || typeof levels[key] !== 'object') {
        levels[key] = {
            guildId,
            userId,
            xp: 0,
            level: 0,
            totalChats: 0
        };
    }

    const data = levels[key];

    data.guildId = data.guildId || guildId;
    data.userId = data.userId || userId;

    const parsedXP = Number(data.xp);
    const parsedChats = Number(data.totalChats);

    data.xp = Number.isFinite(parsedXP)
        ? Math.max(0, parsedXP)
        : 0;

    data.totalChats = Number.isFinite(parsedChats)
        ? Math.max(0, parsedChats)
        : 0;

    data.level = getLevel(data.xp);

    return data;
}

// ==================================================
// 4. LEVEL PROGRESIF
// Level 1 = 50 XP
// Level 2 = 105 XP
// Level 3 = 165 XP
// Level 4 = 230 XP
// ==================================================

function getXPForLevel(level) {
    if (level <= 0) return 0;

    return (
        50 * level +
        (5 * level * (level - 1)) / 2
    );
}

function getNextLevelXP(level) {
    return getXPForLevel(level + 1);
}

function getLevel(xp) {
    let level = 0;

    while (xp >= getXPForLevel(level + 1)) {
        level++;
    }

    return level;
}

function getGuildRanking(guildId) {
    const prefix = `${guildId}-`;

    return Object.entries(levels)
        .filter(([key, data]) => {
            return (
                key.startsWith(prefix) ||
                data.guildId === guildId
            );
        })
        .map(([key, data]) => ({
            key,
            userId: data.userId || key.slice(prefix.length),
            xp: Math.max(0, Number(data.xp) || 0),
            level: getLevel(Math.max(0, Number(data.xp) || 0)),
            totalChats: Math.max(0, Number(data.totalChats) || 0)
        }))
        .sort((a, b) =>
            b.level - a.level ||
            b.xp - a.xp ||
            b.totalChats - a.totalChats
        );
}

function getMemberRank(guildId, userId) {
    const ranking = getGuildRanking(guildId);

    const index = ranking.findIndex(
        member => member.userId === userId
    );

    return index === -1 ? '-' : index + 1;
}

function createProgress(xp, level) {
    const currentXP = getXPForLevel(level);
    const nextXP = getNextLevelXP(level);

    const gained = xp - currentXP;
    const needed = nextXP - currentXP;

    const percent = Math.max(
        0,
        Math.min(100, (gained / needed) * 100)
    );

    const filled = Math.floor(percent / 10);
    const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);

    return {
        bar,
        percent: percent.toFixed(1),
        gained,
        needed
    };
}

function createLevelUpEmbed(member, data, rank) {
    const progress = createProgress(data.xp, data.level);

    return new EmbedBuilder()
        .setColor(COLORS.gold)
        .setAuthor({
            name: 'PERKEMBANGAN PADEPOKAN'
        })
        .setTitle('🏯 PENCAPAIAN BARU')
        .setDescription(
            `Selamat, ${member}!\n` +
            `Perjalananmu di **PADEPOKAN NJAM** terus berkembang.`
        )
        .addFields(
            {
                name: 'LEVEL BARU',
                value: `**LEVEL ${String(data.level).padStart(2, '0')}**`,
                inline: true
            },
            {
                name: 'TOTAL XP',
                value: `**${data.xp.toLocaleString('id-ID')} XP**`,
                inline: true
            },
            {
                name: 'PERINGKAT SERVER',
                value: `**#${rank}**`,
                inline: true
            },
            {
                name: 'PROGRES LEVEL',
                value:
                    `${progress.bar} ${progress.percent}%\n` +
                    `${progress.gained} / ${progress.needed} XP`,
                inline: false
            },
            {
                name: 'AKTIVITAS CHAT',
                value: `**${data.totalChats.toLocaleString('id-ID')} pesan**`,
                inline: true
            }
        )
        .setFooter({ text: FOOTER_TEXT })
        .setTimestamp();
}

function createLevelEmbed(member, data, rank) {
    const progress = createProgress(data.xp, data.level);

    return new EmbedBuilder()
        .setColor(COLORS.gold)
        .setAuthor({
            name: 'STATUS PERKEMBANGAN'
        })
        .setTitle(`🏯 LEVEL ${String(data.level).padStart(2, '0')}`)
        .setDescription(
            `Profil perkembangan **${member.user.username}**`
        )
        .addFields(
            {
                name: 'LEVEL',
                value: `**${data.level}**`,
                inline: true
            },
            {
                name: 'PERINGKAT',
                value: `**#${rank}**`,
                inline: true
            },
            {
                name: 'TOTAL XP',
                value: `**${data.xp.toLocaleString('id-ID')} XP**`,
                inline: true
            },
            {
                name: 'PROGRES LEVEL',
                value:
                    `${progress.bar} ${progress.percent}%\n` +
                    `${progress.gained} / ${progress.needed} XP`,
                inline: false
            },
            {
                name: 'TOTAL CHAT',
                value: `**${data.totalChats.toLocaleString('id-ID')} pesan**`,
                inline: true
            }
        )
        .setFooter({ text: FOOTER_TEXT })
        .setTimestamp();
}

function createLeaderboardEmbed(guildId, guildName) {
    const ranking = getGuildRanking(guildId).slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];

    const description = ranking.length
        ? ranking.map((member, index) => {
            const medal = medals[index] || `**${index + 1}.**`;

            return (
                `${medal} <@${member.userId}>\n` +
                `└ Level **${member.level}** · ` +
                `**${member.xp.toLocaleString('id-ID')} XP** · ` +
                `💬 ${member.totalChats.toLocaleString('id-ID')} chat`
            );
        }).join('\n\n')
        : 'Belum ada data perkembangan member.';

    return new EmbedBuilder()
        .setColor(COLORS.gold)
        .setAuthor({
            name: 'PADEPOKAN NJAM • RANKING'
        })
        .setTitle('🏆 LEADERBOARD')
        .setDescription(description)
        .setFooter({
            text: `${FOOTER_TEXT} • TOP 10`
        })
        .setTimestamp();
}

// ==================================================
// 5. SLASH COMMAND LEVEL & LEADERBOARD
// ==================================================

const levelCommand = new SlashCommandBuilder()
    .setName('level')
    .setDescription('Lihat perkembangan level dan XP kamu.');

const leaderboardCommand = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat 10 member dengan level tertinggi.');

async function registerCommands() {
    const commandsToRegister = [
        ...[...client.commands.values()]
            .filter(command =>
                command.data &&
                typeof command.data.toJSON === 'function'
            )
            .map(command => command.data.toJSON()),
        levelCommand.toJSON(),
        leaderboardCommand.toJSON()
    ];

    // Perbarui command yang sudah ada tanpa menghapus
    // command lain yang tidak dimuat dari folder commands.
    const existing = await client.application.commands.fetch();

    for (const commandData of commandsToRegister) {
        const current = existing.find(
            command => command.name === commandData.name
        );

        if (current) {
            await client.application.commands.edit(
                current.id,
                commandData
            );
        } else {
            await client.application.commands.create(commandData);
        }
    }

    console.log('✅ Slash command berhasil diperiksa dan didaftarkan.');
}

// ==================================================
// 6. BOT SIAP
// ==================================================

client.once('ready', async () => {
    console.log(`✅ Bot Online sebagai ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: 'SISTEM SERVER' }],
        status: 'online'
    });

    try {
        await registerCommands();
    } catch (error) {
        console.error('❌ Gagal mendaftarkan slash command:', error);
    }

    console.log('🟢 Sistem welcome dan XP siap dijalankan.');
});

// ==================================================
// 7. SISTEM XP DAN PENGHITUNG CHAT
// ==================================================

const xpCooldown = new Map();

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    const key = getMemberKey(
        message.guild.id,
        message.author.id
    );

    const data = ensureMemberData(
        key,
        message.guild.id,
        message.author.id
    );

    const oldLevel = getLevel(data.xp);

    // Setiap pesan member dihitung sebagai aktivitas chat.
    // Cooldown hanya membatasi pemberian XP.
    data.totalChats++;

    const now = Date.now();
    const lastXP = xpCooldown.get(key) || 0;

    if (now - lastXP >= COOLDOWN_MS) {
        const earnedXP =
            Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) +
            XP_MIN;

        data.xp += earnedXP;
        data.level = getLevel(data.xp);

        xpCooldown.set(key, now);

        if (data.level > oldLevel) {
            try {
                const levelChannel =
                    await client.channels.fetch(LEVEL_CHANNEL_ID);

                if (levelChannel && levelChannel.isTextBased()) {
                    const rank = getMemberRank(
                        message.guild.id,
                        message.author.id
                    );

                    await levelChannel.send({
                        embeds: [
                            createLevelUpEmbed(
                                message.member,
                                data,
                                rank
                            )
                        ]
                    });
                } else {
                    console.warn('⚠️ Channel level tidak ditemukan.');
                }
            } catch (error) {
                console.error(
                    '❌ Gagal mengirim notifikasi level-up:',
                    error
                );
            }
        }
    }

    saveLevels();
});

// ==================================================
// 8. WELCOME MEMBER BARU
// ==================================================

client.on('guildMemberAdd', async member => {
    try {
        const channel = await client.channels.fetch(
            WELCOME_CHANNEL_ID
        );

        if (!channel || !channel.isTextBased()) {
            console.warn('⚠️ Channel welcome tidak ditemukan.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.gold)
            .setTitle('🏯 INFORMASI MEMBER BARU')
            .setDescription(
                `SELAMAT DATANG DI **PADEPOKAN NJAM**\n\n` +
                `Sugeng rawuh, ${member}!\n` +
                `Selamat bergabung bersama keluarga Padepokan.\n\n` +
                `**1. PILIH ROLE MEMBER**\n` +
                `Silakan menuju <#${CLAIM_CHANNEL_ID}> dan pilih role yang sesuai.\n\n` +
                `**2. BACA PERATURAN**\n` +
                `Pahami peraturan server sebelum beraktivitas.\n\n` +
                `**3. NIKMATI KEBERSAMAAN**\n` +
                `Berinteraksi dengan sopan dan hormati seluruh anggota.\n\n` +
                `Role member diperlukan untuk memperoleh akses ke kanal yang dibatasi.`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({
                text: 'Welcome Aboard and Enjoy the Server.'
            })
            .setTimestamp();

        await channel.send({
            content: `${member}`,
            embeds: [embed]
        });

        console.log(`🟢 Member bergabung: ${member.user.tag}`);
    } catch (error) {
        console.error('❌ Gagal mengirim welcome:', error);
    }
});

// ==================================================
// 9. NOTIFIKASI MEMBER KELUAR
// ==================================================

client.on('guildMemberRemove', async member => {
    try {
        const channel = await client.channels.fetch(
            WELCOME_CHANNEL_ID
        );

        if (!channel || !channel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('👋 MEMBER MENINGGALKAN PADEPOKAN')
            .setDescription(
                `**${member.user.tag}** telah meninggalkan PADEPOKAN NJAM.`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: FOOTER_TEXT })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        console.log(`🔴 Member keluar: ${member.user.tag}`);
    } catch (error) {
        console.error('❌ Gagal mengirim notifikasi keluar:', error);
    }
});

// ==================================================
// 10. TOMBOL CLAIM ROLE
// ==================================================

client.on('interactionCreate', async interaction => {
    try {
        // Penanganan tombol claim role.
        if (interaction.isButton()) {
            const customId = interaction.customId;

            let targetRoleName = null;
            let oppositeRoleName = null;

            if (
                customId === 'claim_laki' ||
                customId === 'claim_laki-laki'
            ) {
                targetRoleName = 'Laki-Laki';
                oppositeRoleName = 'Perempuan';
            } else if (
                customId === 'claim_perempuan'
            ) {
                targetRoleName = 'Perempuan';
                oppositeRoleName = 'Laki-Laki';
            } else {
                return;
            }

            if (!interaction.guild || !interaction.member) {
                await interaction.reply({
                    content: '❌ Tombol ini hanya bisa digunakan di server.',
                    ephemeral: true
                });
                return;
            }

            const targetRole = interaction.guild.roles.cache.find(
                role => role.name.includes(targetRoleName)
            );

            const oppositeRole = interaction.guild.roles.cache.find(
                role => role.name.includes(oppositeRoleName)
            );

            if (!targetRole) {
                await interaction.reply({
                    content: `❌ Role ${targetRoleName} tidak ditemukan. Periksa nama role di server.`,
                    ephemeral: true
                });
                return;
            }

            const botMember = interaction.guild.members.me;

            if (
                !botMember ||
                !botMember.permissions.has('ManageRoles') ||
                targetRole.position >= botMember.roles.highest.position ||
                (
                    oppositeRole &&
                    oppositeRole.position >= botMember.roles.highest.position
                )
            ) {
                await interaction.reply({
                    content:
                        '❌ Bot belum memiliki izin atau posisi role yang cukup. ' +
                        'Pastikan bot punya Manage Roles dan role bot berada di atas role member.',
                    ephemeral: true
                });
                return;
            }

            const member = await interaction.guild.members.fetch(
                interaction.user.id
            );

            if (member.roles.cache.has(targetRole.id)) {
                await interaction.reply({
                    content: `Kamu sudah memiliki role ${targetRole.name}.`,
                    ephemeral: true
                });
                return;
            }

            if (
                oppositeRole &&
                member.roles.cache.has(oppositeRole.id)
            ) {
                await member.roles.remove(oppositeRole);
            }

            await member.roles.add(targetRole);

            await interaction.reply({
                content: `✅ Role **${targetRole.name}** berhasil dipilih. Selamat datang di PADEPOKAN NJAM!`,
                ephemeral: true
            });

            return;
        }

        if (!interaction.isChatInputCommand()) return;

        // Perintah /level.
        if (interaction.commandName === 'level') {
            const key = getMemberKey(
                interaction.guildId,
                interaction.user.id
            );

            const data = ensureMemberData(
                key,
                interaction.guildId,
                interaction.user.id
            );

            saveLevels();

            const rank = getMemberRank(
                interaction.guildId,
                interaction.user.id
            );

            await interaction.reply({
                embeds: [
                    createLevelEmbed(
                        interaction.member,
                        data,
                        rank
                    )
                ]
            });

            return;
        }

        // Perintah /leaderboard.
        if (interaction.commandName === 'leaderboard') {
            await interaction.reply({
                embeds: [
                    createLeaderboardEmbed(
                        interaction.guildId,
                        interaction.guild.name
                    )
                ]
            });

            return;
        }

        // Perintah lain yang ada di folder commands.
        const command = client.commands.get(
            interaction.commandName
        );

        if (command) {
            await command.execute(interaction, client);
        }
    } catch (error) {
        console.error('❌ Error interaction:', error);

        try {
            if (interaction.isRepliable()) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: 'Terjadi kesalahan saat menjalankan perintah.'
                    });
                } else if (interaction.replied) {
                    await interaction.followUp({
                        content: 'Terjadi kesalahan saat menjalankan perintah.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: 'Terjadi kesalahan saat menjalankan perintah.',
                        ephemeral: true
                    });
                }
            }
        } catch (replyError) {
            console.error('❌ Gagal mengirim respons error:', replyError);
        }
    }
});

// ==================================================
// 11. PENANGANAN ERROR
// ==================================================

client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled rejection:', error);
});

// ==================================================
// 12. LOGIN BOT
// ==================================================

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error('❌ TOKEN belum diatur di Railway Variables.');
    process.exit(1);
}

client.login(TOKEN).catch(error => {
    console.error('❌ Bot gagal login ke Discord:', error);
});
