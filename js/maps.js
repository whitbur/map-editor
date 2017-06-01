map = null;
(function(){
    var mapsApp = angular.module('mapsApp', []);

    mapsApp.config(['$locationProvider', function($locationProvider) {
        $locationProvider.html5Mode({enabled: true, requireBase: false});
    }]);

    mapsApp.controller('MapsCtrl', ['$scope', '$timeout', '$http', '$location', function($scope, $timeout, $http, $location) {
        $scope.formData = {}; // For password form. Weird angular ng-model rules: https://github.com/angular/angular.js/wiki/Understanding-Scopes
        $scope.editor = false;
        $scope.editorTab = 'layers';
        $scope.saved = 'none';
        $scope.latlng = L.latLng(0,0);
        $scope.map = L.map('map', {crs: L.CRS.Simple, minZoom: -3});
        $scope.layers = [];
        $scope.markers = [];
        map = $scope.map;

        var boundsFromCenterSize = function(center, size) {
            var c = JSON.parse('['+center+']');
            var s = JSON.parse('['+size+']');
            var w2 = s[0]/2;
            var h2 = s[1]/2;
            return [[c[1]-h2,c[0]-w2],[c[1]+h2,c[0]+w2]];
        }
        $http.get('map.json')
            .then(function(successData) {
                $scope.layers = successData.data.layers;
                $scope.markers = successData.data.markers;
                if ($scope.layers.length > 0) {
                    var layer = $scope.layers[0];
                    var mapBounds = boundsFromCenterSize(layer.center, layer.size);
                    if ($location.search()['topLeft'] != null && $location.search()['bottomRight'] != null) {
                        var tl = JSON.parse('['+$location.search()['topLeft']+']');
                        var br = JSON.parse('['+$location.search()['bottomRight']+']');
                        mapBounds = [[tl[1], tl[0]], [br[1], br[0]]];
                    }
                    $scope.map.fitBounds(mapBounds);
                }
            });

        $scope.refreshMap = function() {
            $scope.map.eachLayer(function(layer){$scope.map.removeLayer(layer);});
            $.each($scope.layers, function(index, layer) {
                try {
                    bounds = boundsFromCenterSize(layer.center, layer.size);
                    L.imageOverlay(layer.url, bounds).addTo($scope.map);
                } catch(e) {}
            });
            $.each($scope.markers, function(index, marker) {
                try {
                    var coords = JSON.parse('['+marker.coords+']');
                    L.marker([coords[1],coords[0]], {title: marker.title, icon: L.AwesomeMarkers.icon({icon: marker.icon, markerColor: marker.color})}).addTo($scope.map);
                } catch(e) {}
            });
            L.simpleGraticule({
                interval: 20,
                redraw: 'moveend',
                showOriginLabel: true,
                zoomIntervals: [
                  {start: -10, end: -2, interval: 1000},
                  {start: -2, end: -1, interval: 500},
                  {start: -1, end: 0, interval: 200},
                  {start: 0, end: 2, interval: 100},
                  {start: 2, end: 3, interval: 50},
                  {start: 3, end: 4, interval: 25},
                  {start: 4, end: 5, interval: 5},
                  {start: 6, end: 20, interval: 1},
            ]}).addTo($scope.map);
        };
        $scope.refreshMap();
        $scope.addLayer = function() {
            $scope.layers.push({url:'http://cds130.org/wiki/images/digitizationgrid1a.svg',center:'500,500',size: '100,100'});
        };
        $scope.addMarker = function() {
            $scope.markers.push({coords:'500,500', icon: '', color: 'red', title:"New Marker"});
        };
        $scope.save = function() {
            $http.post('save_map.php', {password: $scope.formData.password, map: {layers:$scope.layers, markers:$scope.markers}})
                .then(function(successData) {
                    $scope.saved = 'success';
                    $timeout(function(){
                        $scope.saved = 'none';
                    }, 3000);
                }, function(errorData) {
                    $scope.saved = 'error';
                    $timeout(function(){
                        $scope.saved = 'none';
                    }, 3000);
                })
        };

        $scope.toggleEditor = function() {
            $scope.editor = !$scope.editor;
        };

        $scope.isEmbed = function() {
            return window.location.search.match(/embed/i) != null;
        };
        
        $scope.map.on('mousemove', function(event) {
            $scope.latlng = event.latlng;
            $scope.$apply();
        });
        $scope.$watch('layers', function(){ $scope.refreshMap(); }, true);
        $scope.$watch('markers', function(){ $scope.refreshMap(); }, true);
    }]);
})();
