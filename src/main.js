import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

// Vuetify
import 'vuetify/styles'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'
// Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'; // Import Font Awesome CSS

loadFonts()

createApp(App).use(store).use(router).use(vuetify).mount('#app')
