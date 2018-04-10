
    Polymer({
        is: "facebook-wall",
        properties: {
            events: {
                type: Array,
                value: []
            },
            language: {
                type: String,
                value: "en",
                observer: "_languageUpdate",
                refrectToAttribute: true
            },
            languageUrl: {
                type: String,
                computed: "_getLanguageUrl(idiom)"
            },
            requestDataUrl: {
                type: String,
                computed: "_getRequestDataUrl(access_token)"
            },
            access_token: {
                type: String,
                value: "",
                refrectToAttribute: true
            },
            refreshTime: {
                type: Number,
                value: 60000,
                reflectToAttribute: true
            },
            mockUrl: {
                type:String,
                value: function(){
                    return this.resolveUrl('mockData/dump.json');
                }
            }
        },
        attached: function () {
            this.$.requestLanguage.generateRequest();
            setInterval(function () {
                this.refresh();
            }.bind(this), this.refreshTime)
        },

        refresh: function () {
            this.$.requestData.generateRequest();
        },
        /* Observer and computed properties*/
        _languageUpdate: function (newValue) {
            if (newValue === "en") {
                this.language = "en";
                this.idiom = "en_en.json"
            }
            else if (newValue === "es") {
                this.language = "es";
                this.idiom = "es_es.json"

            }
            this.$.requestLanguage.generateRequest();
        },
        _getLanguageUrl: function (idiom) {
            return this.resolveUrl("language/" + idiom);
        },

        _getRequestDataUrl: function (access_token) {
            return "https://graph.facebook.com/v2.3/me?fields=home&pretty=1&access_token=" + access_token;
        },

        _checkAccessToken: function (newValue) {
            if (newValue) {
                this.$.requestData.generateRequest();
            }
        },
        /* Auxiliar function for parse data */
        _checkElement: function (element, bool) {
            // XNOR comparation for booleans
            return element.linked && ((element.linked.story && bool == 'true') || (!element.linked.story && bool == 'false'));
        },
        _getPageStyle: function (item) {
            return item ? "pageStyle" : "";
        },
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

        _getYoutubeVideo: function (url) {
            return url.replace(/\?[=A-z0-9]*/, "");
        },
        _getAuthorPostStory: function (item) {
            var author = item.linked ? item.linked.from.name : item.from.name;

            return item.linked && item.linked.story ? item.linked.story.replace(author, "") : "";
        },
        _getShareImg: function (item) {
            var fullUrl = item.picture || item.linked.picture;
            var pattern = "url" + "=([^&]*)";
            var exp = new RegExp(pattern);
            var result = exp.exec(fullUrl)
            var url = result && result.length > 1 ? result[1] : ""
            var id;
            url = url.replace(/%2F/g, "/");
            url = url.replace(/%3A/g, ":");
            url = url.replace(/%3F/g, "?");
            url = url.replace(/%3D/g, "=");
            url = url.replace(/%26/g, "&");
            if (url.indexOf('fbstaging') > -1) {
                url = fullUrl.replace(/w=[^&]*/, 'w=500')
                url = url.replace(/h=[^&]*/, 'h=500')
            }
            if (url.indexOf("www.facebook.com") > -1) {
                url += "&access_token=" + this.access_token;
            }
            if (item.linked && item.linked.id && item.linked.status_type === 'added_photos') {
                id = item.linked.id.split('_')[1];
                url = 'https://graph.facebook.com/' + id + '/picture?access_token=' + this.access_token;
            } else if (item.id && item.status_type === 'added_photos') {
                id = item.id.split('_')[1];
                url = 'https://graph.facebook.com/' + id + '/picture?access_token=' + this.access_token;
            }
            return url;
        },
        _noExist: function (item) {
            return !item;
        },

        _getShared: function (item) {
            return (item.linked && item.linked.shares) ? true : false;
        },
        _getShareInformation: function (item) {
            if (item.story && item.from) {
                tag = this._parserUser(item.from) + " " + item.story.replace(item.from.name + " ", "");
                return tag;
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
        _isNoType: function (item, type) {
            return item !== type;
        },
        _getFullPhoto: function (item) {
            if (item.linked && item.linked.object_id) {
                return "https://graph.facebook.com/" + item.linked.object_id + "/picture?access_token=" + this.access_token;
            } else {
                console.log('error con alguna mierda en getFullFoto', item);
            }
        },

        _getWith: function (item) {
            var html = "";
            if (item && item.with_tags && item.with_tags.data.length > 0) {
                html += "-" + this.data.with + " " + this._parserUser(item.with_tags.data[0]) + " ";
                if (item.with_tags.data.length > 1) {
                    var size = item.with_tags.data.length - 1;
                    html += this.data.and + " " + size + " ";
                    html += item.with_tags.data.length > 2 ? this.data.others : this.data.other
                }
            }
            return html;
        },

        // Private functions
        _language_response: function (event, detail) {
            this.data = detail.response;
            if (this.access_token) {
                this.$.requestData.generateRequest();
            }
        },
        _dataResponse: function (event, detail) {
            if (detail.response && (detail.response.data || detail.response.home)) {
                // Support mocked data
                if (detail.response.home) {
                    this.set("events", detail.response.home.data);
                } else {
                    this.set("events", detail.response.data);
                }
                this._reParserLinked(this.events);
                this._changeTime(this.events);
            } else {
                this._loadMock();
            }
        },
        _loadMock: function(){
            this.access_token = "";
            this.$.requestMock.generateRequest();
        },
        _refreshResponse: function (event, detail) {
            var firstId = this.events[0].id;
            var newEvents = detail.response.home.data;
            var finded = false;
            var i = 0;
            var realNew = [];
            for (i; i < newEvents.length && !finded; i++) {
                if (newEvents[i].id == firstId) {
                    finded = true;
                }
            }
            if (--i) {
                realNew = newEvents.slice(0, i);
                realNew = this._reparseRefresh(realNew);
                for (var j = 0; j < realNew.length; j++) {
                    //this.events.unshift(realNew[j]);
                    this.unshift('events', realNew[j]);
                }
                this._changeTime(this.events);
            }
        },
        _changeTime: function (list) {
            for (i = 0; i < list.length; i++) {
                var date = new Date(list[i].updated_time);
                var current_date = new Date();
                var time;
                /* Años*/
                if ((current_date.getFullYear() - date.getFullYear()) != 0) {
                    var dif = current_date.getFullYear() - date.getFullYear()
                    time = dif == 1 ? dif + " " + this.data.year : dif + " " + this.data.years;
                    /* Meses */
                } else if ((current_date.getMonth() - date.getMonth()) != 0) {
                    var dif = current_date.getMonth() - date.getMonth();
                    time = dif == 1 ? dif + " " + this.data.month : dif + " " + this.data.months;
                    /* Dias */
                } else if ((current_date.getDate() - date.getDate()) == 0) {
                    if ((current_date.getHours() - date.getHours()) == 0) {
                        if ((current_date.getMinutes() - date.getMinutes()) == 0) {

                            time = current_date.getSeconds() - date.getSeconds() + " " + this.data.seconds
                        }
                        else {
                            time = current_date.getMinutes() - date.getMinutes() + " " + this.data.minutes
                        }
                    }
                    else {
                        if (current_date.getHours() - date.getHours() == 1) {
                            time = current_date.getHours() - date.getHours() + " " + this.data.hour;
                        } else {
                            time = current_date.getHours() - date.getHours() + " " + this.data.hours;
                        }
                    }
                }
                else if (((current_date.getDate() - date.getDate()) < 15) && ((current_date.getDate() - date.getDate()) > 0)) {
                    if ((current_date.getDate() - date.getDate()) == 1) {
                        time = current_date.getDate() - date.getDate() + " " + this.data.day
                    }
                    else {
                        time = current_date.getDate() - date.getDate() + " " + this.data.days
                    }
                }
                else {
                    var month = [this.data.january, this.data.february, this.data.march, this.data.april, this.data.may, this.data.june, this.data.july, this.data.august, this.data.september, this.data.october, this.data.november, this.data.december];
                    time = date.getDate() + " " + this.data.of + " " + month[date.getMonth()] + " " + this.data.of + " " + date.getFullYear();

                }
                this.set("events." + i + ".time", time);

            }
        },
        _reparseRefresh: function (list) {
            for (i = 0; i < list.length - 1; i++) {
                if (list[i].name == list[i + 1].from.name) {
                    list[i].linked = list[i + 1];
                    list.splice(i + 1, 1);
                }
                if (list[i].message) {
                    list[i].message = list[i].message.replace(/(?:\r\n|\r|\n)/g, "<br>");
                    list[i].message = this._parseText(list[i].message);
                }
            }
            return list;
        },
        _reParserLinked: function (list) {
            for (i = 0; i < list.length - 1; i++) {
                if (list[i].name == list[i + 1].from.name) {
                    this.set("events." + i + ".linked", list[i + 1])
                    this.splice("events", i + 1, 1);
                } else if (list[i].picture && list[i].picture === list[i + 1].picture) {
                    this.set("events." + i + ".linked", list[i + 1])
                    this.splice("events", i + 1, 1);
                }
                if (list[i].message) {
                    this.set("events." + i + ".message", list[i].message.replace(/(?:\r\n|\r|\n)/g, "<br>"));
                    this.set("events." + i + ".message", this._parseText(list[i].message));
                }
            }
        },
        _parserUser: function (user) {
            var tag = "<a style='color:rgb(59, 89, 152);font-weight:bold;text-decoration:none;overflow-wrap:break-word' href='https://www.facebook.com/app_scoped_user_id/" + user.id + "' target='_blank'>" + user.name + "</a>";
            return tag;
        },
        _parsePageUrl: function (page) {
            var tag = "<a style='color:rgb(59, 89, 152);font-weight:bold;text-decoration:none;overflow-wrap:break-word' href='http://facebook.com/pages/-/" + page.id + "' target='_blank'>" + page.name + "</a>";
            return tag
        },
        _parseText: function (text) {
            if (text) {
                text = this._parseURL(text);
                text = this._parseHashtag(text);
            }
            return text ? text : "";
        },
        _parseURL: function (text) {
            return text.replace(/(?:http|https)+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=#]+/g, function (url) {
                url = url.replace("#", "%23");
                return '<a style="color:rgb(59, 89, 152);overflow-wrap:break-word" href=' + url + ' target="_blank">' + url + '</a>'
            })
        },
        _parseHashtag: function (text) {
            return text.replace(/[#]+[A-Za-z0-9-_ñáéíóúàèìòùç]+/g, function (t) {
                var tag = t.replace("#", "")
                return '<a style="color:rgb(59, 89, 152);overflow-wrap:break-word" href="https://www.facebook.com/hashtag/' + tag + ' "target="_blank"><span>#' + tag + '</span></a>'
            });
        },
    });

