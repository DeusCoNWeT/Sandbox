
Polymer({
  is: 'traffic-incidents',

  properties: {
    /*
    * Google geoencody api_key.
    * Go to https://developers.google.com/maps/documentation/geocoding/get-api-key
    * to get your key
    **/
    api_key_geocoding: {
      type: String,
      reflectToAttribute: true
    },
    /*
    * Bing maps key.
    * Go to https://msdn.microsoft.com/en-us/library/ff428642.aspx
    * to get your key
    *
    */
    app_key_traffic: {
      type: String,
      reflectToAttribute: true
    },

    /*
    * `City` where you want to obtain traffic information
    */
    city: {
      type: String,
      reflectToAttribute: true,
      notify:true
    },

    /*
    * Radio (Km value) around city location where traffic information will be searched.
    */
    radio: {
      type: Number,
      reflectToAttribute: true,
      notify: true
    },
    /*
    * Traffic information obtained from Bing Maps Traffic API
    */
    traffic_info: {
      value: function(){return []},
      type: Array,
      notify: true
    },
    /*
    * `auto_refresh` is true when we want to refresh automatically each any (`refresh_time`) seconds
    */
    auto_refresh: {
      value: false,
      type: Boolean,
      reflectToAttribute: true,
      notify: true
    },
    /*
    * How often traffic information is requested if `auto_refresh` is true (in seconds).
    */
    refresh_time: {
      value: 120000,
      type: Number,
      reflectToAttribute: true
    },
  /**
    * Indicate if there are or not traffic incidents
    **/
    no_incidents: {
      type:String,
      computed: '_emptyIncidents(language, city)'
    },
  /**
    * Set the language of the component to spanish (es) or english (en)
    */
    language: {
      type: String,
      value: 'es',
      reflectToAttribute: true,
      notify:true
    },
    _loading: {
      type: Boolean,
      value: true,
      notify: true
    },
    _isEmpty: {
      type:Boolean,
      computed: '_checkEmpty(traffic_info.length, _loading)'
    },
  /**
    * Is true when search box is active
    */
    active: {
      type: Boolean,
      value: false
    },
    _lang: {
      type: Object,
      value: {
        'es': {
          'end': 'Termina'
        },
        'en': {
          'end': 'End'
        }
      }
    },
    _text: {
      type: Object,
      computed: '_setLanguage(language,_lang)'
    }
  },
  _setLanguage: function(lang,_lang){
    if (_lang){
      return this._lang[lang];
    }
  },
  _emptyIncidents: function(language, city){
    if (language == 'es'){
      return 'No hemos encontrado incidentes en ' + city
    } else {
      return 'There are not incidents in ' + city;
    }
  },
  _checkEmpty: function(length, loading){
    return length == 0 && !loading;
  },
  /** Transform dates recived from Bing Traffic Api to correct date format
  * @method getDate
  * @param {String} Date Date returned by Bing Traffic Api with format "/Date(timestamp)/"
  * @return {Date} a data object
  */
  getDate: function(stringDate){
    var timestamp = stringDate.match(/\/Date\(([^\)]*)\)\//);
    var date;
    if (timestamp.length > 1 ) {
      date = new Date(parseInt(timestamp[1]));
    }
    var day = date.getDate();
    var monthIndex = date.getMonth() + 1;
    monthIndex = monthIndex > 9? monthIndex : '0' + monthIndex;
    var year = date.getFullYear();
    var prettyDate = day + '/'+ monthIndex + '/' + year + '  ';
    prettyDate += date.getHours() > 9? date.getHours() : '0' + date.getHours();
    prettyDate += ':';
    prettyDate += date.getMinutes() > 9? date.getMinutes() : '0' + date.getMinutes();
    return prettyDate;
  },
  _data_ready: function(){
    this._loading = false;
  },
  _loading_data: function(){
    this._loading = true;
  },
  toggleInput: function(e){
    this.active = !this.active;
    if (this.active){
      this.$.searchBox.focus();
      this.$.name.hidden = true;
    }
  },
  blurInput: function(e){
    var target = e.currentTarget;
    if (!target.value && this.city){
      this.$.name.hidden = false;
      this.toggleInput();
      target.blur();
    }
  },
  keyupInput: function(e){
    if (e.keyCode === 13){
      this.$.name.hidden = false;
      this.city = this.$.searchBox.value;
      this.$.traffic.requestTraffic();
      this.$.searchBox.value = "";
      this.toggleInput();
    }
  },
  focusInput: function(){
    this.$.searchBox.focus();
  },
  refresh: function(){
    this.$.traffic.requestTraffic();
  },
  _empty: function(){
    this.set('traffic_info', []);
  },
  attached: function(){
    if (!this.city) {
      this._loading = false;
      this.$.search.click();
    }
  }
});

