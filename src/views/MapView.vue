<template>
    <div id="layout" class="d-flex">
        <!-- Sidebar -->
        <div id="sidebar" class="sidebar">
            <LayersPanel />
        </div>
        <!-- Map container -->
        <div ref="mapContainer" class="map-container">
            <Map ref="webMap" />
        </div>
    </div>
    <v-navigation-drawer v-model="$store.state.secondDrawer" location="right" width="450">
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
        </v-card>
    </v-navigation-drawer>
</template>

<script>
import Map from "@/components/OlMap.vue";
import LayersPanel from "@/components/LayersPanel.vue";
import { mapState, mapMutations} from 'vuex';

export default {
    name: "MapView",
    components: {
        Map,
        LayersPanel,
    },
    data() {
        return {
            session: {
                name: 'Sistema de Información Territorial - SIT',
                site: 'Visor de Mapas | Consulta Ciudadana',
                details: 'Alcaldía de Maracaibo - Centro de Procesamiento Urbano (CPU)',
                logoPath: require('@/assets/alcaldia-de-maracaibo-logo-web.png'),
                // map name fetched from GeoNode API
                map: 'Ordenanza de Zonificación Urbana',

            },
        };
    },
    computed: {
        ...mapState(['markedCoordinate']),
    },
    methods: {
        ...mapMutations(['closeSecondDrawer']),
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

#layout {
    position: relative;
}

#sidebar {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1; /* This will make sure the sidebar is above the map container */
}
</style>