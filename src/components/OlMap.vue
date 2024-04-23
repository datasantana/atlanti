<template>
    <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';

export default {
    name: "OlMap",
    props: ["modelValue", "mapLayers"],
    data() {
        return {
            map: null
        }
    },
    async beforeMount() {
        // Check if mapLayers and mapDatasets are empty
        this.$store.dispatch('fetchSearchFeatures');
        this.$store.dispatch('fetchFilterFeatures');
        if (this.$store.state.mapLayers.length === 0 && this.$store.state.mapDatasets.length === 0) {
            // Fetch the default map
            let maps = await this.$store.dispatch('fetchMaps');
            let defaultMap = maps.find(map => map.title === "Zonificación Urbana de Maracaibo");
            if (defaultMap) {
                this.$store.commit('setSelectedMap', defaultMap);
                await this.$store.dispatch('fetchDatasets');
            }
        }
    },
    mounted() {
        this.initMap()
    },
    methods: {
        initMap() {
            try {
                const { lng, lat, zoom } = this.modelValue

                this.map = new Map({
                    target: this.$refs.mapContainer,
                    layers: [
                        new TileLayer({
                            source: new OSM()
                        })
                    ],
                    view: new View({
                        center: fromLonLat([lng, lat]),
                        zoom: zoom
                    })
                })
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
        }
    },
    watch: {
        mapLayers: {
            handler(newLayers) {
                console.log('mapLayers watcher triggered', newLayers);
                // Check if the map is defined
                if (!this.map) {
                    console.log('map is not defined');
                    return;
                }

                // Sort the layers by the 'order' property
                const sortedLayers = newLayers.sort((a, b) => a.order - b.order);

                // Create a TileLayer for each layer in the sorted array
                const wmsLayers = sortedLayers.map(layer => new TileLayer({
                    source: new TileWMS({
                        url: `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`,
                        params: {
                            'LAYERS': layer.name,
                            'TILED': true
                        },
                        serverType: 'geoserver'
                    }),
                    opacity: layer.opacity,
                    visible: layer.visibility
                }));

                // Get the current layers from the map, excluding the base map layer
                const currentLayers = this.map.getLayers().getArray().slice(1);

                // Update the current layers
                for (let i = 0; i < currentLayers.length; i++) {
                    if (i < wmsLayers.length) {
                        // Update the source, opacity, and visibility of the current layer
                        currentLayers[i].setSource(wmsLayers[i].getSource());
                        currentLayers[i].setOpacity(wmsLayers[i].getOpacity());
                        currentLayers[i].setVisible(wmsLayers[i].getVisible());
                    }
                }

                // Add the new layers
                for (let i = currentLayers.length; i < wmsLayers.length; i++) {
                    this.map.addLayer(wmsLayers[i]);
                }
            },
            deep: true  // Watch nested properties in the mapLayers objects
        }
    },
}
</script>

<style>
@import "../../node_modules/ol/ol.css";

.map-container {
    height: 100vh;
    width: 100vw;
}

.ol-zoom {
  top: .5em;
  right: .5em;
  left: auto;
}
</style>