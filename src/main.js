import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  theme: {
    options: { customProperties: true }, // This allows you to use the defined colors as CSS variables
    defaultTheme: 'maracaibo',
    themes: {
      maracaibo: {
        dark: false,
        colors: {
          primary: '#025939',
          secondary: '#F2F2F2',
          accent: '#04BF55',
          error: '#F2BD1D',
          'secondary-darken-1': '#404040',
        },
      }
    },
  },
  components,
  directives,
})


createApp(App).use(store).use(router).use(vuetify).mount('#app')
