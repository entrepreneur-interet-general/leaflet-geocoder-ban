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
      style: 'control',
      placeholder: 'adresse',
      resultsNumber: 7,
      collapsed: true,
      serviceUrl: 'https://api-adresse.data.gouv.fr/search/',
      minIntervalBetweenRequests: 250,
      defaultMarkgeocode: true,
      autofocus: true
    },
    includes: L.Evented.prototype || L.Mixin.Events,
    initialize: function (options) {
      L.Util.setOptions(this, options)
    },
    onRemove: function (map) {
      map.off('click', this.collapseHack, this)
    },
    onAdd: function (map) {
      var className = 'leaflet-control-geocoder-ban'
      var container = this.container = L.DomUtil.create('div', className + ' leaflet-bar')
      var icon = this.icon = L.DomUtil.create('button', className + '-icon', container)
      var form = this.form = L.DomUtil.create('div', className + '-form', container)
      var input
      
      map.on('click', this.collapseHack, this)
      
      icon.innerHTML = '&nbsp;'
      icon.type = 'button'
      
      input = this.input = L.DomUtil.create('input', '', form)
      input.type = 'text'
      input.placeholder = this.options.placeholder
      
      this.alts = L.DomUtil.create('ul',
      className + '-alternatives ' + className + '-alternatives-minimized',
      container)
      
      L.DomEvent.on(icon, 'click', function (e) {
        this.toggle()
        L.DomEvent.preventDefault(e)
      }, this)
      L.DomEvent.addListener(input, 'keyup', this.keyup, this)
      
      L.DomEvent.disableScrollPropagation(container)
      L.DomEvent.disableClickPropagation(container)
      
      if (!this.options.collapsed) {
        this.expand()
        if (this.options.autofocus) {
          setTimeout(function () { input.focus() }, 250)
        }
      }
      if (this.options.style === 'searchBar') {
        L.DomUtil.addClass(container, 'searchBar')
        var rootEl = document.getElementsByClassName('leaflet-control-container')[0]
        rootEl.appendChild(container)
        return L.DomUtil.create('div', 'hidden')
      } else {
        return container
      }
    },
    minimizeControl() {
      if (this.options.style === 'control') {
        this.collapse()
      } else {
        // for the searchBar: only hide results, not the bar
        L.DomUtil.addClass(this.alts, 'leaflet-control-geocoder-ban-alternatives-minimized')
      }
    },
    toggle: function () {
      if (this.style != 'searchBar') {
        if (L.DomUtil.hasClass(this.container, 'leaflet-control-geocoder-ban-expanded')) {
          this.collapse()
        } else {
          this.expand()
        }
      }
    },
    expand: function () {
      L.DomUtil.addClass(this.container, 'leaflet-control-geocoder-ban-expanded')
      if (this.geocodeMarker) {
        this._map.removeLayer(this.geocodeMarker)
      }
      this.input.select()
    },
    collapse: function () {
      L.DomUtil.removeClass(this.container, 'leaflet-control-geocoder-ban-expanded')
      L.DomUtil.addClass(this.alts, 'leaflet-control-geocoder-ban-alternatives-minimized')
      this.input.blur()
    },
    collapseHack: function (e) {
      // leaflet bug (see #5507) before v1.1.0 that converted enter keypress to click.
      if (e.originalEvent instanceof MouseEvent) {
        this.minimizeControl()
      }
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
          this.minimizeControl()
          L.DomEvent.preventDefault(e)
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
          L.DomEvent.preventDefault(e)
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
          L.DomEvent.preventDefault(e)
      }
    },
    clearResults: function () {
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
      a.innerHTML = '<strong>' + feature.properties.label + '</strong>, ' + feature.properties.context
      li.geocodedFeatures = feature
      var clickHandler = function (e) {
        this.minimizeControl()
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
      this.minimizeControl()
      this.markGeocode(feature)
    },
    markGeocode: function (feature) {
      var latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
      this._map.setView(latlng, 14)
      this.geocodeMarker = new L.Marker(latlng)
        .bindPopup(feature.properties.label)
        .addTo(this._map)
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
