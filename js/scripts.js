/* Simplify array diffing */
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

$(document).ready(function() {
    var geocode = 'https://nominatim.openstreetmap.org/search.php?polygon_geojson=1&format=jsonv2&q=' + window.config['location'];
    var mapobj = {}
    var globalProj = ol.proj.get('EPSG:3857');
    var wmsProj = ol.proj.get('EPSG:4326');
    window.pointFeature ={};
    //  var globalProj = 'EPSG:3857';
    //var wmsProj = 'EPSG:4326';
    window.app = {};
    var app = window.app;
    window.streetList = [];
    window.usedStreets = [];
    window.currentStreet=[];
    window.questionPoints = 0;
    window.totalPoints = 0;
    window.streetSelected = "";
    window.drivingModeEnabled = false;


      /**
       * @constructor
       * @extends {ol.interaction.Pointer}
       */
      app.Drag = function() {

        ol.interaction.Pointer.call(this, {
          handleDownEvent: app.Drag.prototype.handleDownEvent,
          handleDragEvent: app.Drag.prototype.handleDragEvent,
          handleMoveEvent: app.Drag.prototype.handleMoveEvent,
          handleUpEvent: app.Drag.prototype.handleUpEvent
        });

        /**
         * @type {ol.Pixel}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.cursor_ = 'pointer';

        /**
         * @type {ol.Feature}
         * @private
         */
        this.feature_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.previousCursor_ = undefined;

      };
      ol.inherits(app.Drag, ol.interaction.Pointer);


      /**
       * @param {ol.MapBrowserEvent} evt Map browser event.
       * @return {boolean} `true` to start the drag sequence.
       */
      app.Drag.prototype.handleDownEvent = function(evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              return feature;
            });

        if (feature) {
          this.coordinate_ = evt.coordinate;
          this.feature_ = feature;
        }

        return !!feature;
      };


      /**
       * @param {ol.MapBrowserEvent} evt Map browser event.
       */
      app.Drag.prototype.handleDragEvent = function(evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              return feature;
            });

        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = /** @type {ol.geom.SimpleGeometry} */
            (this.feature_.getGeometry());
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
      };


      /**
       * @param {ol.MapBrowserEvent} evt Event.
       */
      app.Drag.prototype.handleMoveEvent = function(evt) {
        if (this.cursor_) {
          var map = evt.map;
          var feature = map.forEachFeatureAtPixel(evt.pixel,
              function(feature, layer) {
                return feature;
              });
          var element = evt.map.getTargetElement();
          if (feature) {
            if (element.style.cursor != this.cursor_) {
              this.previousCursor_ = element.style.cursor;
              element.style.cursor = this.cursor_;
            }
          } else if (this.previousCursor_ !== undefined) {
            element.style.cursor = this.previousCursor_;
            this.previousCursor_ = undefined;
          }
        }
      };


      /**
       * @param {ol.MapBrowserEvent} evt Map browser event.
       * @return {boolean} `false` to stop the drag sequence.
       */
      app.Drag.prototype.handleUpEvent = function(evt) {
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
      };



    /* Load street list */
    loadStreets();


    /* Generate Map */
    $.getJSON(geocode, function( response ) {
        // get lat + lon from first match.
        //var latlng =  response["0"].geojson.coordinates
        var latlng = [parseFloat( response["0"].lon ) , parseFloat( response["0"].lat )]
        window.intialLocation = latlng;
        window.pointFeature = new ol.Feature(new ol.geom.Point( ol.proj.fromLonLat( latlng, globalProj ) ));
        window.mapobj = new ol.Map({
         interactions: ol.interaction.defaults().extend([new app.Drag()]),
          target: 'map',
          layers: [
         new ol.layer.Tile({
              source: new ol.source.Stamen({
                layer: 'toner-lite',
                projection: globalProj
              })
            }),
          new ol.layer.Vector({
                source: new ol.source.Vector({
                  features: [pointFeature]
                }),
                style: new ol.style.Style({
                  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 38],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.70,
                    src: 'assets/marker.png'
                  }))
                })
              })

      ],
          view: new ol.View({
            projection: globalProj,
          //  center: ol.proj.transform( latlng, globalProj, wmsProj ),
            center: ol.proj.fromLonLat( latlng, globalProj ),
            zoom: 14,
            maxZoom: 15,
            minZoom: window.config["minzoom"]

          }),
        });

      });

    /* Check the changelog for changes */
    checkChangelog()

    /* Setup button actions */
    $('#settingsButton').click(function() {
      $("#setTotalStreets").val( window.config['quizlength'] );
      $("#setPointValue").val( window.config['pointvalue'] );
    });
    $('#btnsettingsModalsave').click(function() {
      if ( window.config['quizlength'] != $('#setTotalStreets').val() ||  window.config['pointvalue'] != $('#setPointValue').val() ) {
        window.config['quizlength'] = $('#setTotalStreets').val();
        window.config['pointvalue'] = $('#setPointValue').val();
        loadStreets();
        reset();
      }
    });
    $('#recenter').click(function() {
        centerMarker();
    });
    $('#skipStreet').click(function() {
      nextStreet();
    });
    $('#checkanswer').click(function() {
      checkStreetUnderMarker();
    });
    $('#reset').click(function() {
      reset();
    });
    $('#showhint').click(function() {
      showHint();
    });
    $('#drivingMode').click(function() {
      toggleDrivingMode();
      // Animate button
      $( "#drivingMode" ).removeAttr( "style" ).hide().fadeIn();
    });
});

