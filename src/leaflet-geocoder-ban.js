/* global define, XMLHttpRequest */

const f = function fFunc (factory, window) {
  // Universal Module Definition
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory)
  } else if (typeof module !== 'undefined') {
    // Node/CommonJS
    module.exports = factory(require('leaflet'))
  } else {
    // Browser globals
    if (typeof window.L === 'undefined') {
      throw new Error('Leaflet must be loaded first')
    }
    factory(window.L)
  }
}

const factory = function factoryFunc (L) {
  L.GeocoderBAN = L.Control.extend({
    options: {
      position: 'topleft',
      placeholder: 'adresse',
      resultsNumber: 5,
      collapsed: true,
      serviceUrl: 'https://api-adresse.data.gouv.fr/search/',
      minIntervalBetweenRequests: 250,
      defaultMarkgeocode: true
    },
    includes: L.Evented.prototype || L.Mixin.Events,
    initialize: function (options) {
      L.Util.setOptions(this, options)
    },
    onAdd: function (map) {
      var className = 'leaflet-control-geocoder-ban'
      var container = this.container = L.DomUtil.create('div', className + ' leaflet-bar')
      var icon = this.icon = L.DomUtil.create('button', className + '-icon', container)
      var form = this.form = L.DomUtil.create('div', className + '-form', container)
      var input

      this.map = map
      map.on('click', this.collapse, this)

      icon.innerHTML = '&nbsp;'
      icon.type = 'button'

      input = this.input = L.DomUtil.create('input', '', form)
      input.type = 'text'
      input.placeholder = this.options.placeholder

      this.alts = L.DomUtil.create('ul',
        className + '-alternatives ' + className + '-alternatives-minimized',
        container)

      L.DomEvent.on(icon, 'click', this.toggle, this)
      L.DomEvent.addListener(input, 'keyup', this.keyup, this)
      if (this.options.defaultMarkgeocode) {
        this.on('markgeocode', this.markGeocode, this)
      }

      L.DomEvent.disableScrollPropagation(container)
      L.DomEvent.disableClickPropagation(container)

      if (!this.options.collapsed) { this.expand() }

      return container
    },
    toggle: function () {
      if (this.container.classList.contains('leaflet-control-geocoder-ban-expanded')) {
        this.collapse()
      } else {
        this.expand()
      }
    },
    expand: function () {
      L.DomUtil.addClass(this.container, 'leaflet-control-geocoder-ban-expanded')
      if (this.geocodeMarker) {
        this.map.removeLayer(this.geocodeMarker)
      }
      this.input.select()
    },
    collapse: function () {
      L.DomUtil.removeClass(this.container, 'leaflet-control-geocoder-ban-expanded')
      L.DomUtil.addClass(this.alts, 'leaflet-control-geocoder-ban-alternatives-minimized')
      this.input.blur()
    },
    moveSelection: function (direction) {
      var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected')
      var el
      if (!s.length) {
        el = this.alts[direction < 0 ? 'firstChild' : 'lastChild']
        L.DomUtil.addClass(el, 'leaflet-control-geocoder-ban-selected')
      } else {
        var currentSelection = s[0]
        L.DomUtil.removeClass(currentSelection, 'leaflet-control-geocoder-ban-selected')
        if (direction > 0) {
          el = currentSelection.previousElementSibling ? currentSelection.previousElementSibling : this.alts['lastChild']
        } else {
          el = currentSelection.nextElementSibling ? currentSelection.nextElementSibling : this.alts['firstChild']
        }
      }
      if (el) {
        L.DomUtil.addClass(el, 'leaflet-control-geocoder-ban-selected')
      }
    },
    keyup: function (e) {
      switch (e.keyCode) {
        case 27:
          // escape
          this.collapse()
          break
        case 38:
          // down
          this.moveSelection(1)
          L.DomEvent.preventDefault(e)
          break
        case 40:
          // up
          this.moveSelection(-1)
          L.DomEvent.preventDefault(e)
          break
        case 13:
          // enter
          var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected')
          if (s.length) {
            this.geocodeResult(s[0].geocodedFeatures)
          }
          break
        default:
          if (this.input.value) {
            var params = {q: this.input.value, limit: this.options.resultsNumber}
            var t = this
            if (this.setTimeout) {
              clearTimeout(this.setTimeout)
            }
            // avoid responses collision if typing quickly
            this.setTimeout = setTimeout(function () {
              getJSON(t.options.serviceUrl, params, t.displayResults(t))
            }, this.options.minIntervalBetweenRequests)
          } else {
            this.clearResults()
          }
      }
    },
    clearResults () {
      while (this.alts.firstChild) {
        this.alts.removeChild(this.alts.firstChild)
      }
    },
    displayResults: function (t) {
      t.clearResults()
      return function (res) {
        if (res && res.features) {
          var features = res.features
          L.DomUtil.removeClass(t.alts, 'leaflet-control-geocoder-ban-alternatives-minimized')
          for (var i = 0; i < Math.min(features.length, t.options.resultsNumber); i++) {
            t.alts.appendChild(t.createAlt(features[i], i))
          }
        }
      }
    },
    createAlt: function (feature, index) {
      var li = L.DomUtil.create('li', '')
      var a = L.DomUtil.create('a', '', li)
      li.setAttribute('data-result-index', index)
      a.innerHTML = feature.properties.label
      li.geocodedFeatures = feature
      var clickHandler = function (e) {
        this.collapse()
        this.geocodeResult(feature)
      }
      var mouseOverHandler = function (e) {
        var s = document.getElementsByClassName('leaflet-control-geocoder-ban-selected')
        if (s.length) {
          L.DomUtil.removeClass(s[0], 'leaflet-control-geocoder-ban-selected')
        }
        L.DomUtil.addClass(li, 'leaflet-control-geocoder-ban-selected')
      }
      var mouseOutHandler = function (e) {
        L.DomUtil.removeClass(li, 'leaflet-control-geocoder-ban-selected')
      }
      L.DomEvent.on(li, 'click', clickHandler, this)
      L.DomEvent.on(li, 'mouseover', mouseOverHandler, this)
      L.DomEvent.on(li, 'mouseout', mouseOutHandler, this)
      return li
    },
    geocodeResult: function (feature) {
      this.collapse()
      this.fire('markgeocode', {geocode: feature})
    },
    markGeocode: function (result) {
      var f = result.geocode
      var latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]]
      this.map.setView(latlng, 14)
      this.geocodeMarker = new L.Marker(latlng)
        .bindPopup(f.properties.label)
        .addTo(this.map)
        .openPopup()
    }
  })

  const getJSON = function (url, params, callback) {
    var xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState !== 4) {
        return
      }
      if (xmlHttp.status !== 200 && xmlHttp.status !== 304) {
        return
      }
      callback(JSON.parse(xmlHttp.response))
    }
    xmlHttp.open('GET', url + L.Util.getParamString(params), true)
    xmlHttp.setRequestHeader('Accept', 'application/json')
    xmlHttp.send(null)
  }

  L.geocoderBAN = function (options) {
    return new L.GeocoderBAN(options)
  }
  return L.GeocoderBAN
}

f(factory, window)
