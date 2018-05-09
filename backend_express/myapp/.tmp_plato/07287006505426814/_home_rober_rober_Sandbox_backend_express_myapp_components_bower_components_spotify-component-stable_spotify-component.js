
    Polymer({
      is: 'spotify-component',
      properties: {
        token: String,
        nombre: String,
        dueño: String,
        res: {
          value: function () { return []; },
          type: Array,
          notify: true
        },
        headers: {
          type: Object,
          computed: '_getHeaders(token)'
        },
        refresh_time: {
          type: Number,
          value: 120000,
          reflectToAttribute: true
        }
      },
      _getHeaders: function (token) {
        return { Authorization: 'Bearer ' + this.token };
      },
      respuestaSPFY: function (evt) {
        this.loading = false;
        this._interval = this._interval || window.setInterval(this._refresh.bind(this), this.refresh_time);

        console.log(evt.detail.response);
        var response = evt.detail.response;
        this.set('res', []);
        window.setTimeout(function () {
          var items = response.items;
          for (var i = 0; i < items.length; i++) {
            this.set('res', response.items);
            //console.log(items[i].nombre);
          }
        }.bind(this), 100);
      },
      respuestaPistas: function (evt) {
        var response = evt.detail.response;
        //console.log(response);
        this.set('res.' + evt.model.index + ".infoPista", response.items);
      },
      _refresh: function () {
        this.loading = true;
        this.$.cons.generateRequest();
      },
      detached: function () {
        if (this._interval) {
          window.clearInterval(this._interval);
        }
      },
    });
  
