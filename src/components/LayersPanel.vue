<template>
    <div class="layers-panel">
        <v-card variant="flat" class="mx-auto bg-secondary on-secondary" max-width="450">
            <v-tabs
                v-model="tab"
                bg-color="primary"
                align-tabs="center"
            >
                <v-tab value="zone">Zonificación</v-tab>
                <v-tab value="place">Lugar</v-tab>
                <v-tab value="coordinate">Coordenada</v-tab>
            </v-tabs>
            <v-card-text>
                <v-window v-model="tab">
                    <v-window-item value="zone">
                        <v-form>
                            <v-row class="d-flex align-center justify-space-between">
                                <v-col cols="10">
                                    <!--v-text-field label="Lugar" prepend-icon="mdi-map-marker"></v-text-field-->
                                    <v-autocomplete
                                        v-model="selectedZone"
                                        :items="zoneNames"
                                        label="Buscar Zona"
                                        item-title="name"
                                        item-value="value"
                                    ></v-autocomplete>
                                </v-col>
                                <v-col cols="2">
                                    <v-btn id="search-zone" size="x-small" icon="mdi-filter" color="accent" @click="filterZoneAndEmit"></v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-window-item>
                    <v-window-item value="place">
                        <v-form>
                            <v-row class="d-flex align-center justify-space-between">
                                <v-col cols="10">
                                    <!--v-text-field label="Lugar" prepend-icon="mdi-map-marker"></v-text-field-->
                                    <v-autocomplete
                                        v-model="selectedPlace"
                                        :items="placeNames"
                                        label="Buscar lugar"
                                        item-text="nombre"
                                        item-value="nombre"
                                    ></v-autocomplete>
                                </v-col>
                                <v-col cols="2">
                                    <v-btn id="search-place" size="x-small" icon="mdi-map-search" color="accent" @click="filterAndEmit"></v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                        <div class="text-caption">
                            {{ labels[0] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation2202.lat.toFixed(2)) : parseFloat(mapLocation.lat.toFixed(2)) }} |
                            {{ labels[1] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation2202.lng.toFixed(2)) : parseFloat(mapLocation.lng.toFixed(2)) }} |
                            Zoom: {{ mapLocation.zoom.toFixed(2) }} 
                            <template v-if="mapLocation.bearing">| Bearing: {{ mapLocation.bearing.toFixed(2) }} | </template>
                            <template v-if="mapLocation.pitch"> Pitch: {{ mapLocation.pitch.toFixed(2) }} | </template>
                        </div>
                    </v-window-item>
                    <v-window-item value="coordinate">
                        <v-row class="d-flex align-center justify-space-between">
                            <v-col cols="5">
                                <v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
                                    <v-text-field
                                    v-model="reprojectedLocation2202.lat"
                                    :label="labels[0]"
                                    :rules="rules"
                                    ></v-text-field>
                                </v-form>
                                <v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
                                    <v-text-field
                                    v-model="mapLocation.lat"
                                    :label="labels[0]"
                                    :rules="rules"
                                    ></v-text-field>
                                </v-form>
                            </v-col>
                            <v-col cols="5">
                                <v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
                                    <v-text-field
                                    v-model="reprojectedLocation2202.lng"
                                    :label="labels[1]"
                                    :rules="rules"
                                    ></v-text-field>
                                </v-form>
                                <v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
                                    <v-text-field
                                    v-model="mapLocation.lng"
                                    :label="labels[1]"
                                    :rules="rules"
                                    ></v-text-field>
                                </v-form>
                            </v-col>
                            <v-col cols="2">
                                <v-btn id="search-coordinate" size="x-small" icon="mdi-crosshairs-question" color="accent" @click="reprojectAndEmit"></v-btn>
                            </v-col>
                        </v-row>
                    </v-window-item>
                </v-window>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-title>
                <v-row class="d-flex align-center justify-space-between">
                    <v-col cols="10">
                        <div class="text-h6 mb-1">Capas</div>
                    </v-col>
                    <v-col cols="2">
                        <v-icon left>mdi-layers</v-icon>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-card-text style="max-height: 400px; overflow-y: auto;">
                <!--Layers panel redisign-->
                <v-expansion-panels>
                    <v-expansion-panel v-for="category in categories" :key="category.identifier">
                        <v-expansion-panel-title>{{ category.gn_description }}</v-expansion-panel-title>
                        <v-expansion-panel-text v-for="dataset in filteredDatasets(category.identifier)" :key="dataset.pk">
                            <details>
                                <summary>{{ dataset.title }}</summary>
                                <p class="text-caption" v-html="dataset.abstract"></p>
                                <div class="layer-controls">
                                    <v-slider class="layer-opacity" color="accent" min=0 max=1 v-model="dataset.opacity" :disabled="!dataset.visibility" @change="updateOpacity(dataset.pk, $event)"></v-slider>
                                    <v-switch class="layer-visibility" color="accent" v-model="dataset.visibility" @change="updateVisibility(dataset.pk, $event)"></v-switch>
                                </div>
                                <div class="legend" v-for="style in styles[dataset.alternate]" :key="style.name">
                                    <div v-if="style.type === 'Polygon'" class="polygon legend-item" :style="{ backgroundColor: style.fill.color, width: '10px', height: '20px', marginRight: '5px' }"></div>
                                    <div v-if="style.type === 'Line'" class="line legend-item" :style="{ border: '2px solid ' + style.stroke.color, width: '10px', height: '2px', marginRight: '5px' }"></div>
                                    <div v-if="style.type === 'Point'" class="point legend-item" :style="{ borderRadius: '5px', backgroundColor: style.mark.fill.color, width: '10px', height: '10px', borderRadius: '50%', marginRight: '5px' }"></div>
                                    <div class="legend-item">{{ style.name }}</div>
                                    <v-spacer></v-spacer>
                                    <input class="legend-item" type="checkbox" v-model="style.selected" checked>
                                </div>
                            </details>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-row class="d-flex align-center justify-space-between">
                    <v-col cols="10">
                        <v-select
                            v-model="currentCRS"
                            :items="items"
                            :item-props="itemProps"
                            label="Seleccione Sistema de Referencia"
                        ></v-select>
                    </v-col>
                    <v-col cols="2">
                        <v-btn size="small" icon="mdi-home" @click="resetMapLocation" color="accent"></v-btn>
                    </v-col>
                </v-row>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
