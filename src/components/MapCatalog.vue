<template>
    <div class="catalog-container">
        <div class="welcome">
            <v-row>
                <v-col cols="12" md="6">
                    <v-card class="mx-auto" variant="flat">
                        <v-card-title class="text-h3 text-wrap">Mapa de <br> Zonificación Urbana <br> de Maracaibo</v-card-title>
                        <v-card-subtitle class="text-h5 mt-3">¡Bienvenido!</v-card-subtitle>
                        <v-card-text>
                            <p>En esta sección podrás consultar el mapa de zonificación urbana del municipio, el cual ha sido preparado por el Centro de Procesamiento Urbano (CPU) para facilitar el acceso a la información del uso del suelo a los ciudadanos.</p>
                            <v-divider></v-divider>
                            <p class="text-caption">Para ver el mapa, haz click en el botón <strong>Ver Mapa</strong> de la tarjeta a continuación.</p>
                            <!--p class="text-caption">Para ver los detalles de un mapa, haz click en el botón <v-icon color="error">mdi-information</v-icon>.</p-->
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <!-- <img :src="image" alt="App image" width="650"> -->
                </v-col>
            </v-row>
        </div>
        <div class="map-cards">
            <v-row>
                <v-col cols="12" md="12">
                    <v-card v-for="map in maps" :key="map.id" variant="outlined" class="mx-auto bg-white on-secondary  rounded-xl pa-5" max-width="900">
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
        <div class="features-container">
            <div class="features">
                <v-row>
                    <v-col cols="12" md="4"> 
                        <img :src="icon1" alt="Map icon">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p> 
                    </v-col>
                    <v-col cols="12" md="4">     
                        <img :src="icon2" alt="Map icon">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p>        
                    </v-col>
                    <v-col cols="12" md="4">   
                        <img :src="icon3" alt="Map icon">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p>          
                    </v-col>
                </v-row>
            </div>
        </div>
        <div class="details">
            <v-row>
                <v-col cols="12" md="6">
                    <v-card variant="flat">
                        <v-card-title class="text-h3">
                            Información <br> detallada
                        </v-card-title>
                        <v-card-text class="mt-5">
                            <p>
                                En esta sección podrás consultar el mapa de zonificación urbana del municipio, 
                                el cual ha sido preparado por el Centro de Procesamiento Urbano (CPU) para facilitar
                                el acceso a la información del uso del suelo a los ciudadanos.
                            </p>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card variant="outlined rounded-xl pa-5">
                        <img :src="mapView" alt="Map icon" class="w-100 rounded-xl">
                    </v-card>
                </v-col>
            </v-row>
        </div>
        <v-footer fixed class="pa-2 bg-primary on-primary app-footer">
            <v-container fluid>
                <v-row justify="center" no-gutters>
                <p>&copy; {{ new Date().getFullYear() }} | <strong><a href="https://www.geostudio.com.co/"> GeoStudio </a></strong> | Alcaldía de Maracaibo</p>
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
        image: require('@/assets/images/header-background.jpg'),
        icon1:require('@/assets/images/map-icon.png'),
        icon2:require('@/assets/images/world-icon.png'),
        icon3:require('@/assets/images/location-pin-icon.png'),
        mapView:require('@/assets/images/map-view.jpg')
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
a {
  color: inherit;
  text-decoration: none;
}
.v-card-title.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
.v-card-subtitle{
    opacity: 1;
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
    /*grid-template-rows: 1fr repeat(5) 50px;*/
    grid-gap: 10px;
    background-image: url('@/assets/images/header-background.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    min-height: 600px;
}

.welcome {
    grid-row-start: 1;
    grid-column-start: 2;
    grid-column-end: 3;
    margin-top: 5%;
   
}
.welcome .v-card{
    color: #fff;
    background-color: transparent;
}
.map-cards {
    grid-row-start: 2;
    grid-column-start: 2;
    grid-column-end: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin-bottom: 40px;
}
.features-container{
    display: grid;
    grid-template-columns: 1fr 80% 1fr;
    grid-row-start: 3;
    grid-column-start: 1;
    grid-column-end: 4;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    background-color: #f4f4f4;
    height: fit-content;
    padding: 50px 0;
}
.features{
    grid-row-start: 1;
    grid-column-start: 2;
    grid-column-end: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    height: fit-content;
}
.details{
    grid-row-start: 4;
    grid-column-start: 2;
    grid-column-end: 3;
    padding: 50px 0;
}

.app-footer {
    grid-row-start: 5;
    grid-column-start: 1;
    grid-column-end: 4;
}
</style>