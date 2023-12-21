<template>
    <div class="catalog-container">
        <div class="welcome">
            <v-row>
                <v-col cols="12" md="6">
                    <v-card class="mx-auto" variant="flat">
                        <v-card-title class="text-h3 text-wrap">Visor de mapas de la Alcaldía de Maracaibo</v-card-title>
                        <v-card-subtitle class="text-h5">¡Bienvenido!</v-card-subtitle>
                        <v-card-text>
                            <p>En esta sección podrás consultar el mapa de zonificación urbana del municipio, el cual ha sido preparado por el Centro de procesamiento urbano (CPU) para facilitar el acceso a la información del uso del suelo a los ciudadanos.</p>
                            <p>Para ver el mapa, haz click en el botón <strong class="text-accent">Ver mapa</strong> de la tarjeta.</p>
                            <v-divider></v-divider>
                            <p class="text-caption">Para ver los detalles de un mapa, haz click en el botón <v-icon color="error">mdi-information</v-icon>.</p>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <img :src="image" alt="App image">
                </v-col>
            </v-row>
        </div>
        <div class="map-cards">
            <v-row>
                <v-col cols="12" md="12">
                    <v-card v-for="map in maps" :key="map.id" variant="flat" class="mx-auto bg-secondary on-secondary" max-width="900">
                        <v-card-item>
                            <div class="text-overline mb-1" color="accent">
                                Mapa | {{ map.attribution }}
                            </div>
                        </v-card-item>
                        <v-divider></v-divider>
                        <v-img :src="map.thumbnail_url" class="map-thumbnail" cover></v-img>
                        <v-card-title class="text-h6 mb-1">{{ map.title }}</v-card-title>
                        <v-card-text class="text-caption" color="accent">{{ map.raw_purpose }}</v-card-text>
                        <!-- card content... -->
                        <v-divider></v-divider>
                        <v-card-actions class="d-flex justify-space-between">
                            <v-btn color="accent" @click="goToMapView(map.pk)">Ver mapa</v-btn>
                            <v-btn icon @click="openDetails(map.detail_url)">
                                <v-icon color="error">mdi-information</v-icon>
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </div>
        <v-footer fixed class="pa-2 bg-primary on-primary app-footer">
            <v-container fluid>
                <v-row justify="center" no-gutters>
                <p>&copy; {{ new Date().getFullYear() }} | <strong> GeoStudio </strong> | Alcaldía de Maracaibo</p>
                </v-row>
            </v-container>
        </v-footer>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
    props: {
        maps: {
        type: Array,
        required: true,
        },
    },
    // data, methods...
    data: () => ({
        image: require('@/assets/illustration-9.png'),
    }),
    methods: {
        ...mapActions(['fetchDatasets']),
        goToMapView(pk) {
            const selectedMap = this.maps.find(map => map.pk === pk);
            this.$store.commit('setSelectedMap', selectedMap);
            this.fetchDatasets();
            this.$router.push({ name: 'Map' });
        },
        openDetails(detailUrl) {
        window.open(`${detailUrl}/metadata_detail`, '_blank');
        },
    },
};
</script>

<style scoped>
.v-card-title.text-wrap {
  white-space: normal;
  line-height: 1.5;
}

.map-thumbnail {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.catalog-container {
    height: calc(100vh - 64px);
    display: grid;
    grid-template-columns: 1fr 80% 1fr;
    grid-template-rows: 1fr 1fr 50px;
    grid-gap: 10px;
}

.welcome {
    grid-row-start: 1;
    grid-column-start: 2;
    grid-column-end: 3;
    margin-top: 10%;
}

.map-cards {
    grid-row-start: 2;
    grid-column-start: 2;
    grid-column-end: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.app-footer {
    grid-row-start: 3;
    grid-column-start: 1;
    grid-column-end: 4;
}
</style>