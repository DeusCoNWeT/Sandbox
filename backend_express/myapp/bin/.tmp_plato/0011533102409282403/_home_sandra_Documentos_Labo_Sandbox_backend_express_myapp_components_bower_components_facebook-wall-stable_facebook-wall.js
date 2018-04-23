
    Polymer({
      is: "facebook-wall",
      properties: {
        /**
          * List of posts your are published
          **/
        events: {
          type: Array,
          value: []
        },
        /**
          * Language in which post will be shown. Use `es` or `en`.
          */
        language: {
          type: String,
          value: "en",
          observer: "_languageUpdate",
          refrectToAttribute: true
        },
        /**
        * Language for facebook. `es` is transform in `es_es` and `en` in `en_en`
        */
        locale: {
          type: String,
          computed: "_getLocate(language)",

        },

        /**
          * Access_token is necessary in order to be able to request your posts. It's must grant access to user_posts.
        */
        access_token: {
          type: String,
          value: "",
          refrectToAttribute: true,
          observer: '_checkAccessToken'
        },
        /**
        * Interval time in which your posts will be updated
        */
        refreshTime: {
          type: Number,
          value: 60000,
          reflectToAttribute: true
        },
        mockUrl: {
          type: String,
          value: function () {
            return this.resolveUrl('mockData/dump.json');
          }
        },

        loading: {
          type: Boolean,
          value: true
        }
      },

      attached: function () {
        setInterval(function () {
          this.refresh();
        }.bind(this), this.refreshTime)
      },
      // refresh data
      refresh: function () {
        this._lastEvents = this.events;
        this.set('events', []);
        this.loading = true;
        this.$.requestData.generateRequest();
      },

      /* Change language of momentJS */
      _languageUpdate: function (newValue) {
        moment.locale(newValue);
        if (this.events.length > 0) {
          this.refresh();
        }
      },
      /* Get locale from language */
      _getLocate: function (language) {
        if (language == "es") {
          return "es_es";
        } else {
          return "en_US";
        }
      },
      // Reload data when access token change
      _checkAccessToken: function (newValue) {
        if (newValue) {
          this.$.requestData.generateRequest();
        }
      },

      /**
        * Get an user and transform it in a facebook url
        * @param {Object} item an post from facebook
        * @return {url} url to visit the user's profile on facebook
        */
      _getUsernameUrl: function (item) {
        var url;
        if (item.linked && !item.linked.from.category) {
          url = "https://facebook.com/app_scoped_user_id/" + item.linked.from.id;
        } else if (item.linked && item.linked.from.category) {
          url = "http://facebook.com/pages/-/" + item.linked.from.id;
        } else {
          url = "https://facebook.com/app_scoped_user_id/" + item.from.id;

        }
        return url
      },

      _getAuthorPostStory: function (item) {
        var author = item.linked ? item.linked.from.name : item.from.name;

        return item.linked && item.linked.story ? item.linked.story.replace(author, "") : "";
      },
      _noExist: function (item) {
        return !item;
      },

      _getShared: function (item) {
        return (item.linked && item.linked.shares) ? true : false;
      },
      _getShareInformation: function (item) {
        if (item.story && item.story_tags) {
          var full_story = item.story;
          item.story_tags.forEach(function (tag) {
            full_story = full_story.replace(tag.name, this._parserUser(tag));
          }, this);

          return full_story;
        }
        return '';
      },
      _getUserPicture: function (item) {
        var link = "https://graph.facebook.com/";
        link += item.linked ? item.linked.from.id : item.from.id
        link += "/picture/?access_token=" + this.access_token;
        return link;
      },
      _getAuthorPost: function (item) {

        return item.linked ? item.linked.from.name : item.from.name;
      },
      _isType: function (item, type, type2) {
        return item === type || item === type2;
      },


      _dataResponse: function (event, detail) {
        if (detail.response) {
          this.loading = false;
          this.set("events", detail.response);
          //this._next = detail.response.data.next;
        } else if (this._lastEvents) {
          this.set('events', this._lastEvents);
        } else {
          this._loadMock();
        }
      },
      _loadMock: function () {
        this.access_token = "";
        this.$.requestMock.generateRequest();
      },
      _getTime: function (date) {
        return moment(date).fromNow();
      },

      _parserUser: function (user) {
        var tag = "<a class='facebook-wall scope-style link bold' href='https://www.facebook.com/" + user.id + "' target='_blank'>" + user.name + "</a>";
        return tag;
      },
      _parseText: function (text, model) {
        if (text) {
          text = this._parseURL(text);
          text = this._parseHashtag(text);
          text = this._parseEmojis(text);
          text = this._parseMention(text, model);
        }
        return text ? text : "";
      },
      _parseURL: function (text) {
        return text.replace(/(?:http|https)+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=#]+/g, function (url) {
          url = url.replace("#", "%23");
          return '<a class="facebook-wall scope-style link" href=' + url + ' target="_blank">' + url + '</a>'
        })
      },
      _parseHashtag: function (text) {
        return text.replace(/[#]+[A-Za-z0-9-_ñáéíóúàèìòùç]+/g, function (t) {
          var tag = t.replace("#", "")
          return '<a class="facebook-wall scope-style link" href="https://www.facebook.com/hashtag/' + tag + ' "target="_blank"><span>#' + tag + '</span></a>'
        });
      },
      _parseEmojis: function (text) {
        var ranges = [
          '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
          '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
          '\ud83d[\ude80-\udeff]',
          '❤️'  // U+1F680 to U+1F6FF
        ];
        var regex = new RegExp(ranges.join('|'), 'g');
        return text.replace(regex, function (emoji) {
          var code = emoji.codePointAt(0).toString(16)
          return "<span class='facebook-wall scope-style emoji emoji" + code + "'></span>"
        });
      },
      _parseMention: function (text, model) {
        if (model.message_tags) {
          for (var i = 0; i < model.message_tags.length; i++) {
            text = text.replace(model.message_tags[i].name, function () {
              return '<a class="facebook-wall scope-style link" href=https://facebook.com/' + model.message_tags[i].id + ' target="_blank">' + model.message_tags[i].name + '</a>'
            })
          }
        }
        return text;
      },
      _getLocation: function (item) {
        return item.place && item.place.location ? ' - ' + item.place.location.city + ', ' + item.place.location.country : '';
      },
    });
  
