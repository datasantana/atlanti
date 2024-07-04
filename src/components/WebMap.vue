<template>
    <v-navigation-drawer v-model="$store.state.secondDrawer" app location="right" width="450">
      <!-- Add your second drawer content here -->
      <v-card class="d-flex flex-column fill-height mx-auto bg-primary on-primary" variant="flat" max-width="450">
        <v-card-actions>
          <v-btn icon="mdi-close" @click="closeSecondDrawer"></v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-item>
          <div class="text-overline mb-1">
            Norte: {{ markedCoordinate && markedCoordinate[1] ? parseFloat(markedCoordinate[1].toFixed(2)) : 'N/A' }} - Este: {{ markedCoordinate && markedCoordinate[0] ? parseFloat(markedCoordinate[0].toFixed(2)) : 'N/A' }}
          </div>
        </v-card-item>
        <v-card-text style="max-height: 80vh; overflow-y: auto;">
          <!-- content of the panel... -->
          <v-expansion-panels v-model="activePanel" v-if="specialFeature">
            <v-expansion-panel v-for="(feature, index) in specialFeature" :key="index" class="v-card">
              <v-expansion-panel-title >
                <template v-slot:actions>
                  <v-icon color="accent" icon="mdi-plus" @click="handleClick(feature.geometry)"></v-icon>
                </template>
                {{ feature.title }} | 
              </v-expansion-panel-title>
              <v-expansion-panel-text class="overflow-y-auto" >
                <div class="wrap-text" v-html="feature.featureinfo_custom_template"></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel v-for="(feature, index) in otherFeatures" :key="index" class="v-card">
              <v-expansion-panel-title>
                <template v-slot:actions>
                  <v-icon color="secondary" icon="mdi-plus" @click="handleClick(feature.geometry)"></v-icon>
                </template>
                {{ feature.title }} | {{ firstVisibleAttributes[index].value }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="overflow-y-auto">
                <div v-for="attribute in visibleAttributes[index]" :key="attribute.attribute">
                  <p><strong>{{ attribute.attribute_label }}:</strong></p>
                  <p class="wrap-text">{{ attribute.value }}</p>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>
    <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
import 'mapbox-gl/dist/mapbox-gl.css';
import { mapMutations, mapActions, mapState, mapGetters } from 'vuex';
import proj4 from 'proj4';
import * as turf from '@turf/turf';

export default {
    name: "WebMap",
    props: ["modelValue", "mapLayers"],
    data() {
        proj4.defs("EPSG:2202", "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
        return {
            map: null,
            mapContainer: null,
            marker: null,
            tracedFeatureId: null,
            drawer: false,  // Initialize `drawer` to `false`
            activePanel: 0,
        };
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
        const map = this.initializeMap();

        map.on('load', () => {
        this.addLayersToMap(map);
        });

        const updateLocation = () => this.$emit('update:modelValue', this.getLocation())

        map.on('move', updateLocation)
        map.on('zoom', updateLocation)
        map.on('rotate', updateLocation)
        map.on('pitch', updateLocation)
        
        // Add a click event listener to the map
        
        this.map = map;
        this.map.on('click', this.addMarker);
    },
    unmounted() {
        this.map.remove();
        this.map = null;
    },
    watch: {
        modelValue(next) {
            const curr = this.getLocation()
            const map = this.map

            if (curr.lng != next.lng || curr.lat != next.lat)
            map.setCenter({ lng: next.lng, lat: next.lat })
            if (curr.pitch != next.pitch) map.setPitch(next.pitch)
            if (curr.bearing != next.bearing) map.setBearing(next.bearing)
            if (curr.zoom != next.zoom) map.setZoom(next.zoom)
        },
        '$store.state.mapLayers': {
            handler(newVal) {
            newVal.forEach((layer) => {
                const mapLayer = this.map.getLayer(`wms-layer-${layer.pk}`);
                if (mapLayer) {
                this.map.setLayoutProperty(`wms-layer-${layer.pk}`, 'visibility', layer.visibility ? 'visible' : 'none');
                this.map.setPaintProperty(`wms-layer-${layer.pk}`, 'raster-opacity', layer.opacity);
                }
            });
            },
            deep: true,
        },
        tracedFeature(newFeature) {
            if (this.tracedFeatureId) {
                // Remove the old feature from the map
                this.map.removeLayer(`${this.tracedFeatureId}-fill`);
                this.map.removeLayer(`${this.tracedFeatureId}-line`);
                this.map.removeSource(this.tracedFeatureId);
            }

            // Generate a unique id for the new feature
            this.tracedFeatureId = `feature-${Date.now()}`;

            // Try to add the new feature to the map
            try {
                this.map.addSource(this.tracedFeatureId, {
                type: 'geojson',
                data: newFeature,
                });

                this.map.addLayer({
                id: `${this.tracedFeatureId}-fill`,
                type: 'fill',
                source: this.tracedFeatureId,
                paint: {
                    'fill-color': '#888888', // adjust this value as needed
                    'fill-opacity': 0.4, // adjust this value as needed
                },
                });

                this.map.addLayer({
                id: `${this.tracedFeatureId}-line`,
                type: 'line',
                source: this.tracedFeatureId,
                paint: {
                    'line-color': '#04BF55', // accent color
                    'line-width': 3, // adjust this value as needed
                },
                });
                // Calculate the bounding box of the new feature
                const bbox = turf.bbox(newFeature);

                // Adjust the map view to fit the bounding box
                this.map.fitBounds(bbox, { padding: 20 });

            } catch (error) {
                console.error('Failed to add feature to map:', error);
            }
        },
        markedCoordinate() {
            if (this.tracedFeatureId) {
            // Remove the traced feature from the map
            this.map.removeLayer(`${this.tracedFeatureId}-fill`);
            this.map.removeLayer(`${this.tracedFeatureId}-line`);
            this.map.removeSource(this.tracedFeatureId);
            this.tracedFeatureId = null;
            }
        },
        mapLayers: {
            handler(newMapLayers) {
                if (this.map && newMapLayers.length > 0) {
                    this.addLayersToMap(this.map);
                }
            },
            immediate: true,
        },
    },
    computed: {
        ...mapGetters(['markedCoordinate']),
        ...mapState(['markedCoordinate', 'tracedFeature', 'features']),
        specialFeature() {
            return this.features.filter(feature => feature.title === 'Ordenanza Zonificación de Maracaibo');
        },
        otherFeatures() {
            return this.features.filter(feature => feature.title !== 'Ordenanza Zonificación de Maracaibo');
        },
        visibleAttributes() {
            return this.otherFeatures.map(feature => {
                return feature.properties.attribute_set.filter(attribute_set => attribute_set.visible);
            });
        },
        firstVisibleAttributes() {
            return this.visibleAttributes.map(attributes => {
                return attributes.sort((a, b) => a.display_order - b.display_order)[0];
            });
        },
    },
    methods: {
        ...mapMutations(['markCoordinate', 'closeSecondDrawer']),
        ...mapActions(['fetchFeatures', 'traceFeature']),
        handleClick(geometry) {
            this.$store.dispatch('traceFeature', geometry);
        },
        initializeMap() {
            const { lng, lat, zoom, bearing, pitch } = this.modelValue

            const map = new mapboxgl.Map({
                container: this.$refs.mapContainer,
                style: process.env.VUE_APP_DEFAULT_MAP_STYLE,
                center: [lng, lat],
                bearing,
                pitch,
                zoom,
            });

            // Add navigation control (the +/- zoom buttons)
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            return map;
            },
            addLayersToMap(map) {
            if (this.mapLayers) {
                [...this.mapLayers].reverse().forEach((layer) => {
                this.addLayerToMap(map, layer);
                });
            }
            },
            addLayerToMap(map, layer) {
            const baseUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
            const layerName = layer.dataset.alternate;
            const bbox = '{bbox-epsg-3857}';
            const newUrl = `${baseUrl}?service=WMS&version=1.1.0&request=GetMap&layers=${layerName}&styles=&bbox=${bbox}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true`;

            map.addSource(`wms-source-${layer.pk}`, {
                'type': 'raster',
                'tiles': [newUrl],
                'tileSize': 256
            });

            map.addLayer({
                'id': `wms-layer-${layer.pk}`,
                'type': 'raster',
                'source': `wms-source-${layer.pk}`,
                'paint': {
            'raster-opacity': layer.opacity
                },
                'layout': {
            'visibility': layer.visibility ? 'visible' : 'none'
                }
            });
        },
        getLocation() {
            return {
        ...this.map.getCenter(),
        bearing: this.map.getBearing(),
        pitch: this.map.getPitch(),
        zoom: this.map.getZoom(),
            }
        },
        addMarker(e) {
            // Remove the old marker if it exists
            if (this.marker) {
                this.marker.remove();
            }

            // Create a new HTML element
            let el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundColor = '#404040'; //dark color
            el.style.border = '3px solid white';
            el.style.borderRadius = '50%';
            el.style.width = '20px';
            el.style.height = '20px';

            // Create a new marker and add it to the map at the clicked location
            this.marker = new mapboxgl.Marker(el)
                .setLngLat(e.lngLat)
                .addTo(this.map);

            // Perform the fly-to action to the new marker location with a zoom level of 18
            this.map.flyTo({ center: e.lngLat, zoom: 18 });

            // Set the new marker as the map center
            //this.map.setCenter(e.lngLat);

            const coordinate = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            const sourceProjection = 'EPSG:4326'; // replace with your source projection
            const destinationProjection = 'EPSG:2202'; // replace with your destination projection

            // Reproject the coordinate
            const reprojectedCoordinate = proj4(sourceProjection, destinationProjection, [parseFloat(coordinate.lng), parseFloat(coordinate.lat)]);
            this.markCoordinate(reprojectedCoordinate);

            // Toggle the second drawer
            this.$store.commit('openSecondDrawer');
            this.fetchFeatures(); // dispatch the fetchFeatures action
        },
    },
};

</script>

<style>
.map-container {
    height: 100vh;
    width: 100vw;
}

@keyframes pulse {
    0% {
        transform: scale(0.1, 0.1);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: scale(6, 6);
        opacity: 0;
    }
}

.marker::after {
    content: "";
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    animation: pulse 2s infinite;
}

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