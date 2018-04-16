
Polymer({
  is: 'open-weather',
  properties: {
    /**
    * City latitude
    */
    lat: {type:Number},
    /**
    * City longitude
    */
    lon: {type:Number},
    /**
    * Open weather ID
    */
    appId: {},
    /**
    * Imperial values for data
    **/
    imperial: {type: Boolean, value: false},
    /**
    * Set the language of dates
    **/
    language: {type: String, value: 'es'},
    /**
    * Set units of data
    **/
    units: {type: String, value: 'metric'},
    /**
    * All data from api. (5 days, 8 values for day)
    */
    data: {type:Array, value: function(){return []}},
    /**
    * Data for next 4 days
    */
    next_days: {type:Array, value: function(){return []}},

    weather_params:{type:Object,computed:'_weatherApiParams(lat, lon, units, language, appId)',observer:'_weatherParamsChanged'},
    _loading:{
      type:Boolean,
      value:true
    },
    refresh_time:{type:Number,value:60000}
  },
  _iconMapping: {
    "01d": "wi-day-sunny",
    "01n": "wi-night-clear",
    "02d": "wi-day-cloudy",
    "02n": "wi-night-cloudy",
    "03d": "wi-cloudy",
    "03n": "wi-cloudy",
    "04d": "wi-cloudy",
    "04n": "wi-cloudy",
    "09d": "wi-showers",
    "09n": "wi-showers",
    "10d": "wi-day-rain",
    "10n": "wi-night-rain",
    "11d": "wi-thunderstorm",
    "11n": "wi-thunderstorm",
    "13d": "wi-snow",
    "13n": "wi-snow",
    "50d": "wi-fog",
    "50n": "wi-fog"
  },
  _iconMappingPretty: {
    "01d": "http://i.imgur.com/8emVn0q.png",
    "01n": "http://i.imgur.com/bFgsaOB.png",
    "02d": "http://i.imgur.com/VzKmO0h.png",
    "02n": "http://i.imgur.com/BEiKkyQ.png",
    "03d": "http://i.imgur.com/523PFSf.png",
    "03n": "http://i.imgur.com/523PFSf.png",
    "04d": "http://i.imgur.com/523PFSf.png",
    "04n": "http://i.imgur.com/523PFSf.png",
    "09d": "http://i.imgur.com/0r3bkb6.png",
    "09n": "http://i.imgur.com/0r3bkb6.png",
    "10d": "http://i.imgur.com/FgTtbmZ.png",
    "10n": "http://i.imgur.com/oV2Oqbd.png",
    "11d": "http://i.imgur.com/uhpwPZm.png",
    "11n": "http://i.imgur.com/uhpwPZm.png",
    "13d": "http://i.imgur.com/GKXCYFQ.png",
    "13n": "http://i.imgur.com/GKXCYFQ.png",
    "50d": "http://i.imgur.com/TlecD8p.png",
    "50n": "http://i.imgur.com/TlecD8p.png"
  },
  _windDirections: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  // Observers
  _weatherParamsChanged: function(){
    if (this.lat && this.lon && this.units && this.language && this.appId){
      this._loading = true;
      this.$.ajax.generateRequest();
    }
  },
  _weatherClass: function(tempLevel) {
    return 'weather temp-level-' + tempLevel;
  },
  _weatherApiParams: function(lat, lon, units, language, appId) {
    return {lat: lat, lon: lon, units: units, lang: language, appId: appId};
  },
  _weatherApiResponse: function(e) {
    this._loading = false;
    var res = e.detail.response;
    if (res.cod && res.cod === "404"){
      console.log('error!');
      return res;
    }
    var list = res.list;
    var days = {
      es:['Dom','Lun','Mar','Mie','Jue','Vie','Sab'],
      en:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      ru:['вос','пон','вто́','сре','чет','пя́т','суб'],
      it:['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
      uk:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      de:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      pt:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      ro:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      pl:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      fi:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      nl:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      fr:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      bg:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      sv:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      tr:['Sun','Mon','Tue','Wed','thu','Fri','Sat'],
      ca:['Sun','Mon','Tue','Wed','thu','Fri','Sat']

    }
    function getTempLevel(temp, isImperial) {
      if (isImperial) {
        temp = (temp - 32) * (5 / 9)
      }
      var level = Math.round((temp + 8) / 8);
      level = level < 0 ? 0 : level;
      level = level > 6 ? 6 : level;
      return level
    }
    var getMinMax = function(list_temp){
      var minmax = {min:100,max:-100};
      for (var i=0;i<list_temp.length;i++){
        if (list_temp[i].main.temp_min < minmax.min){
          minmax.min = Math.round(list_temp[i].main.temp_min);
        }
        if (list_temp[i].main.temp_max > minmax.max){
          minmax.max = Math.round(list_temp[i].main.temp_max);
        }
      }
      return minmax;
    }
    this.set('next_days',[]);
    this.set('data',[]);
    for (var i=0;i<list.length;i++) {
      var dt = new Date(list[i].dt*1000);
      var now = new Date()
      var current_time = now.getHours() > 9? now.getHours() : '0' + now.getHours();
      current_time += now.getMinutes() > 9? ':' + now.getMinutes(): ':0' + now.getMinutes();
      var day = dt.getUTCDate();
      var month = dt.getMonth() +1;
      var year = dt.getFullYear();
      var init = Math.floor(i/8)*8;
      var minmax = getMinMax(list.slice(init,8+init));
      var weather = {
        icon: this._iconMapping[list[i].weather[0].icon],
        conditiontext: list[i].weather[0].description,
        name: res.city.name,
        currentTemp: Math.round(list[i].main.temp),
        minTemp: minmax.min,
        maxTemp: minmax.max,
        windSpeed:  list[i].wind.speed,
        windMetric: this.imperial ? "Mi/H" : "M/h",
        windDirection: this._windDirections[Math.round(list[i].wind.deg / 45) % 8],
        cloudiness: list[i].clouds.all,
        humidity: list[i].main.humidity,
        pressure: list[i].main.pressure,
        temperatureUnit: this.imperial ? 'F':'C',
        tempLevel: getTempLevel(list[i].main.temp, this.imperial),
        dt:dt,
        day: days[this.language][dt.getDay()],
        current_time: current_time,
        current_date: day + '/' + month + '/' + year,
        day: days[this.language][dt.getDay()],
        prettyIcon: this._iconMappingPretty[list[i].weather[0].icon]
      };
      this.push('data',weather);
    }
    this.current_date = this.data[0];
    // next 3 days
    for (var i=8;i<this.data.length;i=i+8){
      this.push('next_days', this.data[i]);
    }
    this.fire('open-weather-load', {weather: this.data});
  },
  /**
  * Update data
  */
  refresh: function(){
    this._loading=true;
    this.$.ajax.generateRequest();
  },
  attached: function() {
    this._interval = window.setInterval(this.refresh.bind(this),this.refresh_time);

    var getCurrentLocation= function(position) {
      this.lat = position.coords.latitude;
      this.lon = position.coords.longitude;
    }
    if (typeof(this.lat) == "undefined" && typeof(this.lon) == "undefined") {
      navigator.geolocation.getCurrentPosition(getCurrentLocation.bind(this));
    }
  },
  detached: function(){
    if(this._interval) window.clearInterval(this._interval)
  }
});

