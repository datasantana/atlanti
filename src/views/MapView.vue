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