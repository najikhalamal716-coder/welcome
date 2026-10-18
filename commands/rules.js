const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Menampilkan peraturan PADEPOKAN NJAM'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('📜 PERATURAN PADEPOKAN NJAM')
            .setDescription(
                '> **Selamat datang di PADEPOKAN NJAM.**\n' +
                '> Sebelum beraktivitas, harap membaca dan memahami seluruh peraturan yang berlaku.\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )

            // BAGIAN I
            .addFields({
                name: '🏯 I. ETIKA & TATA KRAMA',
                value:
                    '**01 · 🤝 Saling Menghormati**\n' +
                    'Hormati seluruh anggota, pengurus, dan tamu server. Dilarang menghina, merendahkan, atau memancing keributan.\n\n' +

                    '**02 · 💬 Jaga Etika Berkomunikasi**\n' +
                    'Gunakan bahasa yang sopan dan wajar. Hindari provokasi, penghinaan, serta percakapan yang sengaja memicu konflik.\n\n' +

                    '**03 · 🚫 Dilarang Spam & Flood**\n' +
                    'Jangan mengirim pesan, emoji, mention, gambar, atau konten yang sama secara berulang hingga mengganggu chat.\n\n' +

                    '**04 · 📢 Dilarang Mention Berlebihan**\n' +
                    'Jangan melakukan mention terhadap anggota, role, atau pengurus secara sembarangan.'
            })

            // BAGIAN II
            .addFields({
                name: '🛡️ II. KETERTIBAN & KEAMANAN',
                value:
                    '**05 · 🔞 Dilarang Mengirim Konten Tidak Pantas**\n' +
                    'Jangan mengirim konten seksual, vulgar, sangat mengganggu, atau materi lain yang tidak sesuai dengan lingkungan server.\n\n' +

                    '**06 · 📂 Gunakan Channel Sesuai Fungsinya**\n' +
                    'Pastikan pembahasan dan konten dikirim pada channel yang sesuai agar server tetap tertata.\n\n' +

                    '**07 · 🎙️ Jaga Ketertiban Voice Channel**\n' +
                    'Jangan mengganggu percakapan atau sengaja membuat suasana voice channel tidak nyaman bagi anggota lain.\n\n' +

                    '**08 · 🛡️ Dilarang Mengganggu & Menargetkan Anggota**\n' +
                    'Jangan melakukan bullying, harassment, atau terus-menerus mengganggu anggota lain.'
            })

            // BAGIAN III
            .addFields({
                name: '⚔️ III. KEAMANAN & TANGGUNG JAWAB',
                value:
                    '**09 · 🔗 Dilarang Membagikan Link Berbahaya**\n' +
                    'Jangan menyebarkan tautan mencurigakan, penipuan, malware, atau tautan yang dapat membahayakan anggota lain.\n\n' +

                    '**10 · 🎭 Dilarang Menyamar**\n' +
                    'Jangan menyamar sebagai pengurus, bot, atau anggota lain dengan tujuan menipu atau membingungkan anggota.\n\n' +

                    '**11 · 🔐 Jaga Privasi**\n' +
                    'Jangan menyebarkan informasi pribadi milik orang lain tanpa izin.\n\n' +

                    '**12 · 🛠️ Dilarang Menyalahgunakan Fitur Server**\n' +
                    'Jangan menyalahgunakan bot, command, role, permission, atau fitur server untuk mengganggu anggota maupun sistem server.\n\n' +

                    '**13 · 🏯 Jaga Nama Baik PADEPOKAN NJAM**\n' +
                    'Jaga sikap dan jangan melakukan tindakan yang dapat mengganggu ketertiban maupun reputasi komunitas.'
            })

            .addFields({
                name: '━━━━━━━━━━━━━━━━━━━━━━━━━━',
                value:
                    '🙏 **PERSETUJUAN**\n' +
                    'Dengan bergabung di **PADEPOKAN NJAM**, kamu dianggap telah membaca, memahami, dan bersedia menaati seluruh peraturan yang berlaku.\n\n' +
                    '⚠️ *Pelanggaran terhadap peraturan dapat dikenakan tindakan moderasi sesuai tingkat pelanggarannya.*'
            })

            .setFooter({
                text: 'SATPAM PADEPOKAN • PENGAWAS SERVER'
            });

        await interaction.reply({
            embeds: [embed]
        });
    },
};
