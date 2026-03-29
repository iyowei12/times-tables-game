export function getPointsForCombo(combo) {
  return 10 + Math.min(combo, 10) * 3;
}

export function getSurvivalTimeLimit(baseTimeLimit, answeredCount) {
  return Math.max(2, baseTimeLimit - Math.floor(answeredCount / 5));
}

export function getResultProfile({ accuracy, maxCombo, score, correctCount, mode }) {
  if (accuracy >= 95 && maxCombo >= 8) {
    return {
      emoji: '👑',
      title: '乘法傳說',
      subtitle: '節奏、速度和準度都超強，幾乎沒有破綻。',
    };
  }

  if (score >= 180 || maxCombo >= 10 || ((mode === 'endless' || mode === 'survival') && correctCount >= 18)) {
    return {
      emoji: '🔥',
      title: '連擊風暴',
      subtitle: '你越打越順，分數一路往上衝。',
    };
  }

  if (accuracy >= 85) {
    return {
      emoji: '🌟',
      title: '心算高手',
      subtitle: '整體表現很穩，已經有高手的感覺了。',
    };
  }

  if (accuracy >= 70 || correctCount >= 8) {
    return {
      emoji: '💪',
      title: '節奏冒險家',
      subtitle: '你抓到節奏了，再多練一下就會更厲害。',
    };
  }

  return {
    emoji: '🌱',
    title: '勇敢練習王',
    subtitle: '每一題都在進步，下一次一定會更強。',
  };
}
