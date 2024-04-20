export const SCORE_KEY = 'score';
export const HIGH_SCORE_KEY = 'high-score';

const keyPrefix = 'Puckit-';
export const setItem = (key: string, value: string) => {
  try {
    localStorage.setItem(keyPrefix + key, value);
  } catch (err) {
    console.error(err);
  }
};

export const getItem = (key: string): string | number | null => {
  let res = null;
  try {
    res = JSON.parse(localStorage.getItem(keyPrefix + key));
  } catch (err) {
    console.error(err);
  }
  return res;
};
