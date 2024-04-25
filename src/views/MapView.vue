<template>
    <div id="layout" class="d-flex">
        <!-- Sidebar -->
        <div id="sidebar" class="sidebar">
            <LayersPanel />
        </div>
        <!-- Map container -->
        <div ref="mapContainer" class="map-container">
            <Map v-model="location" ref="webMap" />
        </div>
    </div>
</template>

<script>
import Map from "@/components/OlMap.vue";
import LayersPanel from "@/components/LayersPanel.vue";

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
            location: {
                lng: -71.6930587033,
                lat: 10.6775887114,
                bearing: 0,
                pitch: 0,
                zoom: 11.6,
            },
            reprojectedLocation: {
                lng: 205383.1024547202,
                lat: 1181614.2195329086,
            },
        };
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
</style>