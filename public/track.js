(function() {
  if (window.FunnelTrack) return;

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  // Extract root domain for cookie sharing across subdomains
  // e.g. "novaav.brenoxavier.com.br" → ".brenoxavier.com.br"
  var getRootDomain = function() {
    var parts = window.location.hostname.split('.');
    if (parts.length >= 3) {
      return '.' + parts.slice(-3).join('.');
    }
    if (parts.length === 2) {
      return '.' + parts.join('.');
    }
    return window.location.hostname;
  };

  var setCookie = function(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    var domain = getRootDomain();
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;domain=' + domain + ';SameSite=Lax';
  };

  var getCookie = function(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  var getSessionId = function() {
    var sid = localStorage.getItem('funnel_track_session');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('funnel_track_session', sid);
    }
    return sid;
  };

  var getUrlParams = function() {
    var params = new URLSearchParams(window.location.search);
    
    // Save bx_click to localStorage
    var bxClick = params.get('bx_click');
    if (bxClick) {
      localStorage.setItem('bx_click', bxClick);
    }
    
    // Save UTMs to sessionStorage AND cookies (for cross-subdomain)
    UTM_KEYS.forEach(function(k) {
      var v = params.get(k);
      if (v) {
        sessionStorage.setItem(k, v);
        setCookie('ft_' + k, v, 30); // 30 days
      }
    });

    // Read with priority: URL param > sessionStorage > cookie
    var result = {};
    UTM_KEYS.forEach(function(k) {
      result[k] = params.get(k) || sessionStorage.getItem(k) || getCookie('ft_' + k) || null;
    });

    result.fbclid = params.get('fbclid');
    result.bx_click = localStorage.getItem('bx_click');
    return result;
  };

  var sendEvent = async function(eventType, value, leadData) {
    value = value || 0;
    leadData = leadData || {};
    var token = window.FUNNEL_TRACK_TOKEN;
    if (!token) {
      console.warn('FunnelTrack: Token not found. Set window.FUNNEL_TRACK_TOKEN before loading script.');
      return;
    }

    try {
      var API_URL = window.FUNNEL_TRACK_API_URL || 'https://pgkxfznjwvcgaptflnds.supabase.co/functions/v1/funnel-track';

      var urlParams = getUrlParams();
      var payload = {
        token: token,
        event_type: eventType,
        session_id: getSessionId(),
        url: window.location.href,
        referrer: document.referrer,
        value: value
      };

      // Merge URL params
      for (var key in urlParams) {
        payload[key] = urlParams[key];
      }
      // Merge lead data
      for (var lkey in leadData) {
        payload[lkey] = leadData[lkey];
      }

      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (err) {
      console.error('FunnelTrack error:', err);
    }
  };

  window.FunnelTrack = {
    event: sendEvent,
    lead: function(email, phone) { return sendEvent('lead', 0, { email: email, phone: phone }); },
  };

  sendEvent('page_view');
})();
