import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './app.scss';

const App = createApp({
  onShow() {},
  onLaunch() {}
});

App.use(createPinia());

export default App;
