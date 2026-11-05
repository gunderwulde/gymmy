import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "../styles.css";

createApp(App).use(createPinia()).mount("#app");

if (import.meta.env.DEV) {
  void import("./devSeed").then(({ installDevSeed }) => installDevSeed());
}
