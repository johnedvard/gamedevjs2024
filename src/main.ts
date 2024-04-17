import { MyGame } from '~/Game';

const init = () => {
  new MyGame();
  postMessage({ payload: 'removeLoading' }, '*');
};

init();
