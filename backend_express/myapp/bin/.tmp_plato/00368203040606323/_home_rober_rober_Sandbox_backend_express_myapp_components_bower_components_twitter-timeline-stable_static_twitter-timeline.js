
Polymer({
  is:"twitter-timeline",
  properties: {
    index: {
      type: Number,
      value: 20,
      observer:"renderTemplate"
    },
    show: {
      type: Boolean,
      value: true,
    },
    since_id: {
      type: String,
      value:""
    },
    endpoint: {
      type: String,
      notify: true,
      reflectToAttribute: true
    },
    language: {
      type: String,
      value: "es",
      reflectToAttribute: true,
      observer: "_languageChanged"
    },
    count: {
      type: Number,
      value: 200,
      notify: true,
      reflectToAttribute: true
    },
    /*1 seg = 1000*/
    refresh_time: {
      type: Number,
      value: 120000,
      notify: true,
      reflectToAttribute: true
    },
    access_token: {
      type: String,
      value: "",
      notify: true,
      reflectToAttribute: true
    },
    secret_token: {
      type: String,
      value: "",
      notify: true,
      reflectToAttribute: true
    },
    consumer_key: {
      type: String,
      value: "",
      notify: true,
      reflectToAttribute: true
    },
    consumer_secret: {
      type: String,
      value: "",
      notify: true,
      reflectToAttribute: true
    },
    language_url: {
      type: String,
      computed: "_calculateLanguageUrl(idiom)"
    },
    timeline_params: {
      type: String,
      computed: "_calculatetimelineParams(access_token, secret_token, consumer_key, consumer_secret, count)"
    },
    events: {
      type: Array,
      value: [],
      notify: true
    },
    language_data: {
      type: Array,
      value: []
    },
    mockUrl: {
      type: String,
      value: function(){
        return this.resolveUrl('mockData/tweets.json');
      }
    }
  },

  ready: function(){
    this.$.requestLanguage.generateRequest();
  },
  detached: function(){
    if (this._interval){
      window.clearInterval(this._interval);
    }
  },
  _calculateLanguageUrl: function(file) {
    return this.resolveUrl('language/' + file);
  },

  _calculatetimelineParams: function(access_token, secret_token, consumer_key, consumer_secret, count) {
    return {
      access_token: access_token,
      secret_token: secret_token,
      consumer_key: consumer_key,
      consumer_secret: consumer_secret,
      count: count
    };
  },

  _getUserurl: function(user) {
    return "https://twitter.com/" + user;
  },

  _getStatusUrl: function(id, id_str) {
    return "https://twitter.com/" + id + "/status/" + id_str;
  },

  _getTextId: function(index) {
    return "Text" + index;
  },

  _withoutStatus: function(status) {
    return !status;
  },

  _filter: function(item){
    var dentro = false;
    for (i=0;i<this.events.length && i<this.index && !dentro;i++) {
      if (this.events[i].id === item.id)
      dentro = true;
    }
    return dentro;
  },

  /* Language observer */
  _languageChanged: function(newVal, oldValue) {
    if(newVal === "en"){
      this.language = "en";
      this.idiom = "en_en.json"
    }
    else if(newVal === "es"){
      this.language = "es";
      this.idiom = "es_es.json"
    }
    this.$.requestLanguage.generateRequest();
  },

  renderTemplate: function(index, events) {
    this.$.tweets.render();
  },

  /* This function prepares the tweets before displaying them */
  _response: function(event, detail) {
    if (detail.response.errors){
      this._loadMock();
    } else {
      var parsed = this.parser(detail.response);
      this.set('events',parsed);
      this._changeTime(this.events);
    }
  },

  _language_response: function(event, detail){
    this.language_data = detail.response;
    /* If its a new request, we set events to new value*/
    if(this.events.length === 0){
      this.$.requesttimeline.generateRequest();
      var back = this
      this._interval = window.setInterval(function(){
        back.$.requesttimeline.generateRequest();
      }, back.refresh_time);
    } else{
      /* Else we had elements, we change events.*.time*/
      this._changeTime(this.events);
    }
  },

  /* Function that refresh the timeline */
  refresh_func: function(){
    this.$.requesttimeline.generateRequest();
  },

  /* Function that handles paging tweets*/
  toDisplay: function(){
    if (this.index >= this.events.length) {
      this.show = false;
    }
    else {
      this.index+=20;
      if (this.index >= this.events.length) {
        this.show = false;
      }
    }
  },

  /* Function that displays the date when the tweets was published */
  _changeTime: function(list){
    for (i=0;i<list.length;i++){
      var date = new Date(list[i].created_at);
      var current_date = new Date();
      var time;
      /* Años*/
      if ((current_date.getFullYear() - date.getFullYear()) != 0) {
        var dif = current_date.getFullYear() - date.getFullYear()
        time = dif==1 ? dif + " " + this.data.year : dif + " " + this.language_data.years;
        /* Meses */
      } else if ((current_date.getMonth() - date.getMonth()) != 0) {
        var dif = current_date.getMonth() - date.getMonth();
        time = dif==1 ? dif + " " + this.language_data.month : dif + " " + this.language_data.months;
        /* Dias */
      } else if((current_date.getDate() - date.getDate()) == 0 ){
        if((current_date.getHours() - date.getHours()) == 0 ){
          if( (current_date.getMinutes() - date.getMinutes()) == 0 ){
            time = current_date.getSeconds() - date.getSeconds()+" "+this.language_data.seconds
          }
          else{
            time = current_date.getMinutes() - date.getMinutes()+" "+this.language_data.minutes
          }
        }
        else{
          if (current_date.getHours() - date.getHours() == 1) {
            time = current_date.getHours() - date.getHours()+" "+this.language_data.hour;
          }else {
            time = current_date.getHours() - date.getHours()+" "+this.language_data.hours;
          }
        }
      }
      else if( ((current_date.getDate() - date.getDate()) < 15) && ( (current_date.getDate() - date.getDate()) > 0)){
        if( (current_date.getDate() - date.getDate()) == 1){
          time = current_date.getDate() - date.getDate()+" "+this.language_data.day
        }
        else{
          time = current_date.getDate() - date.getDate()+" "+this.language_data.days
        }
      }
      else{
        var month = [this.language_data.january,this.language_data.february,this.language_data.march,this.language_data.april, this.language_data.may,this.language_data.june,this.language_data.july,this.language_data.august,this.language_data.september,this.language_data.october,this.language_data.november,this.language_data.december];
        time = date.getDate()+" "+this.language_data.of+" "+month[date.getMonth()]+" "+this.language_data.of+" "+date.getFullYear();
      }
      this.set("events." + i + ".time", time);
    }
  },

  /* Function that parse the tweet's text */
  parser: function(list){
    for(i = 0; i < list.length; i++){
      list[i].text = this.parseURL(list[i].text);
      list[i].text = this.parseUsername(list[i].text);
      list[i].text = this.parseHashtag(list[i].text);
    }
    return list;
  },

  /* URLs parser */
  parseURL: function(tweet) {
    return tweet.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
      return '<a style="color:rgb(35, 123, 190)" href='+url+' target="_blank">'+url+'</a>'
    })
  },

  parseUsername: function(tweet) {
    return tweet.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
      var username = u.replace("@","")
      return '<a style="color:rgb(35, 123, 190)" href="https://twitter.com/'+username+' "target="_blank">@'+username+'</a>'
    })
  },

  parseHashtag: function(tweet) {
    return tweet.replace(/[#]+[A-Za-z0-9-_ñáéíóúàèìòùç]+/g, function(t) {
      var tag = t.replace("#","")
      return '<a style="color:rgb(35, 123, 190)" href="https://twitter.com/hashtag/'+tag+' "target="_blank">#'+tag+'</a>'
    });
  },
  _loadMock: function(){
    this.$.requestMock.generateRequest();
  }
  /* Calculate endpoint for request url */

})

