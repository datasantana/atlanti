<template>
    <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';

import { mapState } from 'vuex';

export default {
    name: "OlMap",
    props: ["modelValue"],
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
    computed: {
        ...mapState(['mapLayers']),
        sortedMapLayers() {
            return [...this.mapLayers].sort((a, b) => a.order - b.order);
        }
    },
    watch: {
        mapLayers: {
            handler(newMapLayers) {
                newMapLayers.forEach((layer) => {
                    const olLayer = this.map.getLayers().getArray().find(olLayer => olLayer.get('pk') === layer.pk);
                    if (olLayer) {
                        olLayer.setOpacity(layer.opacity);
                        olLayer.setVisible(layer.visibility);
                    }
                });
            },
            deep: true  // Watch for nested changes
        }
    },
    methods: {
        initMap() {
            try {
                const { lng, lat, zoom } = this.modelValue

                // Create a TileLayer for each layer in sortedMapLayers
                const wmsLayers = this.sortedMapLayers.map(layer => new TileLayer({
                    source: new TileWMS({
                        url: `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`,
                        params: {
                            'LAYERS': layer.name,
                            'TILED': true
                        },
                        serverType: 'geoserver',
                        cacheSize: 1000  // Cache the last 1000 tiles
                    }),
                    opacity: layer.opacity,
                    visible: layer.visibility,
                    pk: layer.pk  // Set the pk of the OpenLayers layer
                }));

                this.map = new Map({
                    target: this.$refs.mapContainer,
                    layers: [
                        new TileLayer({
                            source: new OSM({
                                cacheSize: 1000  // Cache the last 1000 tiles
                            }),
                        }),
                        ...wmsLayers  // Add the WMS layers to the map
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
    created() {
        this.sortedMapLayers.forEach((layer, index) => {
            this.$watch(`mapLayers[${index}].opacity`, (newOpacity) => {
                const olLayer = this.map.getLayers().getArray()[index + 1];  // +1 to skip the base map layer
                if (olLayer) {
                    olLayer.setOpacity(newOpacity);
                }
            });

            this.$watch(`mapLayers[${index}].visibility`, (newVisibility) => {
                const olLayer = this.map.getLayers().getArray()[index + 1];  // +1 to skip the base map layer
                if (olLayer) {
                    olLayer.setVisible(newVisibility);
                }
            });
        });
    },
    mounted() {
        this.initMap();
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