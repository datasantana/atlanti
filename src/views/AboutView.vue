<template>
  <div ref="mapContainer" class="map-container">
    <Map v-model="location" :mapLayers="mapLayers" ref="webMap"/>
  </div>
</template>

<script>
import Map from "@/components/OlMap.vue";
import { mapState } from 'vuex';

export default {
  name: "AboutView",
  components: {
    Map
  },
  data() {
    return {
      location: {
          lng: -71.6930587033,
          lat: 10.6775887114,
          bearing: 0,
          pitch: 0,
          zoom: 11.6,
      },
    };
  },
  computed: {
    ...mapState(['mapLayers', 'selectedMap', 'searchFeatures', 'filterFeatures', 'mapDatasets']),
  },
};

</script>

<style scoped>
.map-container {
  flex-grow: 1;
  height: calc(100vh - 64px);
  width: 100%;
  position: relative;
}
</style>
