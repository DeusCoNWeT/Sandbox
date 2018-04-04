var bkg = chrome.extension.getBackgroundPage();
var SCOPE_MAPPING = {};


// Query params to JSON var
function parseQuery(qstr) {
  var query = {};
  var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }
  return query;
}

// Look for facebook scopes
function getScopeFacebook(url) {
  var scope = "";
  var match = url.match(/scope=([^&]*)\&/);
  if (match && match.length > 1) {
    scope = decodeURIComponent(match[1]);
  }
  return scope;
}

// TODO Send data to mixpanel. 
function sendDataToMixpanel(results, params, domain) {
  // Get origin from callback_url
  var callback_url = params.domain || params.callback_url || params.redirect_uri;
  var check_url = false;
  var match_url;
  SCOPE_MAPPING.origin.forEach(function (url) {
    if (callback_url && (url.indexOf(callback_url) != -1 || callback_url.indexOf(url) != -1)){
      check_url = true;
      match_url = url;
    } 
  });

  if (check_url) {
    console.log("TODO: Se deben guardar los datos", results, callback_url,SCOPE_MAPPING.experiment_id);
    var xhr = new XMLHttpRequest();
    var url = "https://centauro.ls.fi.upm.es:4444/security";
    var penalization = SCOPE_MAPPING.penalization || 1.5;
    var max_value = SCOPE_MAPPING.max_value || 5;
    var value = max_value - (results.extra_reads/results.max_reads) - (results.extra_writes/results.max_writes) * penalization;
    var data = {
      results: results,
      value: value,
      domain: match_url,
      experiment_id: SCOPE_MAPPING.experiment_id
    };
    if (SCOPE_MAPPING.mixpanelToken) data.mixpanelToken =SCOPE_MAPPING.mixpanelToken;
    xhr.open("POST",url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));

  }
}

// Callback from any request from any filtered url.
var requestCallback = function (details) {

  // Check if url has query params
  var base_url = decodeURIComponent(details.url);
  if (base_url.indexOf('?') == -1) return;

  // Split domain and query paramss
  var split_url = base_url.match(/https?:\/\/[^\?]*\?(.*)/);
  var domain_regex = split_url[0].match(/(https?:\/\/[^\/]*).*/);
  var domain = domain_regex[1];

  var params = parseQuery(split_url[1]);
  // Facebook has a custom function in order to get scopes.
  if (domain === "https://www.facebook.com") {
    params.scope = getScopeFacebook(base_url);
  }
  // If scope is not defined return 
  if (!params.scope) return;

  var scopes = params.scope.split(/,|\s/);
  // Look for type of scope (read or write)
  var permissions = [];
  scopes.forEach(function (scope) {
    if (!SCOPE_MAPPING.domain[domain] || !SCOPE_MAPPING.domain[domain][scope]) {
      console.error("Domain or scope is not registered on scope mapping");
      return;
    }
    permissions.push(SCOPE_MAPPING.domain[domain][scope]);
  });

  var results = {};
  results.min_reads = SCOPE_MAPPING.domain[domain].min_reads || 0;
  results.min_writes = SCOPE_MAPPING.domain[domain].min_writes || 0;
  
  results.total_reads = permissions.filter(function(el){return el == "read";}).length;
  results.total_writes = permissions.filter(function(el){return el == "write";}).length;
 
  results.extra_reads = results.total_reads -results.min_reads;
  results.extra_writes = results.total_writes -results.min_writes;
  
  results.max_reads = 0;
  results.max_writes = 0;

  var domain_scopes = SCOPE_MAPPING.domain[domain];
  for (var perm in domain_scopes) {
    if ( domain_scopes.hasOwnProperty(perm) ) {
      if (domain_scopes[perm] == "read") results.max_reads++;
      if (domain_scopes[perm] == "write") results.max_writes++;
    }
  }
  sendDataToMixpanel(results, params, domain);
};


// Main
(function main() {
  // Load configuratión files
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      SCOPE_MAPPING = JSON.parse(xhr.responseText);
      console.log("Configuration", SCOPE_MAPPING);
      var filter = { urls: SCOPE_MAPPING.urls };
      var opt_extraInfoSpec = [];

      // Set listeners
      chrome.webRequest.onSendHeaders.addListener(
        requestCallback, filter, opt_extraInfoSpec);
    }
  };
  xhr.open("GET", chrome.extension.getURL('/scripts/config.json'), true);
  xhr.send();
})();
