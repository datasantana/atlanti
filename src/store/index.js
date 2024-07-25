import { createStore } from 'vuex'
import axios from 'axios';
//axios.defaults.baseURL = process.env.VUE_APP_NODE_URL;
//axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

import { toLonLat } from 'ol/proj';

import * as turf from '@turf/turf';
//import { set } from 'core-js/core/dict';

export default createStore({
  state: {
    mapLocation: {
      lng: -69.8862049827,
      lat: 18.4733777998,
      bearing: 0,
      pitch: 0,
      zoom: 15.25,
    },
    maps: [], // Queep this private
    mapsDetails: [], // Use this to render the map cards in MapCatalog.vue
    selectedMap: null,
    categories: [],
    datasets: [],
    styles: [],
    cqlFilters: [],
    mapLayers: [],
    mapDatasets: [],
    searchFeatures: [],
    filterFeatures: [],
    secondDrawer: false,
    markedCoordinate: [],
    features: [],
    tracedFeature: null,
    // other state properties...
  },
  getters: {
    mapLayers: state => {
      return state.mapLayers;
    },
    markedCoordinate: state => state.markedCoordinate,
    // other getters...
  },
  mutations: {
    setMaps(state, maps) {
      state.maps = maps;
      //console.log('maps in store', state.maps);
    },
    // set mapDetails with the map details of all maps. Use this to render the map cards in MapCatalog.vue
    setAllMapDetails(state, maps) {
      state.mapsDetails = maps.map(map => ({
        pk: map.pk,
        resource_type: map.resource_type,
        attribution: map.attribution,
        category: map.category,
        last_updated: map.last_updated,
        title: map.title,
        raw_abstract: map.raw_abstract,
        raw_purpose: map.raw_purpose,
        regions: map.regions,
        link: map.link, // This property should be passed as parameter in getMap method 
        links: map.links,
        spatial_representation_type: map.spatial_representation_type,
        state: map.state,
        thumbnail_url: map.thumbnail_url,
        maplayers: map.maplayers
      }));
      console.log('map details in store', state.mapsDetails);
    },
    // set mapLayers with the maplayers of the selected map
    // setSelectedMap(state, map) {
    //   //console.log('selected map in store', map);
    //   state.selectedMap = map;
    //   state.mapLayers = map.maplayers.map(layer => {
    //     const legendLinks = layer.dataset.links.filter(link => link.name === 'Legend');
    //     return {
    //       ...layer,
    //       dataset: {
    //         ...layer.dataset,
    //         links: legendLinks
    //       }
    //     };
    //   });
    //   console.log('layers in store', state.mapLayers);
    // },
    setMap(state, map) {
      //console.log('selected map in store', map);
      state.selectedMap = {
      pk: map.pk,
      resource_type: map.resource_type,
      attribution: map.attribution,
      category: map.category,
      last_updated: map.last_updated,
      title: map.title,
      raw_abstract: map.raw_abstract,
      raw_purpose: map.raw_purpose,
      regions: map.regions,
      link: map.link,
      links: map.links,
      spatial_representation_type: map.spatial_representation_type,
      state: map.state,
      thumbnail_url: map.thumbnail_url,
      maplayers: map.maplayers
      };
      console.log('processed map in store', state.selectedMap);
      // set mapLayers with a reduced version of the maplayers of the selected map containig only pk, name, opacity, visibility and order
      state.mapLayers = map.maplayers
      console.log('layers in store', state.mapLayers);
    },
    updateLayerOpacity(state, { datasetId, newOpacity }) {
      const layer = state.mapLayers.find(layer => layer.dataset && layer.dataset.pk === parseInt(datasetId));
      if (layer) {
        layer.opacity = newOpacity;
      }
    },
    updateLayerVisibility(state, { datasetId, newVisibility }) {
      const layer = state.mapLayers.find(layer => layer.dataset && layer.dataset.pk === parseInt(datasetId));
      if (layer) {
        layer.visibility = newVisibility;
      }
    },
    clearSelectedMap(state) {
      state.selectedMap = null;
    },
    setCategories(state, categories) {
      // Filter categories with "count" property greater than 0
      const filteredCategories = categories.filter(category => category.count > 0);
      // Set the state with the filtered categories
      state.categories = filteredCategories;
      //console.log('filtered categories in store', state.categories);
    },
    setDatasets(state, datasets) {
      // Map over datasets and find the corresponding category for each dataset
      const updatedDatasets = datasets.map(dataset => {
      // Iterate categories to find the corresponding category for each dataset
      for (const category of state.categories) {
        if (category.identifier === dataset.category?.identifier) {
        // Create a new dataset object with the joined category.gen_description property
        return {
          ...dataset,
          category: {
          ...dataset.category,
          gn_description: category.gn_description
          }
        };
        }
      }
      // If no matching category is found, return the original dataset object
      return dataset;
      });
      for (const dataset of updatedDatasets) {
        // check if dataset is present in mapLayers
        const found = state.mapLayers.find(layer => parseInt(layer.dataset.pk) === parseInt(dataset.pk));
        // if present add a property to the dataset object called "mapLayer" set to true, else set to false
        dataset.mapLayer = found ? true : false;
        // if present add layer.dataset.order layer.dataset.visibility and layer.dataset.opacity to the dataset object
        if (found) {
          dataset.order = found.order;
          dataset.visibility = found.visibility;
          dataset.opacity = found.opacity;
        }// else set those to null
        else {
          dataset.order = null;
          dataset.visibility = null;
          dataset.opacity = null;
        }
      }
      state.datasets = updatedDatasets;
      console.log('datasets in store', state.datasets);
      // for every dataset run fetchStyle
      for (const dataset of state.datasets) {
        this.dispatch('fetchStyle', dataset.alternate);
      }
    },
    setStyles(state, style) {
      // parse xml string to xml document
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(style, 'text/xml');
      // maps attributes and values to a JSON object
      const styleJSON = {};
      //console.log('xmlDoc', xmlDoc);
      const layerName = xmlDoc.getElementsByTagName('sld:Name')[0].textContent;
      //console.log('layerName', layerName);
      const featureTypeStyles = xmlDoc.getElementsByTagName('sld:FeatureTypeStyle');
      const rules = featureTypeStyles[0].getElementsByTagName('sld:Rule');
      console.log('rules', rules[0]);
      // find all rules
      for (let i = 0; i < rules.length; i++) {
        const nameElement = rules[i].getElementsByTagName('sld:Name')[0];
        if (nameElement) {
          const name = nameElement.textContent;
          const symbolizer = {
            name: name
          };
    
          // Check for PolygonSymbolizer
          const polygonSymbolizer = rules[i].getElementsByTagName('sld:PolygonSymbolizer')[0];
          if (polygonSymbolizer) {
            const fill = polygonSymbolizer.getElementsByTagName('sld:Fill')[0];
            //const stroke = polygonSymbolizer.getElementsByTagName('sld:Stroke')[0]; //stroke is not always present
            symbolizer.fill = { color: fill.getElementsByTagName('sld:CssParameter')[0].textContent };
            //symbolizer.stroke = { color: stroke.getElementsByTagName('sld:CssParameter')[0].textContent };
            symbolizer.type = 'Polygon';
          }
    
          // Check for PointSymbolizer
          const pointSymbolizer = rules[i].getElementsByTagName('sld:PointSymbolizer')[0];
          if (pointSymbolizer) {
            const graphic = pointSymbolizer.getElementsByTagName('sld:Graphic')[0];
            const mark = graphic.getElementsByTagName('sld:Mark')[0];
            const fill = mark.getElementsByTagName('sld:Fill')[0];
            const size = graphic.getElementsByTagName('sld:Size')[0];
            symbolizer.mark = { fill: { color: fill.getElementsByTagName('sld:CssParameter')[0].textContent } };
            symbolizer.size = size.textContent;
            symbolizer.type = 'Point';
          }
    
          // Check for LineSymbolizer
          const lineSymbolizer = rules[i].getElementsByTagName('sld:LineSymbolizer')[0];
          if (lineSymbolizer) {
            const stroke = lineSymbolizer.getElementsByTagName('sld:Stroke')[0];
            symbolizer.stroke = {
              color: stroke.getElementsByTagName('sld:CssParameter')[0].textContent,
              //width: parseFloat(stroke.querySelector('sld\\:CssParameter[name="stroke-width"]').textContent) //stroke-width is not always present
            };
            symbolizer.type = 'Line';
          }

          const filter = rules[i].getElementsByTagName('ogc:Filter')[0];
          if (filter) {
            const propertyIsEqualTo = filter.getElementsByTagName('ogc:PropertyIsEqualTo')[0];
            if (propertyIsEqualTo) {
              const propertyName = propertyIsEqualTo.getElementsByTagName('ogc:PropertyName')[0].textContent;
              const literal = propertyIsEqualTo.getElementsByTagName('ogc:Literal')[0].textContent;
              symbolizer.filter = { propertyName: propertyName, literal: literal };
            }
          }

          // add a visibility property to the symbolizer set to true by default
          symbolizer.visibility = true;
    
          styleJSON[i] = symbolizer;
        }
      }

      const allStyles = Object.keys(styleJSON).reduce((acc, key) => {
        const modifiedStyle = { ...styleJSON[key] };
        return { ...acc, [Number(key)]: modifiedStyle };
      }, {});
      state.styles = { ...state.styles, [layerName]: allStyles };
      console.log('styles in store', state.styles);
    },
    setCQLfilter(state, filters) {
      // check if filters.datasetName is present in cqlFilters
      const index = state.cqlFilters.findIndex(filter => filter.datasetName === filters.datasetName);
      // if present replace the filter if not push the filter
      if (index !== -1) {
        state.cqlFilters[index] = filters;
      } else {
        state.cqlFilters.push(filters);
      }
      console.log('cqlFilters in store', state.cqlFilters);
    },
    setMapCenter(state, center) {
      // Reproject the center from EPSG:3857 to EPSG:4326
      center = toLonLat(center);
      state.mapLocation.lng = center[0];
      state.mapLocation.lat = center[1];
    },
    setMapZoom(state, zoom) {
      state.mapLocation.zoom = zoom;
    },
    setMapDatasets(state, datasets) {
      state.mapDatasets = datasets;
    },
    openSecondDrawer(state) {
      state.secondDrawer = true;
    },
    closeSecondDrawer(state) {
      state.secondDrawer = false;
    },
    setMarkedCoordinate(state, coordinate) {
      state.markedCoordinate = coordinate;
      //console.log('marked coordinate in store', state.markedCoordinate);
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
          template = template.replace(/<pre>/g, '<pre style="white-space: pre-wrap; font-family: sans-serif">');

          // Remove all "null" text
          template = template.replace(/- null/g, '');

          // Set feature.featureinfo_custom_template with transformed template
          feature.featureinfo_custom_template = template;
        }
        feature.title = correspondingDataset.dataset.title;
    
        return feature;
      });
    
      // Push the modified features to the state
      state.features.push(...modifiedFeatures);
      //console.log('features in store', state.features);
    },
    joinCategoryToMapLayers(state) {
      // Iterate over mapDatasets and print each dataset's pk
      //state.mapDatasets.forEach(dataset => {
      //  console.log('typeof dataset.dataset.pk:', typeof dataset.dataset.pk);
      //  console.log('dataset.pk:', dataset.dataset.pk);
      //});

      // Iterate over mapLayers
      state.mapLayers.forEach(layer => {
        // Check if layer has dataset and pk
        if (layer.dataset.pk) {
          // Print pk
          //console.log('typeof layer.dataset.pk:', typeof layer.dataset.pk);
          //console.log('layer.dataset.pk:', layer.dataset.pk);

          // Find the corresponding dataset in mapDatasets
          const dataset = state.mapDatasets.find(dataset => Number(dataset.dataset.pk) === Number(layer.dataset.pk));
          //console.log('matching dataset', dataset);
  
          // If a corresponding dataset is found, add the dataset's category to the layer's dataset
          if (dataset) {
            layer.dataset = {
              ...layer.dataset,
              category: dataset.dataset.category,
            };
          }
        }
      });
  
      //console.log('Updated mapLayers:', state.mapLayers);
    },
    resetFeatures(state) {
      state.features = [];
    },
    setTracedFeature(state, geometry) {
      state.tracedFeature = geometry;
      //console.log('traced feature in store', state.tracedFeature);
    },
    resetTracedFeature(state) {
      state.tracedFeature = null;
    },
    setSearchFeatures(state, features) {
      state.searchFeatures = features;
    },
    setFilterFeatures(state, features) {
      state.filterFeatures = features;
    },
    SET_MAP_LOCATION(state, location) {
      state.mapLocation = location;
      //console.log('map location in store', state.mapLocation);
    },
    // other mutations...
  },
  actions: {
    // Get all maps from GeoNode
    async fetchMaps({ commit }) {
      const url = process.env.VUE_APP_NODE_URL;
      const api = process.env.VUE_APP_NODE_API_ENDPOINT;
      const response = await axios.get(`${url}${api}maps/`);
      commit('setMaps', response.data.maps); // To be deprecated
      commit('setAllMapDetails', response.data.maps);
      // Return the maps
      console.log('maps in store', response.data.maps);
      return response.data.maps;
    },
    // Get a single map from GeoNode. To be deprecated
    async fetchMap({ commit }, mapId) {
      const url = process.env.VUE_APP_NODE_URL;
      const api = process.env.VUE_APP_NODE_API_ENDPOINT;
      const response = await axios.get(`${url}${api}maps/${mapId}`);
      commit('setMap', response.data);
      // Return the map
      return response.data;
    },
    // Get a single map from GeoNode. To be implemented in the future
    getMap({ commit }, link) {
      axios.get(link).then(response => {
        commit('setMap', response.data);
      });
    },
    // Get all categories from GeoNode
    async fetchCategories({ commit, dispatch }) {
      const url = process.env.VUE_APP_NODE_URL;
      const api = process.env.VUE_APP_NODE_API_ENDPOINT;
      let page = 1;
      let categories = [];
      let total = 0;

      do {
      const response = await axios.get(`${url}${api}categories/?page=${page}`);
      categories.push(...response.data.categories);
      total = response.data.total;
      page++;
      } while (categories.length < total);

      console.log('categories in store', categories);
      commit('setCategories', categories);
      // After setting categories, dispatch fetchDatasets to fetch datasets
      await dispatch('fetchAllDatasets');
    },
    // Implement this method to fetch all datasets -- add commit('setMapDatasets', datasets) to the fetchAllDatasets method
    async fetchAllDatasets({ commit }) {
      const url = process.env.VUE_APP_NODE_URL;
      const api = process.env.VUE_APP_NODE_API_ENDPOINT;
      let page = 1;
      let datasets = [];
      let total = 0;

      do {
        const response = await axios.get(`${url}${api}datasets/?page=${page}`);
        datasets.push(...response.data.datasets);
        total = response.data.total;
        page++;
      } while (datasets.length < total);

      //console.log('datasets to commit', datasets);
      commit('setDatasets', datasets);
    },
    fetchStyle({ commit }, layerName) {
      const wmsURL = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
      const getStyleRequest = `${wmsURL}?request=GetStyles&layers=${layerName}&service=wms&version=1.1.1`;
      //console.log('getStyleRequest', getStyleRequest);
      axios.get(getStyleRequest).then(response => {
        //console.log('style response', response.data);
        commit('setStyles', response.data);
      });
    },
    // Get search-result features to be added to the map
    fetchFeatures({ state, commit }) {
      commit('resetFeatures'); // reset features to an empty array
  
      const coordinate = state.markedCoordinate;
      const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
  
      // Loop over the mapLayers array
      for (const layer of state.mapLayers) {
        const layerName = layer.name;
  
        // Construct the GetFeature request
        const getFeatureRequest = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=epsg:3857&cql_filter=INTERSECTS(geometry, POINT(${coordinate[0]} ${coordinate[1]}))`;
        axios.get(getFeatureRequest).then(response => {
          commit('setFeatures', response.data.features);
        });
      }
    },
    // Get place-search features to be added to the map
    async fetchSearchFeatures({commit}) {
      try {
        const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
        const response = await axios.get(wfsUrl, {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'geonode:juntas_vecinos',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326',
            // Add any other parameters you need...
          },
        });
    
        const featuresWithCentroids = response.data.features.map(feature => {
          const centroid = turf.centroid(feature);
          return { ...feature, geometry: centroid.geometry };
        });
    
        commit('setSearchFeatures', featuresWithCentroids);
        //console.log('search features in store', featuresWithCentroids);
      } catch (error) {
        console.error('Failed to fetch features:', error);
      }
    },
    // Get filter features to be added to the map - this method coul be deprecated
    async fetchFilterFeatures({commit}) {
      try {
        const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
        const response = await axios.get(wfsUrl, {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'geonode:zonas_estructuracion',
            outputFormat: 'application/json',
            srsName: 'EPSG:3857',
            // Add any other parameters you need...
          },
        });
    
        commit('setFilterFeatures', response.data.features);
        //console.log('filter features in store', response.data.features);
      } catch (error) {
        console.error('Failed to fetch features:', error);
      }
    },
    // Deprecate this method due to the use of the new method fetchDatasets
    async fetchDatasets({ commit, state }) {
      const datasets = [];
      for (const layer of state.mapLayers) {
        const url = process.env.VUE_APP_NODE_URL;
        const api = process.env.VUE_APP_NODE_API_ENDPOINT;
        const response = await axios.get(`${url}${api}datasets/${layer.dataset.pk}`);
        datasets.push(response.data);
      }
      commit('setMapDatasets', datasets);
      //console.log('datasets in store', state.mapDatasets);
      commit('joinCategoryToMapLayers');
    },
    
    traceFeature({ commit }, geometry) {
      commit('setTracedFeature', geometry);
      //console.log('traced feature in store', geometry);
    },
    markCoordinate({ commit }, coordinate) {
      commit('setMarkedCoordinate', coordinate);
      commit('resetTracedFeature');
    },
    updateMapLocation({ commit }, location) {
        commit('SET_MAP_LOCATION', location);
    },
    // other actions...
  },
  modules: {
  }
})
