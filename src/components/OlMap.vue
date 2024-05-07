<template>
    <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat, toLonLat } from 'ol/proj';
import proj4 from 'proj4';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';
import mark from '@/assets/icons8-circle-24.png';

import { mapState, mapMutations, mapActions } from 'vuex';

// Define the source and destination projections
const sourceProjection4326 = 'EPSG:4326';
const destinationProjection2202 = 'EPSG:2202';

// Define the custom EPSG:2202 projection
proj4.defs(destinationProjection2202, "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Create proj4 converters
const converter4326to2202 = proj4(sourceProjection4326, destinationProjection2202);

export default {
    name: "OlMap",
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
        ...mapState(['mapLayers', 'mapLocation', 'markedCoordinate']),
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
        ...mapMutations(['setMarkedCoordinate', 'openSecondDrawer']),
        ...mapActions(['fetchFeatures']),
        initMap() {
            try {
                const { lng, lat, zoom } = this.mapLocation;

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
                });

                // Create a vector source and add it to a vector layer
                const vectorSource = new VectorSource();
                const vectorLayer = new VectorLayer({
                    source: vectorSource,
                    style: new Style({
                        image: new Icon({
                            anchor: [0.5, 0.5], // Adjust these values as needed
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            src: mark
                        })
                    })
                });

                // Add the vector layer to the map
                this.map.addLayer(vectorLayer);

                // Add a click event listener to the map
                this.map.on('click', (event) => {
                    // Clear the vector source
                    vectorSource.clear();
                    
                    // Create a new feature with a point geometry at the clicked coordinates
                    const feature = new Feature({
                        geometry: new Point(event.coordinate)
                    });

                    // Add the feature to the vector source
                    vectorSource.addFeature(feature);

                    // Convert the clicked coordinate to longitude/latitude and then to EPSG:2202
                    const lonLat = toLonLat(event.coordinate);
                    const coord = converter4326to2202.forward([lonLat[0], lonLat[1]]);

                    // Commit the clicked coordinate to the Vuex store
                    this.setMarkedCoordinate(coord);

                    // Zoom to the clicked coordinates
                    this.map.getView().animate({
                        center: event.coordinate,
                        zoom: 18
                    });

                    // Trigger openSecondDrawer and fetchFeatures
                    this.openSecondDrawer();
                    this.fetchFeatures();
                });
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
        this.map.on('moveend', () => {
            let center = this.map.getView().getCenter();
            const zoom = this.map.getView().getZoom();
            this.$store.commit('setMapCenter', center);
            this.$store.commit('setMapZoom', zoom);
        });
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