import { WhoopHoop } from "~/Game";

const init = () => {
  new WhoopHoop();
  postMessage({ payload: "removeLoading" }, "*");
};

init();
