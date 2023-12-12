import { createStore } from 'vuex'
import axios from 'axios';

export default createStore({
  state: {
    maps: [],
    selectedMap: null,
    mapLayers: [],
    mapDatasets: [],
    secondDrawer: false,
    markedCoordinate: { lat: 0, lng: 0 },
    features: [],
    tracedFeature: null,
    // other state properties...
  },
  getters: {
    mapLayers: state => {
      console.log('mapLayers in store:', state.mapLayers); // print the value of mapLayers in the store
      return state.mapLayers;
    },
    markedCoordinate: state => state.markedCoordinate,
    // other getters...
  },
  mutations: {
    setMaps(state, maps) {
      state.maps = maps;
    },
    setSelectedMap(state, map) {
      state.selectedMap = map;
      state.mapLayers = map.maplayers.map(layer => {
        const legendLinks = layer.dataset.links.filter(link => link.name === 'Legend');
        return {
          ...layer,
          dataset: {
            ...layer.dataset,
            links: legendLinks
          }
        };
      });
      console.log('Map:', state.selectedMap);
      console.log('mapLayers in store:', state.mapLayers); // print the value of mapLayers in the store
    },
    clearSelectedMap(state) {
      state.selectedMap = null;
    },
    setMapLayers(state, mapLayers) {
      state.mapLayers = mapLayers;
      console.log('mapLayers in store:', state.mapLayers); // print the value of mapLayers in the store
    },
    setMapDatasets(state, datasets) {
      state.mapDatasets = datasets;
      console.log('mapDatasets in store:', state.mapDatasets); // print the value of mapLayers in the store
    },
    toggleLayerVisibility(state, layerIndex) {
      if (state.mapLayers[layerIndex]) {
        state.mapLayers[layerIndex].visibility = !state.mapLayers[layerIndex].visibility;
      }
    },
    setLayerOpacity(state, { layerIndex, opacity }) {
      state.mapLayers[layerIndex].opacity = opacity;
    },
    openSecondDrawer(state) {
      state.secondDrawer = true;
    },
    closeSecondDrawer(state) {
      state.secondDrawer = false;
    },
    markCoordinate(state, coordinate) {
      state.markedCoordinate = coordinate;
      console.log('markedCoordinate', state.markedCoordinate);
    },
    setFeatures(state, features) {
      const modifiedFeatures = features.map(feature => {
        // Remove unwanted characters from feature.id
        const refactoredId = feature.id.split('.')[0];
    
        // Find the corresponding dataset
        const correspondingDataset = state.mapDatasets.find(dataset => dataset.dataset.name === refactoredId);
    
        // If a corresponding dataset is found, append the corresponding dataset's attribute_Set to the feature's properties
        if (correspondingDataset) {
          feature.properties.attribute_set = correspondingDataset.dataset.attribute_set.map(attribute => {
            return {
              ...attribute,
              value: feature.properties[attribute.attribute]
            };
          });
    
          let template = correspondingDataset.dataset.featureinfo_custom_template;

          // Create an object with Key-Value structure where key is the placeholder (${properties.property} in feature.properties), value is the corresponding value for each property
          let replacements = {};
          for (let property in feature.properties) {
            replacements[`\\$\\{properties.${property}\\}`] = feature.properties[property];
          }

          // Iterate in the object to find keys in template and replace with corresponding values
          for (let placeholder in replacements) {
            template = template.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
          }

          // Add class="wrap-text" to every <pre> tag
          template = template.replace(/<pre>/g, '<pre style="word-wrap: break-word;">');

          // Set feature.featureinfo_custom_template with transformed template
          feature.featureinfo_custom_template = template;
        }
        feature.title = correspondingDataset.dataset.title;
    
        return feature;
      });
    
      // Push the modified features to the state
      state.features.push(...modifiedFeatures);
      console.log('features', state.features);
    },
    resetFeatures(state) {
      state.features = [];
    },
    setTracedFeature(state, geometry) {
      state.tracedFeature = geometry;
    },
    resetTracedFeature(state) {
      state.tracedFeature = null;
    },
    // other mutations...
  },
  actions: {
    async fetchMaps({ commit }) {
      const response = await axios.get("https://mapas.alcaldiademaracaibo.org/api/v2/maps");
      commit('setMaps', response.data.maps);
    },
    fetchFeatures({ state, commit }) {
      commit('resetFeatures'); // reset features to an empty array
  
      const coordinate = state.markedCoordinate;
      const wmsUrl = 'https://mapas.alcaldiademaracaibo.org/geoserver/ows';
      const buffer = 0.01; // adjust this value as needed
  
      // Loop over the mapLayers array
      for (const layer of state.mapLayers) {
        const layerName = layer.name;
  
        // Construct the GetFeatureInfo URL
        const getFeatureInfoUrl = `${wmsUrl}?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=${layerName}&styles=&srs=EPSG:4326&format=image/png&bbox=${coordinate.lng - buffer},${coordinate.lat - buffer},${coordinate.lng + buffer},${coordinate.lat + buffer}&width=256&height=256&query_layers=${layerName}&info_format=application/json&x=128&y=128`;
  
        axios.get(getFeatureInfoUrl).then(response => {
          console.log('Queried', response);
          commit('setFeatures', response.data.features);
          console.log('features', state.features);
        });
      }
    },
    async fetchDatasets({ commit, state }) {
      const datasets = [];
      for (const layer of state.mapLayers) {
        const response = await axios.get(`https://mapas.alcaldiademaracaibo.org/api/v2/datasets/${layer.dataset.pk}`);
        datasets.push(response.data);
      }
      commit('setMapDatasets', datasets);
    },
    traceFeature({ commit }, geometry) {
      commit('setTracedFeature', geometry);
    },
    markCoordinate({ commit }, coordinate) {
      commit('setMarkedCoordinate', coordinate);
      commit('resetTracedFeature');
    },
    // other actions...
  },
  modules: {
  }
})
