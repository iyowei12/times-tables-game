import { QUESTION_POOL } from '../constants/game';

export function getQuestionPool(mode, selectedMultiplier) {
  if (mode === 'targeted') {
    return QUESTION_POOL.filter((question) => question.num1 === selectedMultiplier);
  }

  return QUESTION_POOL;
}

export function generateQuestions(pool, count = 10, lastQuestion = null) {
  const sourcePool = pool.length > 0 ? pool : QUESTION_POOL;
  const batch = [];
  let prev = lastQuestion;

  for (let i = 0; i < count; i += 1) {
    let index;
    let selected;

    do {
      index = Math.floor(Math.random() * sourcePool.length);
      selected = sourcePool[index];
    } while (prev && selected.num1 === prev.num1 && selected.num2 === prev.num2);

    batch.push(selected);
    prev = selected;
  }

  return batch;
}
