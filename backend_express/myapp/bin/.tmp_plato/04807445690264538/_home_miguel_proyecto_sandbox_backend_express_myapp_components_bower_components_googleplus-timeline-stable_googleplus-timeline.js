
  Polymer({

    is: 'googleplus-timeline',

    properties: {
      /**
       * Describes the api-key of the application
       *
       * @type {{name: string}}
       */
      token: {
        type: String,
        reflectToAttribute: true,
        notify: true
      },
      //Posts that will be displayed on the component
      timeline_posts: {
        type: Array,
        value: []
      },
      //Represents the post retrieved for any user that cannot
      //be displayed on the current page of the component
      next_timeline_posts: {
        type: Object,
        value: []
      },
      page_timestamp: {
        type: Number,
        value: 0
      },
      api_key: {
        type: String,
        reflectToAttribute: true,
        notify: true
      },
      //Represents the desired range of time that will cover a specific page
      // (one month = 2678400000 millis)
      millis_range_timestamp: {
        type: Number,
        value: 604800000 //One week
      },
      /* Object that holds a list of object about the actual page 
         the post list nextpage to obtain about every user that the logged in user follows
        Also stores other necessary field like the timestamp of the last post retrieved
         Elements:
         - author: G+ user id, author of posts 
         - displayName: human readable identifier for the user
         - timestamp: timestamp of the first post in the page-
         - nextPageToken: identifier for the next page of post list retrieved by the API
        */
      last_retrieved_page: {
        type: Object,
        value: []
      },
      user_followings: {
        type: Object,
        value: []
      },
      //Auxiliar param to check if there are new posts loaded when the user wants to see another page of posts
      post_added_per_page: {
        type: Number,
        value: 0
      },
      language: {
        type: String,
        value: 'en',
        notify: true,
        reflectToAttribute: true,
        observer: "_languageChanged"
      },
      language_en: {
        type: Object,
        value: {
          "load_more": "Load More",
          "shared_first": "has shared first: ",
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"],
          "sec": "second",
          "secs": "seconds",
          "min": "minute",
          "mins": "minutes",
          "hour": "hour",
          "hours": "hours",
          "day": "day",
          "days": "days",
          "user": "User"
        }
      },
      language_es: {
        type: Object,
        value: {
          "load_more": "Cargar más",
          "shared_first": "ha compartido primero: ",
          "months": ["En", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep",
            "Oct", "Nov", "Dic"],
          "sec": "segundo",
          "secs": "segundos",
          "min": "minuto",
          "mins": "minutos",
          "hour": "hora",
          "hours": "horas",
          "day": "día",
          "days": "días",
          "user": "Usuario"
        }
      },
      language_data: {
        type: Object,
        value: []
      },
      mockUrl: {
        type: String,
        value: function () {
          return this.resolveUrl('mockData/following.json');
        },
      },
      refresh_time: {
        type: Number,
        value: 60000,
        reflectToAttribute: true
      }
    },
    _responseFollowings: function (event, detail) {
      var response = detail.response;
      var added = 0;
      if (response.connections) {
        var users = response.connections;
        for (i = 0; i < users.length; i++) {
          if (users[i].urls) {
            var user_id = users[i].urls[0].metadata.source.id;
            this.push('user_followings', user_id);
            this.$.requestPosts.setAttribute("url", this._getRequestPostsURL(user_id));
            this.$.requestPosts.generateRequest();
            added++;
          }
        }
        if (!added) this.loading = false;
      }
      else {
        // load mockData
        this.loading = false;
        //this.$.requestMock.generateRequest()
      }
    },
    _responseMock: function (event, detail) {
      //We generate an ajax request to get the post published by the authenticated user
      this.push('user_followings', "me");
      this.$.requestPosts.setAttribute("url", this._getRequestPostsURL("me"));
      this.$.requestPosts.generateRequest();
      //We generate an ajax request for each user that the authenticated user follows 
      for (i = 0; i < detail.response.items.length; i++) {
        user_id = detail.response.items[i].id;
        //We add the user_id to an auxiliar structure
        this.push('user_followings', user_id);
        this.$.requestPosts.setAttribute("url", this._getRequestPostsURL(user_id));
        this.$.requestPosts.generateRequest();
      }
    },

    _getRequestPostsURL: function (user_id) {
      return "https://www.googleapis.com/plus/v1/people/" + user_id + "/activities/public";
    },

    _updateLastRetrievedPage: function (current_user_page) {
      // We add the timestamp of the last post retrieved along with its author to an auxiliary variable
      found = false;
      for (i = 0; i < this.last_retrieved_page.length && !found; i++) {
        if (this.last_retrieved_page[i].author === current_user_page.author) {
          found = true;
          //If there aren't new pages to be obtained for the user, we don't track it anymore
          if (typeof (current_user_page.nextPageToken) == 'undefined') {
            this.splice('last_retrieved_page', i, 1);
          }
          else {
            this.set('last_retrieved_page.' + i + '.timestamp', current_user_page.timestamp);
            this.set('last_retrieved_page.' + i + '.nextPageToken', current_user_page.nextPageToken);
          }
        }
      }
      if (!found && (typeof current_user_page.nextPageToken) != 'undefined')
        this.push('last_retrieved_page', current_user_page);
    },

    _obtainNextPagePost: function (user_id, last_post_timestamp, last_post_nextPageToken) {
      // We check if the last user post returned is previous to the page_timestamp 
      // (posts that will be displayed on the current displayed page)
      // If it is, we'll request the following post from the user until we've reached the reference timestamp for the actual "page"
      // that displays the component
      if (last_post_timestamp > this.page_timestamp && (typeof last_post_nextPageToken) != 'undefined') {
        //We set the next page param in the next request
        request_params = { "pageToken": last_post_nextPageToken };
        this.$.requestPosts.setAttribute("url", this._getRequestPostsURL(user_id));
        this.$.requestPosts.setAttribute("params", JSON.stringify(request_params));
        this.$.requestPosts.generateRequest();
      }
    },

    _responsePosts: function (event, detail) {
      // We reset the params field for the next request of requestPost iron-ajax
      this._interval = this._interval || window.setInterval(this._refresh_posts.bind(this), this.refresh_time);
      this.$.requestPosts.setAttribute("params", '{}');
      //Appends all user posts to the user timeline 
      user_posts = detail.response.items;
      // If the user hasn't posted anything yet, we just ignore it
      if (user_posts.length > 0) {
        for (i = 0; i < user_posts.length; i++) {
          //We transform timestamps to a more manageable format of every post received (published and updated fields)
          user_posts[i] = this._changeTime(user_posts[i]);
          // We insert the post into the timeline that holds all posts that will be displayed to the user
          // (If the published date for the post is in the period of time that shows the actual page of the component)
          this.push('timeline_posts', user_posts[i]);
        }
        this.loading = false;
      }
    },
    _refresh_posts: function () {
      this.loading = true;
      this.set('timeline_posts', []);
      var that = this;
      this.user_followings.forEach(function (user_id) {
        that.$.requestPosts.setAttribute("url", that._getRequestPostsURL(user_id));
        that.$.requestPosts.generateRequest();
        console.log('se Actualiza ', user_id)
      });
    },

    // Element Lifecycle

    attached: function () {
      // `attached` fires once the element and its parents have been inserted
      // into a document.
      //
      // This is a good place to perform any work related to your element's
      // visual state or active behavior (measuring sizes, beginning animations,
      // loading resources, etc).
      this.loading = true;
      if (this.token) {
        //We set the language
        if (this.language == "en")
          this.set('language_data', this.language_en);
        else if (this.language == "es")
          this.set('language_data', this.language_es);

        //We set the headers for the Google API requests
        var headers = {
          "Authorization": "Bearer " + this.token,
          "Timing-Allow-origin": "*"
        };
        this.$.requestPosts.setAttribute("headers", JSON.stringify(headers));
        //this.$.requestMock.generateRequest();
        this.$.requestFollowing.generateRequest();
      }
    },

    detached: function () {
      // The analog to `attached`, `detached` fires when the element has been
      // removed from a document.
      //
      // Use this to clean up anything you did in `attached`.
      if (this._interval) {
        window.clearInterval(this._interval);
      }
    },

    // AUXILIAR FUNCTIONS
    /**
    * Convert a given posts timestamp of post lists to a human readable date
    *
    */
    _changeTime: function (post) {
      updated_post = post;
      var date = new Date(post.published);
      var updated_date = new Date(post.updated)
      var current_date = new Date();
      var time;
      var month = this.language_data.months;
      /* Years*/
      if ((current_date.getFullYear() - date.getFullYear()) != 0) {
        var dif = current_date.getFullYear() - date.getFullYear()
        time = date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear();
        /* Months */
      } else if ((current_date.getMonth() - date.getMonth()) != 0) {
        var dif = current_date.getMonth() - date.getMonth();
        time = date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear();
        /* Days */
      } else if ((current_date.getDate() - date.getDate()) == 0) {
        if ((current_date.getHours() - date.getHours()) == 0) {
          if ((current_date.getMinutes() - date.getMinutes()) == 0) {
            time = current_date.getSeconds() - date.getSeconds();
            time += time == 1 ? " " + this.language_data.sec : " " + this.language_data.secs;
          }
          else {
            time = current_date.getMinutes() - date.getMinutes();
            time += time == 1 ? " " + this.language_data.min : " " + this.language_data.mins;
          }
        }
        else {
          if (current_date.getHours() - date.getHours() == 1) {
            time = current_date.getHours() - date.getHours();
            time += " " + this.language_data.hour;
          } else {
            time = current_date.getHours() - date.getHours();
            time += " " + this.language_data.hours;
          }
        }
      }
      else if (((current_date.getDate() - date.getDate()) < 8) && ((current_date.getDate() - date.getDate()) > 0)) {
        if ((current_date.getDate() - date.getDate()) == 1) {
          time = current_date.getDate() - date.getDate();
          time += " " + this.language_data.day;
        }
        else {
          time = current_date.getDate() - date.getDate();
          time += " " + this.language_data.days;
        }
      }
      else {
        time = date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear();
      }
      // We change the timestamps to millis UTC and we create a field that represents the published
      // date in a readably format
      updated_post.published_pretty = time;
      updated_post.published = date.getTime();
      updated_post.updated = updated_date.getTime();
      return updated_post;
    },

    _sortPosts: function (post1, post2) {
      if (post1.published == post2.published)
        return 0;
      else
        return post1.published > post2.published ? -1 : 1;
    },

    // AUXILIAR FUNCTIONS FOR DOM-IF CONDITIONS 


    _thereArePosts: function (value) {
      // Checks if there are remaining posts to be displayed
      var thereAre = this.timeline_posts && this.timeline_posts.length > 0
      return value == 'true' ? thereAre : !thereAre;
    },

    _hasAttachment: function (item, attachmentType) {
      return item.object.attachments[0].objectType === attachmentType;
    },

    _hasVideoAttachment: function (item) {
      return item.object.attachments[0].objectType === 'video'
        && item.object.attachments[0].hasOwnProperty('embed');
    },

    _hasArticleCaption: function (item) {
      return item.object.attachments[0].image && item.object.attachments[0].image.url && item.object.attachments[0].image.width > 360;
    },

    _isSharedPost: function (item) {
      return item.verb === "share";
    },
    /* Function _getCaptionDimensions: Adjusts the dimensions of album captions.
    Given an index inside the album caption List, the function returns a fixed 
    dimension, depending of the image role in the camption collage (main, secondary) */
    _getCaptionDimensions: function (image_index, item) {
      dimension = "0px";
      main_photo = (image_index == 0);
      album_captions_length = item.object.attachments[0].thumbnails.length;
      if (main_photo) {
        switch (album_captions_length) {
          case 1:
            dimension = "300px";
            break;
          case 2:
            dimension = "173px";
            break;
          case 3:
            dimension = "200px";
            break;
          case 4:
            dimension = "262px";
            break;
          default: /* More than 4 photos*/
            /* We only show 4 captions of the album, so the main photo will have the same dimension
            as the previous case */
            dimension = "262px";
        }
      } else {
        switch (album_captions_length) {
          case 1:
            dimension = "0px";
            break;
          case 2:
            dimension = "173px";
            break;
          case 3:
            dimension = "100px";
            break;
          case 4:
            dimension = "86px";
            break;
          default: /* More than 4 photos*/
            /* We only show 4 captions of the album, so the secondary photos will have the same dimension
            as the previous case */
            dimension = "86px";
        }
      }
      return dimension;
    },
    // OBSERVERS
    _languageChanged: function (newVal) {
      if (newVal === "en") {
        this.language = "en";
        this.set('language_data', this.language_en);
      }
      else if (newVal === "es") {
        this.language = "es";
        this.set('language_data', this.language_es);
      }
    },
  });

