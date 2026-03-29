export const SOUND_CORRECT = 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3';
export const SOUND_WRONG = 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3';
export const SOUND_FINISH = 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3';
export const BGM_VOLUME = 0.14;

export const QUESTION_POOL = Array.from({ length: 8 }, (_, i) => i + 2).flatMap((num1) =>
  Array.from({ length: 8 }, (_, j) => {
    const num2 = j + 2;
    return { num1, num2, answer: num1 * num2 };
  })
);

export const MULTIPLIER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 2);
