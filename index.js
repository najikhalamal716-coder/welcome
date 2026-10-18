
function getXPForLevel(level) {
  if (level <= 1) return 0;

  // Total XP kumulatif untuk mencapai level berikutnya.
  return 50 * (level - 1) + (5 * (level - 1) * (level - 2)) / 2;
}

function getNextLevelXP(level) {
  return getXPForLevel(level + 1);
}

function getLevel(xp) {
  let level = 1;

  while (xp >= getXPForLevel(level + 1)) {
    level++;
  }

  return level;
}
