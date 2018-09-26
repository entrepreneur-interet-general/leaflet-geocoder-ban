# leaflet-geocoder-ban [![NPM version](https://img.shields.io/npm/v/leaflet-geocoder-ban.svg)](https://www.npmjs.com/package/leaflet-geocoder-ban) ![Leaflet 1.0.0 compatible!](https://img.shields.io/badge/Leaflet%201.0.0-%E2%9C%93-1EB300.svg?style=flat)
A simple Leaflet Plugin to add a geocoding control to your map, powered by the french [BAN](https://adresse.data.gouv.fr/) (Base Adresse Nationale) API. This API only covers French addresses.

Check the online demos : [demo1](https://entrepreneur-interet-general.github.io/leaflet-geocoder-ban/demo/demo_control.html) and [demo2](https://entrepreneur-interet-general.github.io/leaflet-geocoder-ban/demo/demo_search_bar.html).

# Installation

You can either:
* install with npm `npm install --save leaflet-geocoder-ban`

or

* clone the git repository

# Usage
First, load the leaflet files as usual.

Then, load the two leaflet-geocoder-ban files : the js and the css.

They are located in the src folder and minified versions are provided in the dist folder. You can load them directly in your html page :

```html
<script src="leaflet-geocoder-ban.js"></script>
<link rel="stylesheet" href="leaflet-geocoder-ban.css">
```

In your javascript code, create a Leaflet map:
```javascript
var map = L.map('mapid').setView([45.853459, 2.349312], 6)

L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
attribution: 'map attribution'}).addTo(map)
```

And add the geocoder:
```javascript
var geocoder = L.geocoderBAN().addTo(map)
```

# Options
You can pass some options to the `geocoderBAN()` function:

| option                     | type        | default      | description
|----------------------------|-------------|--------------|-----------------|
| position                   | string      | 'topleft'    | Control [position](http://leafletjs.com/reference.html#control) |
| placeholder                | string      | 'adresse'    | Placeholder of the text input |
| resultsNumber              | integer     |  7           | Default number of address results suggested |
| collapsed                  | boolean     | true         | Initial state of the control, collapsed or expanded |
| autofocus                  | boolean     | true         | If the initial state of the control is expanded, choose wether the input is autofocused on page load|
| serviceUrl                 | string      | 'https://api-adresse.data.gouv.fr/search/' | API of the url
| minIntervalBetweenRequests |integer      | 250          | delay in milliseconds between two API calls made by the geocoder |
| style                      | string      | 'control'    | style of the geocoder, either 'control' or 'searchBar'. See the two demos page. |

## example

```javascript
var options = {
  position: 'topright',
  collapsed: 'false'
}

var geocoder = L.geocoderBAN(options).addTo(map)
```

# Custom markgeocode function 
When you select a result on the geocoder, it calls a default `markGeocode` function. If you want to call a custom function, override it. It receives as argument the result given by the BAN API as described [here](https://adresse.data.gouv.fr/api)

```javascript
var geocoder = L.geocoderBAN({ collapsed: true }).addTo(map)

geocoder.markGeocode = function (feature) {
  var latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
  map.setView(latlng, 14)

  var popup = L.popup()
    .setLatLng(latlng
    .setContent(feature.properties.label)
    .openOn(map)
  }
})
```

# Methods

| method           |    description              |
|------------------|-----------------------------|
| remove()         | removes the geocoder       |

Those methods are only available for the 'control' style (and not for the 'searchBar' style):

| method           |    description              |
|------------------|-----------------------------|
| collapse()       | collapses the geocoder      |
| expand()         | expands the geocoder        |
| toggle()         | toggles between expanded and collapsed state |

## example

```javascript
var geocoder = L.geocoderBAN().addTo(map)

map.on('contextmenu', function () {
  geocoder.toggle()
})
```

# Customize the search bar look
Customization of the search bar CSS is available through the searchBar class. For example :

```css
.searchBar {
  border: 1px solid red !important;
  max-width: 500px;
}
```
