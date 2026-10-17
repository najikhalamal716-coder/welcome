async function createWelcomeImage(member, type) {
    const bgPath = path.join(__dirname, 'assets', type === 'join' ? 'welcome-bg.png' : 'goodbye-bg.png');
    const background = await loadImage(bgPath);

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // AVATAR - PAS TENGAH LINGKARAN
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.50;
    const avatarRadius = canvas.width * 0.195;
    
    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 1024 });
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, centerX - avatarRadius, centerY - avatarRadius, avatarRadius*2, avatarRadius*2);
        ctx.restore();
    } catch (e) { console.log(e) }

    // USERNAME - PAKAI FONT AMAN ANTI KOTAK
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E9C57A';
    // PAKAI SANS BIAR GAK KOTAK-KOTAK
    ctx.font = `bold ${Math.floor(canvas.width * 0.055)}px Sans`;
    
    // Bersihin username dari karakter aneh
    let username = member.user.username.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().substring(0, 18);
    if(!username) username = 'MEMBER BARU';
    
    // Kasih shadow biar mewah
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(username, centerX, canvas.height * 0.815);
    ctx.shadowBlur = 0;

    return canvas.toBuffer('image/png');
}
