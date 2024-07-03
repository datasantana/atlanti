<template>
  <v-app>
    <v-app-bar class="bg-secondary" :elevation="0">
      <v-img :src="logo" max-height="35" max-width="150" class="mr-0"></v-img>
      <v-toolbar-title color="accent">{{ title }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon color="error">mdi-information</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main class="router-container">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      logo: require('@/assets/alcaldia-de-maracaibo-logo-web.png'), // Add your logo here
    };
  },
  methods: {

  },
  computed: {
    title() {
      return this.$store.state.selectedMap ? this.$store.state.selectedMap.title : 'Visor Consulta Ciudadana'; // Change the title of the app
    },
  },
};
</script>

<style scoped>
.router-container {
  height: calc(100vh - 64px); /* Adjust as needed */
}
.overflow-y-auto {
  overflow-y: auto;
  max-height: 450px; /* Adjust this value as needed */
}

.wrap-text pre {
  white-space: pre-wrap;       /* CSS 3 */
  /*white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  /*white-space: -pre-wrap;      /* Opera 4-6 */
  /*white-space: -o-pre-wrap;    /* Opera 7 */
  /*word-wrap: break-word;       /* Internet Explorer 5.5+ */
}

.custom-class {
    background: rgb(var(--v-theme-secondary));
    color: rgba(var(--v-theme-on-bodytext), 0.9)
  }

</style>
