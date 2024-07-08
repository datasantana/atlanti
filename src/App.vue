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
</style>
