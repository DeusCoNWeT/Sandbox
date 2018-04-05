

    Polymer({

      is: 'pinterest-timeline',

      properties: {

        SHOW_COUNT: {
          type: Number,
          value: 20,
        },

        REQ_LIMIT: {
          type: Number,
          value: 60,
        },

        next_url: {
          type: String,
          value: "",
        },

        cache: {
          type: Object,
          value: [],
        },

        cursor: {
          type: Number,
          value: 0,
        },

        get_index: String,

        username: String,

        board: String,

        token: String,

        language: {
          type: String,
          value: "es",
          reflectToAttribute: true,
          observer: "_languageChanged"
        },

        language_url: {
          type: String,
          computed: "_calculateLanguageUrl(lan_file)"
        },

        get_user_param: {
          type: String,
          computed: "_get_user_param(token)"
        },

        get_boards_param: {
          type: String,
          computed: "_get_boards_param(token)"
        },

        get_pins_param: {
          type: String,
          computed: "_get_pins_param(token,REQ_LIMIT)"
        },
        refresh_time: {
          type: Number,
          value: 60000,
          reflectToAttribute: true
        },
        pins: {
         type: Array,
         value: function(){return []},
         notify: true
         },
        pins_cache: {
         type: Array,
         value: function(){return []},
         notify: true
        }

      },

      /* Language observer */
      _languageChanged: function (newVal, oldValue) {
        if (newVal === "en") {
          this.language = "en";
          this.lan_file = "en_en.json"
        }
        else if (newVal === "es") {
          this.language = "es";
          this.lan_file = "es_es.json"
        }
        this.$.requestLanguage.generateRequest();
      },

      /* Calculate endpoint for request url */
      _calculateLanguageUrl: function (file) {
        return this.resolveUrl("language/" + file);
      },

      _language_response: function (event, detail) {
        this.words = detail.response;
      },

      get_user: function () {
        this.$.request_user.generateRequest();
      },

      get_boards: function () {
        this.$.request_boards.generateRequest();
        this.$.request_following_boards.generateRequest();
      },

      get_pins: function (e) {
        this.username = e.model.item.username;
        this.board = e.model.item.id_name;
        this.$.request_pins.generateRequest();
      },

      refresh: function () {
        this.$.request_pins.generateRequest();
      },

      _get_user_param: function (token) {
        return { access_token: token, fields: "id,username,first_name,image" };
      },

      _get_boards_param: function (token) {
        return { access_token: token };
      },

      _get_pins_param: function (token, REQ_LIMIT) {
        return { access_token: token, fields: "id,url,image", limit: REQ_LIMIT };
      },

      _user_received: function (event, detail) {
        this.user = detail.response.data;
        this.get_boards();
      },

      _boards_received: function (event, detail) {
        this.boards = detail.response.data;
        for (var i = this.boards.length - 1; i >= 0; i--) {
          var splited = this.boards[i].url.split('/');
          this.boards[i].username = splited[splited.length - 3];
          this.boards[i].id_name = splited[splited.length - 2];
        };
      },

      _following_boards_received: function (event, detail) {
        this.following_boards = detail.response.data;
        for (var i = this.following_boards.length - 1; i >= 0; i--) {
          var splited = this.following_boards[i].url.split('/');
          this.following_boards[i].username = splited[splited.length - 3];
          this.following_boards[i].id_name = splited[splited.length - 2];
        };
      },

      _pins_received: function (event, detail) {
        if (!this.hide_home) this.hide_home = true;
        var pins = detail.response.data;
        this.cursor = 0;
        this.next_url = "";
        this.cache = [];
        if (detail.response.page.next != null) {
          this.next_url = detail.response.page.next;
        }
        //Pagination
        if (pins.length > this.SHOW_COUNT) {
          this.pins = pins.slice(0, this.SHOW_COUNT);
          this.page = this.SHOW_COUNT;
        }
        else {
          this.pins = pins;
          this.page = pins.length;
        }
        this.pins_cache = pins;
        this.cache[this.cursor] = this.pins;
        this.update_index();
      },


      //Pagination

      _more_pins_received: function (event, detail) {
        var pins = detail.response.data;
        this.next_url = "";
        if (detail.response.page.next != null) {
          this.next_url = detail.response.page.next;
        }
        if (pins.length > this.SHOW_COUNT) {
          this.pins = pins.slice(0, this.SHOW_COUNT);
          this.page = this.SHOW_COUNT;
        }
        else {
          this.pins = pins;
        }
        this.pins_cache = pins;
        this.cache[this.cursor] = this.pins;
      },

      next: function () {
        this.cursor++;
        if (this.cache[this.cursor]) {
          //If it is in cache just load
          this.pins = this.cache[this.cursor];
        }
        else {
          //check if there are more to show
          if (this.pins_cache.length > this.page) {
            if (this.pins_cache.length < this.page + this.SHOW_COUNT) {
              //Not enough to fill the page
              this.pins = this.pins_cache.slice(this.page, this.pins_cache.length);
              this.page = this.pins_cache.length;
            }
            else {
              //Load next pins
              this.pins = this.pins_cache.slice(this.page, this.page + this.SHOW_COUNT);
              this.page = this.page + this.SHOW_COUNT;
            }
            this.cache[this.cursor] = this.pins;

          }
          else if (this.next_url != "") {
            this.$['morePins'].generateRequest();
          }
          else {
            this.cursor--;
          }
        }
        this.update_index();
      },

      before: function () {
        if (this.cursor > 0) {
          this.cursor--;
          this.pins = this.cache[this.cursor];
        }
        this.update_index();
      },

      update_index: function () {
        if (this.pins) {
          this.get_index = '(' + this.cursor * this.SHOW_COUNT + ',' + (this.cursor * this.SHOW_COUNT + this.pins.length) + ')';
        }
        else {
          this.get_index = '';
        }

      },

      toggle: function () {
        if (this.$['dropdown-content'].style.right == "-155px") {
          this.$['dropdown-content'].style.right = "0";
        }
        else {
          this.$['dropdown-content'].style.right = "-155px";
        }

      },

      // Element Lifecycle

      attached: function() {
       // `attached` fires once the element and its parents have been inserted
       // into a document.
       //
       // This is a good place to perform any work related to your element's
       // visual state or active behavior (measuring sizes, beginning animations,
       // loading resources, etc).
       this._interval = this._interval || window.setInterval(this.refresh.bind(this),this.refresh_time);
       this.get_user();
       this.$['dropdown-content'].style.right="-155px";
       this.hide_home=false;

     },

     detached: function() {
       if (this._interval){
         window.clearInterval(this._interval);
       }
       // The analog to `attached`, `detached` fires when the element has been
       // removed from a document.
       //
       // Use this to clean up anything you did in `attached`.
     },

      // Element Behavior

    });

  
