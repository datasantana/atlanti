<template>
  <div v-if="!loading" id="map" >
    <v-snackbar v-model="snackbar" :timeout="2000" variant="flat" color="accent">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
  <div v-else class="loading-spinner">
    <v-row justify="center">
        <v-col cols="12" class="d-flex justify-center">
            <v-progress-circular indeterminate :size="70" color="primary"></v-progress-circular>
        </v-col>
    </v-row>
  </div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { transformExtent } from 'ol/proj';
import { mapState, mapActions, mapMutations } from 'vuex';

export default {
  name: 'MapComponent',
  data: () => ({
    // Component data
    loading: true,
    map: null,
    wmsLayers: [],
    snackbar: false,
    snackbarMessage: '',
  }),
  
  computed: {
    ...mapState(['featuredMap', 'mapLayers', 'addedLayer', 'removedLayer', 'selectedMap', 'cqlFilters'])
  },
  methods: {
    ...mapActions(['getMaps', 'getCategories', 'getDatasets']),
    ...mapMutations(['setSelectedMap']),
    async fetchInitialData() {
      if (!this.mapLayers || this.mapLayers.length === 0) {
        await this.getMaps();
        this.setSelectedMap(this.featuredMap);
      }
      await Promise.all([
        this.getCategories(),
        this.getDatasets()
      ]);

      this.loading = false; // Set loading to false after data is fetched
      this.$nextTick(() => {
        this.initializeMap();
      });
      this.showStatus(this.selectedMap.title);
    },
    showStatus(string) {
      try {
        console.log('Categories and Datasets fetched before MapComponent is created');
        this.snackbarMessage = `${string} cargado con éxito!`;
        this.snackbar = true;
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        this.snackbarMessage = `error al cargar el mapa!`;
        this.snackbar = true;
      }
    },
    initializeMap() {
      // Initialize the map
      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({
            source: new OSM({
              cacheSize: 4096,
            })
          })
        ],
        view: new View({
          center: [0, 0],
          zoom: 2
        })
      });

      // Add initial WMS layers
      this.initializeWMSLayers();
    },
    async initializeWMSLayers() {
      if (!this.map) {
        return; // Ensure map is initialized before updating layers
      }

      // Remove existing WMS layers from the map
      this.wmsLayers.forEach(layer => this.map.removeLayer(layer));
      this.wmsLayers = [];

      // Add new WMS layers based on mapLayers
      for (const layer of this.mapLayers) {
        const wmsLink = layer.dataset.links.find(link => link.link_type === 'OGC:WMS');
        if (wmsLink) {
          const wmsLayer = new TileLayer({
            source: new TileWMS({
              url: wmsLink.url,
              params: { 'LAYERS': layer.dataset.alternate, 'TILED': true },
              serverType: 'geoserver',
              cacheSize: 1000,
            }),
            opacity: layer.opacity,
            visible: layer.visibility,
            zIndex: layer.order, // Set zIndex using layer.order
            pk: layer.dataset.pk
          });
          this.map.addLayer(wmsLayer);
          this.wmsLayers.push(wmsLayer);

          // Fetch WMS capabilities and fit view to extent
          try {
            const response = await fetch(wmsLink.url + '?service=WMS&request=GetCapabilities');
            const text = await response.text();
            const parser = new WMSCapabilities();
            const result = parser.read(text);

            // Extract the extent from the capabilities
            const extent = result.Capability.Layer.BoundingBox[0].extent;

            // Transform the extent if necessary
            const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

            // Fit the view to the extent
            this.map.getView().fit(transformedExtent);
          } catch (error) {
            console.error('Failed to fetch WMS capabilities:', error);
          }
        }
      }
    },
    addWMSLayer(newLayer) {
      if (!this.map) return;

      const wmsLink = newLayer.dataset.links.find(link => link.link_type === 'OGC:WMS');

      if (wmsLink) {
        const wmsLayer = new TileLayer({
          source: new TileWMS({
            url: wmsLink.url,
            params: { 'LAYERS': newLayer.dataset.alternate, 'TILED': true },
            serverType: 'geoserver'
          }),
          opacity: newLayer.opacity,
          visible: newLayer.visibility,
          zIndex: newLayer.order, // Set zIndex using layer.order
          pk: newLayer.dataset.pk
        });
        this.map.addLayer(wmsLayer);
        this.wmsLayers.push(wmsLayer);
        //console.log(this.wmsLayers);
      }
    },
    removeWMSLayer(layer) {
      if (!this.map) return;
      //console.log(this.wmsLayers);

      if (!layer || !layer.dataset || !layer.dataset.pk) {
        console.error('Invalid layer object:', layer);
        return;
      }
      const layerPk = layer.dataset.pk;
      const wmsLayerIndex = this.wmsLayers.findIndex(wmsLayer => wmsLayer.get('pk') === layerPk);
      if (wmsLayerIndex !== -1) {
        const wmsLayer = this.wmsLayers[wmsLayerIndex];
        this.map.removeLayer(wmsLayer);
        this.wmsLayers.splice(wmsLayerIndex, 1);
        console.log(`Layer with pk ${layerPk} removed successfully.`);
      } else {
        console.warn(`Layer with pk ${layerPk} not found in wmsLayers.`);
      }
    },
    updateLayerLegend(filters) {
      if (!this.map) return;

      filters.forEach(filter => {
        const layer = this.map.getLayers().getArray().find(layer => {
          const source = layer.getSource();
          return source instanceof TileWMS && source.getParams().LAYERS === filter.datasetName;
        });

        if (layer) {
          const source = layer.getSource();
          console.log(`Updating layer ${filter.datasetName} with CQL_FILTER: ${filter.query}`);
          source.updateParams({
            CQL_FILTER: filter.query
          });
          source.refresh();
        } else {
          console.warn(`Layer with datasetName ${filter.datasetName} not found.`);
        }
      });
    },
    updateLayerProperties(layer) {
      const wmsLayer = this.wmsLayers.find(wmsLayer => wmsLayer.get('pk') === layer.dataset.pk);
      if (wmsLayer) {
        wmsLayer.setOpacity(layer.opacity);
        wmsLayer.setVisible(layer.visibility);
        console.log(`Updated layer ${layer.dataset.pk} properties: opacity=${layer.opacity}, visibility=${layer.visibility}`);
      } else {
        console.warn(`Layer with pk ${layer.dataset.pk} not found in wmsLayers.`);
      }
    }
  },
  watch: {
    mapLayers: {
      handler(newLayers) {
        newLayers.forEach(layer => {
          this.updateLayerProperties(layer);
        });
      },
      deep: true
    },
    addedLayer(newLayer) {
      //console.log('Adding new layer:', newLayer);
      this.addWMSLayer(newLayer);
    },
    removedLayer(layerPk) {
      //console.log('Removing layer:', layerPk);
      this.removeWMSLayer(layerPk);
    },
    cqlFilters: {
        handler(newFilters) {
          console.log('Updating layer legend with new filters:', newFilters);  
          this.updateLayerLegend(newFilters);
        },
        deep: true
    },
  },
  created() {
    this.fetchInitialData();
  }
}
</script>

<style>
@import "../../node_modules/ol/ol.css";

#map {
  width: 100%;
  height: 100%;
  position: relative; /* Changed from absolute to relative */
}

.ol-zoom {
  top: .5em;
  right: .5em;
  left: auto;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000; /* Ensure the spinner is on top */
}
</style>