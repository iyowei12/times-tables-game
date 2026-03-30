import { QUESTION_POOL } from '../constants/game';

export function getQuestionPool(mode, selectedMultiplier) {
  if (mode === 'targeted') {
    return QUESTION_POOL.filter((question) => question.num1 === selectedMultiplier);
  }

  return QUESTION_POOL;
}

export function generateQuestions(pool, count = 10, recentHistory = []) {
  const sourcePool = pool.length > 0 ? pool : QUESTION_POOL;
  const batch = [];
  const maxHistory = Math.min(Math.floor(sourcePool.length / 2), 20);
  
  // 如果傳入的是單一物件（相容舊用法），轉為陣列；若是陣列則複製
  let historyInput = Array.isArray(recentHistory) ? recentHistory : (recentHistory ? [recentHistory] : []);
  const history = [...historyInput].slice(-maxHistory);

  for (let i = 0; i < count; i += 1) {
    let index;
    let selected;
    let attempts = 0;

    do {
      index = Math.floor(Math.random() * sourcePool.length);
      selected = sourcePool[index];
      attempts += 1;
    } while (
      attempts < 50 &&
      history.some((q) => q && q.num1 === selected.num1 && q.num2 === selected.num2)
    );

    batch.push(selected);
    history.push(selected);

    if (history.length > maxHistory) {
      history.shift();
    }
  }

  return batch;
}
