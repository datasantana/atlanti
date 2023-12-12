<template>
  <v-app>
    <v-app-bar app color="indigo" :elevation="0">
      <!-- Add your logo here -->
      <template v-slot:prepend>
        <v-btn icon @click="drawer = !drawer">
          <v-icon>mdi-earth</v-icon>
        </v-btn>
      </template>
      <v-toolbar-title>{{ title }}</v-toolbar-title>

      <!-- Add spacer to push content to the right -->
      <v-spacer></v-spacer>

      <!-- Add your buttons here -->
      <v-btn>Login</v-btn>
      <v-btn icon>
        <v-icon>mdi-information</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app width="300">
      <!-- Add your drawer content here -->
      <v-card class="d-flex flex-column fill-height mx-auto" variant="tonal" max-width="450" color="indigo">
        <v-card-item>
          <div class="text-overline mb-1">
            Title
          </div>
        </v-card-item>
        <v-card-title>
          <v-icon left>mdi-account-circle</v-icon>
          <div class="text-h6 mb-1">Username</div>
        </v-card-title>
        <v-card-text>
          <!-- content of the panel... -->
          <v-expansion-panels>
            <v-expansion-panel class="v-card">
              <v-expansion-panel-title>
                Saved Searches
              </v-expansion-panel-title>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn to="/">Catálogo</v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="$store.state.secondDrawer" app location="right" width="450">
      <!-- Add your second drawer content here -->
      <v-card class="d-flex flex-column fill-height mx-auto" variant="tonal" max-width="450" color="indigo">
        <v-card-actions>
          <v-btn icon="mdi-close" @click="closeSecondDrawer"></v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-item>
          <div class="text-overline mb-1">
            lat: {{ markedCoordinate.lat.toFixed(4) }} - lng: {{ markedCoordinate.lng.toFixed(4) }}
          </div>
        </v-card-item>
        <v-card-text>
          <!-- content of the panel... -->
          <v-expansion-panels v-model="activePanel">
            <v-expansion-panel v-if="specialFeature" class="v-card">
              <v-expansion-panel-title>
                <template v-slot:actions>
                  <v-icon color="indigo" icon="mdi-plus" @click="traceFeature(specialFeature.geometry)"></v-icon>
                </template>
                {{ specialFeature.title }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="overflow-y-auto">
                <div v-html="specialFeature.featureinfo_custom_template"></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel v-for="(feature, index) in otherFeatures" :key="index" class="v-card">
              <v-expansion-panel-title>
                <template v-slot:actions>
                  <v-icon color="indigo" icon="mdi-plus" @click="traceFeature(feature.geometry)"></v-icon>
                </template>
                {{ feature.title }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="overflow-y-auto">
                <div v-for="attribute in visibleAttributes[index]" :key="attribute.attribute">
                  <p><strong>{{ attribute.attribute_label }}:</strong></p>
                  <pre class="wrap-text">{{ attribute.value }}</pre>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!--v-expansion-panels>
            <v-expansion-panel v-for="(feature, index) in features" :key="index" class="v-card">
              <v-expansion-panel-title>
                <template v-slot:actions>
                  <v-icon color="indigo" icon="mdi-plus" @click="traceFeature(feature.geometry)"></v-icon>
                </template>
                {{ firstVisibleAttributes[index].attribute_label }} | {{ firstVisibleAttributes[index].value }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="overflow-y-auto">
                <div v-for="attribute in visibleAttributes[index]" :key="attribute.attribute">
                  <p><strong>{{ attribute.attribute_label }}:</strong></p>
                  <pre class="wrap-text">{{ attribute.value }}</pre>
                </div>
                <div class="wrap-text" v-html="feature.featureinfo_custom_template"></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels-->
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <v-main class="router-countainer">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import { mapGetters, mapMutations, mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      drawer: false,  // Initialize `drawer` to `false`
      activePanel: 0,
    };
  },
  methods: {
    ...mapMutations(['closeSecondDrawer']),
    ...mapActions(['traceFeature']),
  },
  computed: {
    ...mapGetters(['markedCoordinate']),
    ...mapState(['markedCoordinate', 'features']),
    specialFeature() {
      return this.features.find(feature => feature.title === 'Ordenanza Zonificación de Maracaibo');
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
    title() {
      return this.$store.state.selectedMap ? this.$store.state.selectedMap.title : 'Atlanti';
    },
  },
};
</script>

<style scoped>
.router-container {
  height: calc(100vh - 64px); /* Adjust as needed */
}
.overflow-y-auto {
  overflow-y: auto;
  max-height: 450px; /* Adjust this value as needed */
}

.wrap-text {
  white-space: pre-wrap;       /* CSS 3 */
  white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  white-space: -pre-wrap;      /* Opera 4-6 */
  white-space: -o-pre-wrap;    /* Opera 7 */
  word-wrap: break-word;       /* Internet Explorer 5.5+ */
}

.wrap-content pre, .wrap-content code {
  white-space: pre-wrap;       /* CSS 3 */
  white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  white-space: -pre-wrap;      /* Opera 4-6 */
  white-space: -o-pre-wrap;    /* Opera 7 */
  word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
</style>
