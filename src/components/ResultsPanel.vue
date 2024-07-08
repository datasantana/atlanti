<template>
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
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'ResultsPanel',
    data() {
        return {
            // Add your data properties here
            activePanel: 0,
        };
    },
    methods: {
        // Add your methods here
        handleClick(geometry) {
            this.$store.dispatch('traceFeature', geometry);
        },
    },
    mounted() {
        // Add any initialization logic here
    },
    computed: {
        ...mapState(['features']),
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
};
</script>

<style scoped>
/* Add your component-specific styles here */
.overflow-y-auto {
  overflow-y: auto;
  max-height: 450px; /* Adjust this value as needed */
}
</style>