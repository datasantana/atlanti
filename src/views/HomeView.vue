<template>
  <div class="home">
    <MapCatalog :maps="maps" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import MapCatalog from '@/components/MapCatalog.vue';

export default {
  name: 'HomeView',
  components: {
    MapCatalog,
  },
  computed: {
    ...mapState(['maps']),
  },
  mounted() {
    this.$store.dispatch('fetchMaps');
  },
  beforeRouteEnter(to, from, next) {
  next(vm => {
    vm.$store.commit('clearSelectedMap');
  });
},
  // props, data, methods...
};
</script>