import proj4 from 'proj4';
import { mapState, mapActions } from 'vuex';

// Define the source and destination projections
const sourceProjection4326 = 'EPSG:4326';
const destinationProjection2202 = 'EPSG:2202';

// Define the custom EPSG:2202 projection
proj4.defs(destinationProjection2202, "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Create proj4 converters
const converter4326to2202 = proj4(sourceProjection4326, destinationProjection2202);

export default {
    name: 'LayersPanel',
    data() {
        return {
            currentCRS: 'EPSG:2202',
            items: [
                { text: 'WGS84', value: 'EPSG:4326' },
                { text: 'REGVEN', value: 'EPSG:2202' },
            ],
            session: {
                name: 'Sistema de Información Territorial - SIT',
                site: 'Visor de Mapas | Consulta Ciudadana',
                details: 'Alcaldía de Maracaibo - Centro de Procesamiento Urbano (CPU)',
                logoPath: require('@/assets/alcaldia-de-maracaibo-logo-web.png'),
                // map name fetched from GeoNode API
                map: 'Ordenanza de Zonificación Urbana',

            },
            rules: [
                value => {
                    if (value) return true
                    return 'Coordenada requerida'
                },
            ],
            tab: null,
            imageDimensions: {},
            selectedPlace: null,
            selectedZone: null,
        };
    },
    beforeMount() {
        this.$store.dispatch('fetchCategories');
    },
    computed: {
        ...mapState(['categories', 'datasets', 'styles', 'mapLayers', 'selectedMap', 'searchFeatures', 'filterFeatures', 'mapDatasets', 'mapLocation']),
        filteredDatasets() {
            return (categoryId) => {
                return this.datasets.filter(dataset => dataset.category && dataset.category.identifier === categoryId);
            };
        },
        reprojectedLocation2202() {
            if (this.mapLocation && this.mapLocation.lng && this.mapLocation.lat) {
                const [lng2202, lat2202] = converter4326to2202.forward([this.mapLocation.lng, this.mapLocation.lat]);
                return { lng: lng2202, lat: lat2202 };
            }
            return null;
        },
        placeNames() {
            return this.searchFeatures.map(feature => {
            if (typeof feature.properties.comunidad !== 'string') {
                console.warn('Invalid comunidad property:', feature.properties.comunidad);
            }
            //console.log(feature.properties.comunidad);
            return feature.properties.comunidad;
            });
        },
        zoneNames() {
            const zones = [];

            if (this.filterFeatures && this.filterFeatures.length > 0) {
                const uniqueZones = this.filterFeatures
                    .map(feature => {
                        if (feature.properties.nombre_zona && feature.properties.zona) {
                            return {
                                name: `${feature.properties.nombre_zona} - ${feature.properties.zona}`,
                                value: feature.properties.nombre_zona
                            };
                        }
                        return null;
                    }) // map to object with name and value properties
                    .filter((value, index, self) => value && self.findIndex(v => v.name === value.name && v.value === value.value) === index); // filter out nulls and duplicates

                uniqueZones.forEach(zone => {
                    zones.push(zone);
                });
            }
            return zones;
        },
        groupedLayers() {
            const groups = this.mapLayers.reduce((groups, layer) => {
                if (layer.dataset && layer.dataset.category) {
                    let category;
                    if (layer.dataset.category.identifier === 'boundaries') {
                        category = 'Límites';
                    } else if (layer.dataset.category.identifier === 'planningCadastre') {
                        category = 'Ordenamiento';
                    } else if (layer.dataset.category.identifier === 'transportation') {
                        category = 'Transporte';
                    } else if (layer.dataset.category.identifier === 'structure') {
                        category = 'Estructura Urbana';
                    } else if (layer.dataset.category.identifier === 'location') {
                        category = 'Lugares';
                    } else {
                        category = layer.dataset.category.identifier;
                    }

                    if (!groups[category]) {
                        groups[category] = [];
                    }
                    groups[category].push(layer);
                }
                return groups;
            }, {});

            //console.log(groups);  // Log `groupedLayers` in the console

            return groups;
        },
        labels() {
            if (this.currentCRS === 'EPSG:2202') {
                return ['Norte', 'Este'];
            } else if (this.currentCRS === 'EPSG:4326') {
                return ['Latitude', 'Longitude'];
            }
            return [];
        },
    },
    mounted() {
        this.mapLayers = this.$store.state.mapLayers;  // Update `mapLayers` with the actual map layers from the Vuex store
    },
    methods: {
        ...mapActions(['fetchStyle']),
        updateOpacity(datasetId, sliderValue) {
            console.log(`Setting opacity for dataset ${datasetId} to ${sliderValue}`);

            // Find the layer by datasetId using layer.dataset.pk
            const layer = this.mapLayers.find(layer => layer.dataset && layer.dataset.pk === parseInt(datasetId));
            if (layer) {
                // Commit the updated opacity
                this.$store.commit('updateLayerOpacity', { datasetId, sliderValue });
            } else {
                console.error(`Layer with datasetId ${datasetId} not found.`);
            }
        },
        updateVisibility(datasetId) {
            // Find the layer by datasetId using layer.dataset.pk
            const layer = this.mapLayers.find(layer => layer.dataset && layer.dataset.pk === parseInt(datasetId));
            if (layer) {
                // Toggle the visibility
                const newVisibility = !layer.visibility;
                console.log(`Toggling visibility for dataset ${datasetId} to ${newVisibility}`);
                // Commit the updated visibility
                this.$store.commit('updateLayerVisibility', { datasetId, newVisibility });
            } else {
                console.error(`Layer with datasetId ${datasetId} not found.`);
            }
        },
        itemProps(item) {
            return {
                title: item.text,
                subtitle: item.value,
            };
        },
        resetMapLocation() {
            this.$store.dispatch('updateMapLocation', { lng: -71.6930587033, lat: 10.6775887114, zoom: 11.6, pitch: 0, bearing: 0 });
        },
        switchCRS(crs) {
            this.currentCRS = crs;
            let convertedLocation;
            if (this.currentCRS === 'EPSG:2202') {
                const [lng2202, lat2202] = converter4326to2202.forward([this.location.lng, this.location.lat]);
                convertedLocation = { lng: lng2202, lat: lat2202 };
            } else if (this.currentCRS === 'EPSG:4326') {
                const [lng4326, lat4326] = location.forward([this.location.lng, this.location.lat]);
                convertedLocation = { lng: lng4326, lat: lat4326 };
            }
            this.location.lng = convertedLocation.lng;
            this.location.lat = convertedLocation.lat;
        },
        openDetails(detailUrl) {
            window.open(`${detailUrl}/metadata_detail`, '_blank');
        },
        reprojectAndEmit() {
            if (this.currentCRS === 'EPSG:2202') {
                const searchCoordinate = [this.reprojectedLocation2202.lng, this.reprojectedLocation2202.lat];
                this.$store.commit('setMarkedCoordinate', searchCoordinate);
            } else {
                // reproject to 2202
                const [lng2202, lat2202] = converter4326to2202.forward([this.mapLocation.lng, this.mapLocation.lat]);
                const searchCoordinate = [lng2202, lat2202];
                this.$store.commit('setMarkedCoordinate', searchCoordinate);
            }
        },
        getLegendWidth(url) {
            if (this.imageDimensions[url]) {
            return this.imageDimensions[url].width > this.imageDimensions[url].height ? '50%' : '80%';
            } else {
            let img = new Image();
            img.onload = () => {
                this.imageDimensions[url] = { width: img.width, height: img.height };
            };
            img.src = url;
            }
        },
        filterAndEmit() {
            const filteredFeatures = this.searchFeatures.filter(feature => feature.properties.comunidad === this.selectedPlace);
            filteredFeatures.forEach(feature => {
                const [lng2202, lat2202] = converter4326to2202.forward([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
                const featureCoordinate = [lng2202, lat2202];
                this.$store.commit('setMarkedCoordinate', featureCoordinate);
            });
        },
        filterZoneAndEmit() {
            const filteredFeatures = this.filterFeatures.filter(feature => feature.properties.nombre_zona === this.selectedZone);
            //console.log(filteredFeatures);

            if (filteredFeatures && filteredFeatures.length > 0) {
                const mergedGeometry = {
                    type: "GeometryCollection",
                    geometries: filteredFeatures.map(feature => feature.geometry)
                };

                this.$store.dispatch('traceFeature', mergedGeometry);
            }
        },

    },
}
</script>

<style scoped>
.layers-panel {
    z-index: 1;
}

#sidebar {
  position: absolute;
  margin: 30px;
  /* specify top, left, width, and height as needed */
}

.overflow-y-auto {
  overflow-y: auto;
  max-height: 100px; /* Adjust this value as needed */
}

.layer-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.layer-opacity {
  width: 70%;
}

.layer-visibility {
  margin-left: 30px;
}

.legend{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: left;
}

.legend-item {
    margin: 5px;
}
</style>