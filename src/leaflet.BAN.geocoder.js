L.GeocoderBAN = L.Control.extend({
  options: {
    position: 'topleft',
    placeholder: 'adresse',
    resultsNumber: 5,
    collapsed: false,
    serviceUrl: 'https://api-adresse.data.gouv.fr/search/',
    minIntervalBetweenRequests: 250,
    defaultMarkgeocode: true
  },
  includes: L.Evented.prototype || L.Mixin.Events,
  initialize: function(options) {
    L.Util.setOptions(this, options);
  },
  onAdd: function(map) {
    var className = 'leaflet-control-geocoder-ban',
    container = this._container = L.DomUtil.create('div', className + ' leaflet-bar'),
    icon = this._icon = L.DomUtil.create('button', className + '-icon', container),
    form = this._form = L.DomUtil.create('div', className + '-form', container),
    input;

    this._map = map;
    map.on('click', this._collapse, this);

    icon.innerHTML = '&nbsp;';
    icon.type = 'button';

    input = this._input = L.DomUtil.create('input', '', form);
    input.type = 'text';
    input.placeholder = this.options.placeholder;

    this._alts = L.DomUtil.create('ul',
      className + '-alternatives ' + className + '-alternatives-minimized',
      container);

    L.DomEvent.on(icon, 'click', this._toggle, this);
    L.DomEvent.addListener(input, 'keyup', this._keyup, this);
    if (this.options.defaultMarkgeocode) {
      this.on('markgeocode', this.markGeocode, this);
    }

    L.DomEvent.disableScrollPropagation(container)
    L.DomEvent.disableClickPropagation(container)

    if (!this.options.collapsed) { this._expand(); }

    return container;
  },
  _toggle: function () {
    if (this._container.classList.contains('leaflet-control-geocoder-ban-expanded')) {
      this._collapse();
    } else {
      this._expand();
    }
  },
  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-ban-expanded');
    if (this._geocodeMarker) {
      this._map.removeLayer(this._geocodeMarker);
    }
    this._input.select();
  },
  _collapse: function () {
    L.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-ban-expanded');
    L.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-ban-alternatives-minimized');
    this._input.blur();
  },
  _moveSelection: function(direction) {
    var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected');
    var el;
    if (!s.length) {
        el = this._alts[direction < 0 ? 'firstChild' : 'lastChild'];
        L.DomUtil.addClass(el, 'leaflet-control-geocoder-ban-selected');
    } else {
        var currentSelection = s[0]
        L.DomUtil.removeClass(currentSelection, 'leaflet-control-geocoder-ban-selected');
        el = direction > 0 ? currentSelection.previousElementSibling : currentSelection.nextElementSibling;
    }
    if (el) {
      L.DomUtil.addClass(el, 'leaflet-control-geocoder-ban-selected');
    }
  },
  _keyup: function(e) {
    switch (e.keyCode) {
      case 27:
        // escape
        this._collapse();
        break;
      case 38:
        // down
        this._moveSelection(1);
        L.DomEvent.preventDefault(e);
        break;
      case 40:
        // up
        this._moveSelection(-1);
        L.DomEvent.preventDefault(e);
        break;
      case 13:
        // enter
        var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected')
        if (s.length) {
          this._geocodeResult(s[0]._geocodedFeatures);
        }
        break;
      default:
        if (this._input.value) {
          var params = {q: this._input.value, limit: this.options.resultsNumber};
          var t = this;
          if (this._setTimeout) {
            clearTimeout(this._setTimeout);
          }
          //avoid responses collision if typing quickly
          this._setTimeout = setTimeout(function () {
            getJSON(t.options.serviceUrl, params, t._displayResults(t));
          }, this.options.minIntervalBetweenRequests);
        } else {
          this._clearResults();
        }
    }
  },
  _clearResults () {
    while (this._alts.firstChild) {
      this._alts.removeChild(this._alts.firstChild);
    }
  },
  _displayResults: function (t) {
    t._clearResults();
    return function (res) {
      var features = res.features;
      L.DomUtil.removeClass(t._alts, 'leaflet-control-geocoder-ban-alternatives-minimized');
      for (var i = 0; i < Math.min(features.length, t.options.resultsNumber); i++) {
        t._alts.appendChild(t._createAlt(features[i], i));
      }
    }
  },
  _createAlt: function (feature, index) {
    var li = L.DomUtil.create('li', ''),
      a = L.DomUtil.create('a', '', li);
    li.setAttribute('data-result-index', index);
    a.innerHTML = feature.properties.label;
    li._geocodedFeatures = feature
    clickHandler = function (e) {
        this._collapse();
        this._geocodeResult(feature);
    }
    mouseOverHandler = function (e) {
        var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected');
        if (s.length) {
          L.DomUtil.removeClass(s[0], 'leaflet-control-geocoder-ban-selected');
        }
        L.DomUtil.addClass(li, 'leaflet-control-geocoder-ban-selected');
    }
    mouseOutHandler = function (e) {
        L.DomUtil.removeClass(li, 'leaflet-control-geocoder-ban-selected');
    }
    L.DomEvent.on(li, 'click', clickHandler, this);
    L.DomEvent.on(li, 'mouseover', mouseOverHandler, this);
    L.DomEvent.on(li, 'mouseout', mouseOutHandler, this);
    return li;
  },
  _geocodeResult: function (feature) {
    this._collapse();
    this.fire('markgeocode', {geocode: feature});
  },
  markGeocode: function (result) {
    var f = result.geocode;
    var latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]]
    this._map.setView(latlng, 14)
    this._geocodeMarker = new L.Marker(latlng)
      .bindPopup(f.properties.label)
      .addTo(this._map)
      .openPopup();
  }
});

L.geocoderBAN = function (options) {
  return new L.GeocoderBAN(options);
};

function getJSON (url, params, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState !== 4){
      return;
    }
    if (xmlHttp.status !== 200 && xmlHttp.status !== 304){
      callback('');
      return;
    }
    callback(JSON.parse(xmlHttp.response));
  };
  xmlHttp.open('GET', url + L.Util.getParamString(params), true);
  xmlHttp.setRequestHeader('Accept', 'application/json');
  xmlHttp.send(null);
}
