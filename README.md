# leaflet-geocoder-ban [![NPM version](https://img.shields.io/npm/v/leaflet-geocoder-ban.svg)](https://www.npmjs.com/package/leaflet-geocoder-ban) ![Leaflet 1.0.0 compatible!](https://img.shields.io/badge/Leaflet%201.0.0-%E2%9C%93-1EB300.svg?style=flat)
A simple Leaflet Plugin to add a geocoding control to your map, powered by the french [BAN](https://adresse.data.gouv.fr/) (Base Adresse Nationale) API. This API only covers French addresses.

Check the online [demo](https://eig-2017.github.io/leaflet-geocoder-ban/demo/).

# Installation

You can either:
* install with npm `npm install --save leaflet-geocoder-ban`

or

* clone the git repository

# Usage
First, load the leaflet files as usual.

Then, Load the two leaflet-geocoder-ban files located in the src folder :
```html
<script src="leaflet-geocoder-ban.js"></script>
<link rel="stylesheet" href="leaflet-geocoder-ban.css">
```

In your javascript code, create a Leaflet map as usual:
```
var map = L.map('mapid').setView([45.853459, 2.349312], 6)

L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(map)
```

And add:
```
var geocoder = L.geocoderBAN().addTo(map)
```

# Options
You can pass some options to the geocoderBAN() function:

