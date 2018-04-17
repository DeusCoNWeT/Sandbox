
    Polymer({

      is: 'reddit-timeline',

      properties: {

        /* Component parameters */

        token: String,

        refresh_token: {
          type: String,
          observer: "_logged"
        },

        client_id: String,

        client_secret: String,

        /* Language */

        component_base: {
          type: String,
          value: "",
          reflectToAttribute: true
        },

        lan_file: String,

        language: {
          type: String,
          value: "en",
          reflectToAttribute: true,
          observer: "_languageChanged"
        },

        /* Configuration */

        view_detail: {
          type: Boolean,
          value: false
        },

        POSTS_LIMIT: {
          type: Number,
          value: 25
        },

        subreddit: {
          type: String,
          value: "all"
        },

        list: {
          type: String,
          value: "hot"
        },

        cursor: {
          type: Number,
          value: 0,
        },

        cache: {
          type: Object,
          value: [],
        },

        _api_headers: {
          type: String,
          computed: "_get_api_headers(token)"
        },

        _token_headers: {
          type: String,
          computed: "_get_token_headers(client_id, client_secret)"
        },

        _posts_params: {
          type: Object,
          computed: "_get_posts_params(POSTS_LIMIT, after)"
        },

        _token_params: {
          type: String,
          computed: "_get_token_params(refresh_token)"
        },
        languageUrl: {
          type: String,
          computed: "_getLanguageUrl(lan_file)"
        },
        feed: {
          type: Array,
          value: function () {
            return []
          }
        }
      },

      /* LANGUAGE SUPPORT */
      _languageChanged: function (newVal, oldValue) {
        switch (newVal) {
          case "es":
            this.language = "es";
            this.lan_file = "es_es.json"
            break;
          default:
            this.language = "en";
            this.lan_file = "en_en.json"
        }
        if (this.component_base || this.component_base == "") {
          this.$.requestLanguage.generateRequest();
        }
      },
      _getLanguageUrl: function (lan_file) {
        return this.resolveUrl("language/" + lan_file);
      },
      _language_response: function (event, detail) {
        this.words = detail.response;
      },
      /* END LANGUAGE SUPPORT */

      /* COMPUTED PROPERTIES*/
      _get_api_headers: function (token) {
        return {
          Authorization: 'Bearer ' + token
        };
      },

      _get_token_headers: function (client_id, client_secret) {
        return {
          Authorization: "Basic " + btoa(client_id + ":" + client_secret)
        };
      },

      _get_posts_params: function (POSTS_LIMIT, after) {
        return {
          limit: POSTS_LIMIT,
          after: after
        };
      },

      _get_token_params: function (refresh_token) {
        return {
          grant_type: "refresh_token",
          refresh_token: refresh_token
        };
      },

      /* Request acces token*/
      _token_received: function (event, detail) {
        this.token = detail.response.access_token;
        this.fire('reddit-timeline-token', {
          access_token: this.token
        });
        if (this.recall_subreddits) {
          this.$.get_subreddits.generateRequest();
          this.recall_subreddits = false;
        }
        if (this.recall_posts) {
          this.$.get_posts.generateRequest();
          this.recall_posts = false;
        }
      },

      _subreddits_received: function (event, detail) {
        var subreddits = detail.response.data.children;
        if (subreddits.length > 0) {
          for (var i = 0; i < subreddits.length; i++) {
            if (i == 0) this.subreddits = subreddits[i].data.display_name;
            else this.subreddits += "+" + subreddits[i].data.display_name;
          }
          this.subreddit = this.subreddits;
        }
        this.$.get_posts.generateRequest();
      },

      _subreddit_error: function (event, detail) {
        if (detail.request.xhr.status == 401) {
          this.recall_subreddits = true;
          this._refresh_token();
        }
      },

      _posts_received: function (event, detail) {
        this.feed = detail.response.data.children;
        this.after = detail.response.data.after;
      },

      _posts_error: function (event, detail) {
        if (detail.request.xhr.status == 401) {
          this.recall_posts = true;
          this._refresh_token();
        }
      },

      _refresh_token: function () {
        this.$.refresh_token.generateRequest();
      },

      refresh: function () {
        this.cache = {};
        this.cursor = 0;
        this.after = "";
        this.feed = null;
        this.$.feed_template.render();
        this.$.get_subreddits.generateRequest();
      },

      hot: function () {
        this.cache = {};
        this.cursor = 0;
        this.after = "";
        this.feed = null;
        this.$.feed_template.render();
        this.list = "hot";
        this.$.get_posts.generateRequest();
        this.toggle();
      },

      top: function () {
        this.cache = {};
        this.cursor = 0;
        this.after = "";
        this.feed = null;
        this.$.feed_template.render();
        this.list = "top";
        this.$.get_posts.generateRequest();
        this.toggle();
      },

      new: function () {
        this.cache = {};
        this.cursor = 0;
        this.after = "";
        this.feed = null;
        this.$.feed_template.render();
        this.list = "new";
        this.$.get_posts.generateRequest();
        this.toggle();
      },

      hasMedia: function (item) {
        var has = false
        if (item.data.media != null) {
          item.media = item.data.url;
          item.detail = item.data.media.oembed.thumbnail_url;
          if (item.data.media.oembed.provider_url == "https://www.youtube.com/") {
            item.hasVideo = true;
            var splitted = item.data.media.oembed.thumbnail_url.split('/');
            item.video = splitted[splitted.length - 2];
          } else {
            item.detail = item.data.thumbnail;
            if (item.detail == 'default') {
              item.detail = this.component_base + "default_gif.png";
            }
            item.hasVideo = false;
          }
          has = true;
        } else if (item.data.preview) {
          if (item.data.preview.images[0].variants.gif) {
            item.media = item.data.preview.images[0].variants.gif.source.url;
            item.detail = item.data.thumbnail;
            if (item.detail == 'default') {
              item.detail = this.component_base + "default_gif.png";
            }
            has = true;
          }
        }
        return has;
      },

      hasPreview: function (item) {
        var has = false
        if (item.data.preview) {
          item.image = item.data.preview.images[0].source.url;
          item.url = item.image;
          has = true;
        }
        return has;
      },

      getLink: function (item) {
        return "https://www.reddit.com" + item.data.permalink;
      },

      getRLink: function (item) {
        return "https://www.reddit.com/r/" + item.data.subreddit;
      },

      next: function () {
        if (this.cache[this.cursor + 1]) {
          this.feed = null;
          this.$.feed_template.render();
          this.after = this.cache[this.cursor + 1].after;
          this.feed = this.cache[this.cursor + 1].feed;
        } else {
          this.cache[this.cursor] = {};
          this.cache[this.cursor].after = this.after;
          this.cache[this.cursor].feed = this.feed;
          this.feed = null;
          this.$.feed_template.render();
          this.$.get_posts.generateRequest();
        }
        this.cursor++;
      },

      before: function () {
        if (this.cursor > 0) {
          if (!this.cache[this.cursor]) {
            this.cache[this.cursor] = {};
            this.cache[this.cursor].after = this.after;
            this.cache[this.cursor].feed = this.feed;
          }
          this.cursor--;
          this.feed = null;
          this.$.feed_template.render();
          this.after = this.cache[this.cursor].after;
          this.feed = this.cache[this.cursor].feed;
        }
      },

      toggle: function () {
        this.$$('.dropdown-content').classList.toggle('active');
      },

      detail: function (e) {
        this.item = e.model.item;
        this.view_detail = true;
      },

      back: function () {
        this.view_detail = false;
      },

      /* COMPONENT BEHAVIOUR*/

      _logged: function () {
        this.$.get_subreddits.generateRequest();
      },

      attached: function () {
        console.log("MIRAR!!!! Esto se imprime");
      },
    });
  