/* FUNCTION: Load streetlist. Self explanitory */
function loadStreets() {
  $.getJSON("assets/streetlist.json", function(response) {
      if (window.config["quizlength"] > 0 ) {
        try {
          window.streetList = getRandom( response, window.config["quizlength"] );
        }
        catch(err) {
          window.streetList = response;
        }
      }
      else {
        window.streetList = response;
      }
      $('#totalPointsPossible').html( streetList.length * window.config['pointvalue'] );
      $('#totalStreets').html( streetList.length );
      nextStreet();

  });
}

/* Query streetname under marker */
function checkStreetUnderMarker() {
  var coord = window.pointFeature.getGeometry().getCoordinates();
  coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
  var lon = coord[0];
  var lat = coord[1];
  var revGeocode = 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon +'&zoom=17';
  var street = "";
  $.getJSON(revGeocode, function( response ) {
      // get lat + lon from first match
      var data = response;
      console.log( response.address.road )
      window.streetSelected = response.address.road;
    //  console.log(response)
      checkAnswer();

    });

    return 0;
}

/* Center marker on current map view */
function centerMarker() {
  var coordinate = pointFeature.getGeometry().getCoordinates();
  var center = mapobj.getView().getCenter()
  pointFeature.getGeometry().translate( center[0] - coordinate[0], center[1] - coordinate[1] );
}


/* Progress to next (random) street */
function nextStreet() {
  $('#completedStreets').html( usedStreets.length );
  var uniqueStreets = streetList.diff( usedStreets );
  if (uniqueStreets.length > 0 ) {
    window.currentStreet = uniqueStreets[Math.floor(Math.random() * uniqueStreets.length)];
    window.usedStreets.push( window.currentStreet );
    $('#street').html( window.currentStreet[0] );
    window.questionPoints = window.config['pointvalue'];
    $('#showhint').removeClass('disabled');
    $('#showhint').prop('disabled', false);
    updatePointDisplay();
  } else {
    updatePointDisplay();
    presentModal("All Done B!", "Hey! You've done it! You've gone through all of the streets! Go you!")
  }

}


/* Check Answer */
function checkAnswer() {
  if ( window.streetSelected === window.currentStreet[0] ) {
    window.totalPoints += questionPoints;
    presentModal("Yay! Correct!", "Awesome! You identified that street!")
    nextStreet();
  } else {
    if( window.questionPoints > 2 ) {
      presentModal("Ummm...", "Not quite. Try that again brother/sister!")
      window.questionPoints -= 1;
    } else {
      presentModal("Tough Luck...", "Maybe next time you'll get it. Next street!")
      nextStreet();
     }
  }
  updatePointDisplay();
}


/* Update Point Display */
function updatePointDisplay() {
  $('#questionPoints').html( questionPoints );
  $('#totalEarnedPoints').html( totalPoints );
}


