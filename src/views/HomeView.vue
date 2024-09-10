<template>
  <CatalogComponent />
  <v-footer app class="d-flex flex-column pa-0 ma-0 bg-primary on-primary">
    <v-container fluid>
      <v-row justify="center" no-gutters>
        <p>&copy; {{ new Date().getFullYear() }} | <strong><a href="https://www.geostudio.com.co/"> GeoStudio </a></strong> | Alcaldía de Maracaibo</p>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
import { defineComponent } from 'vue';
import CatalogComponent from '@/components/CatalogComponent.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    CatalogComponent,
  },
});
</script>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}

.app-footer {
  grid-row-start: 3;
  grid-column-start: 1;
  grid-column-end: 4;
}
</style>