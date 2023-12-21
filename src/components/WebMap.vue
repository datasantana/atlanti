<template>
    <div ref="mapContainer" class="map-container"></div>

</template>

<script>
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = "pk.eyJ1IjoiZ2Vvc3R1ZGlvIiwiYSI6ImNrNWk5Mmp5eDBjNHQzbW10M3d6NzI1Y28ifQ.MPmtingHT1zi_Wk5ZxW8wA"
import 'mapbox-gl/dist/mapbox-gl.css';
import { mapMutations, mapActions, mapState } from 'vuex';
import proj4 from 'proj4';

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
        };
    },
    async beforeMount() {
        // Check if mapLayers and mapDatasets are empty
        if (this.$store.state.mapLayers.length === 0 && this.$store.state.mapDatasets.length === 0) {
            // Fetch the default map
            let maps = await this.$store.dispatch('fetchMaps');
            let defaultMap = maps.find(map => map.title === "Consulta Ciudadana | Zonificación");
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
        ...mapState(['markedCoordinate', 'tracedFeature']),
    },
    methods: {
        ...mapMutations(['markCoordinate']),
        ...mapActions(['fetchFeatures']), // map the fetchFeatures action
        initializeMap() {
            const { lng, lat, zoom, bearing, pitch } = this.modelValue

            const map = new mapboxgl.Map({
                container: this.$refs.mapContainer,
                style: "mapbox://styles/mapbox/light-v11",
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
            const baseUrl = 'https://mapas.alcaldiademaracaibo.org/geoserver/ows';
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
            el.style.backgroundColor = '#F2BD1D'; //error color
            el.style.border = '2px solid white';
            el.style.borderRadius = '50%';
            el.style.width = '20px';
            el.style.height = '20px';

            // Create a new marker and add it to the map at the clicked location
            this.marker = new mapboxgl.Marker(el)
                .setLngLat(e.lngLat)
                .addTo(this.map);

            // Set the new marker as the map center
            this.map.setCenter(e.lngLat);

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

</style>