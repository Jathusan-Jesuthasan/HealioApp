const emotionEmojiMap = {
  joy: '😊',
  happy: '😊',
  happiness: '😊',
  delighted: '🤗',
  elated: '🤩',
  glad: '🙂',
  sad: '😔',
  sadness: '😔',
  melancholy: '😔',
  down: '😔',
  angry: '😡',
  anger: '😡',
  frustration: '😤',
  annoyed: '😤',
  tired: '😴',
  fatigue: '😴',
  sleepy: '😴',
  exhausted: '🥱',
  neutral: '😐',
  calm: '😌',
  relaxed: '😌',
  serene: '😌',
  fear: '😨',
  afraid: '😨',
  anxious: '😰',
  anxiety: '😰',
  worried: '😰',
  stressed: '😖',
  stress: '😖',
  overwhelmed: '😖',
  surprise: '😲',
  surprised: '😲',
  shocked: '😲',
  excited: '🤩',
  anticipation: '🤩',
  love: '🥰',
  affection: '🥰',
  grateful: '🥰',
  bored: '🥱',
  boredom: '🥱',
  content: '🙂',
  hopeful: '🙂',
};

export const getEmotionEmoji = (emotion, mood, fallback = '🙂') => {
  const normalizedEmotion = (emotion || '').toString().toLowerCase();
  const normalizedMood = (mood || '').toString().toLowerCase();

  if (emotionEmojiMap[normalizedEmotion]) {
    return emotionEmojiMap[normalizedEmotion];
  }

  if (emotionEmojiMap[normalizedMood]) {
    return emotionEmojiMap[normalizedMood];
  }

  return fallback || '🙂';
};