/* Present Modal to user */
function presentModal(title="Street King Notification", text="Unknown Issue. Contact Jesus for further guidance") {
    $('.modal-title').html( title );
    $('#modal-text').html( text );
    $('#notification-modal').modal({
      keyboard: false,
      focus: true,
      backdrop: true

    })
}

/* Present hint/crossstreet */
function showHint() {
  var hint = window.currentStreet[1];
  presentModal("Last unit...?", hint );
  questionPoints -= 1;
  updatePointDisplay();
  $('#showhint').addClass('disabled');
  $('#showhint').prop('disabled', true);
}


/* Reset everything */
function reset(){
  window.totalPoints = 0;
  window.usedStreets = [];
  mapobj.getView().setCenter(ol.proj.fromLonLat( window.intialLocation, window.globalProj ) );
  centerMarker();
  nextStreet();

}

function toggleDrivingMode() {

  window.drivingModeEnabled = ! window.drivingModeEnabled;

  if ( window.drivingModeEnabled == true ) {
    navigator.geolocation.getCurrentPosition(function(position) {
        window.userLocation = position;
        window.startingLocation = position;
        window.mapobj.getView().setCenter(ol.proj.fromLonLat( [window.userLocation.coords.longitude, window.userLocation.coords.latitude], window.globalProj ));
        centerMarker();
        dingNotification("Welcome to driving mode! Please navigate to: " + window.currentStreet[0] + ", when ready! ")
    });
    window.locationloop = setInterval(updateLocation,5000);
    $('#drivingMode span').css("color","green");
    $('.onlyDriving').removeClass("reallyHide").hide().fadeIn();
    $('.nondriving').addClass("reallyHide").hide().fadeOut();
  } else {
    window.drivingModeEnabled == false;
    $('#drivingMode span').removeAttr( "style" ).hide().fadeIn();
    $('.onlyDriving').addClass( "reallyHide" ).hide().fadeOut();
    $('.nondriving').removeClass( "reallyHide" ).hide().fadeIn();
    window.mapobj.getView().setCenter(ol.proj.fromLonLat(window.intialLocation, window.globalProj ));
    centerMarker();
   }
}

function updateLocation() {
  if( window.drivingModeEnabled == false ) { clearInterval(window.locationloop); return true; }
  navigator.geolocation.getCurrentPosition(function(position) {
      window.userLocation = position;
  });
  if( window.userLocation ) {
    getCurrentUserLocation();
    window.mapobj.getView().setCenter(ol.proj.fromLonLat( [window.userLocation.coords.longitude, window.userLocation.coords.latitude], window.globalProj ));
    centerMarker();
  }
  if ( window.streetLocation == window.currentStreet[0] ) {
    dingNotification("Awesome! You got that right! On to the next street!")
    window.totalPoints += questionPoints;
    nextStreet();
    speak( "Please navigate to " + window.currentStreet[0] );


  }
}


function getCurrentUserLocation() {
  var lon = window.userLocation.coords.longitude;
  var lat = window.userLocation.coords.latitude;
  var revGeocode = 'https://nominatim.openstreetmap.org/reverse.php?format=json&lat=' + lat + '&lon=' + lon +'&zoom=17';
  var street = "";
  $.getJSON(revGeocode, function( response ) {
      // get lat + lon from first match
      var data = response;
      window.streetLocation = response.address.road;

    });

    return 0;
}


function speak(text) {
    responsiveVoice.speak( text, "US English Female" );
}

function dingNotification(text) {
  $('#bellAudio')[0].play();
  $('#bellAudio').on("ended",function() {
    speak(text);
    text="";
  });
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function checkChangelog() {
  $.ajax({
    url: 'CHANGELOG.md',
    type: 'get',
    async: 'true',
    ifModified: true,
    success: function(text, textStatus, xhr) {
      if (xhr.status == 200) {
        var converter = new showdown.Converter();
        var options = converter.getOptions();
        options.strikethrough = true;
        options.simplifiedAutoLink = true;
        html = converter.makeHtml(text);
        $("#changelogContainer").html(html);
        $('#changelogmodal').modal('show');
      }
    }
  });
}
