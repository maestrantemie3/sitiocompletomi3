//NOTE:  NO PROTOTYPE IN ADS.JS!  (because of /mobile)
if (!window.Scribd) var Scribd = new Object();
if (!Scribd.Ads) Scribd.Ads = new Object();

if (!Scribd.Ads.use_gpt) Scribd.Ads.use_gpt = false;
Scribd.Ads.attributes = {};
Scribd.Ads.max_between_page = 21;

  Scribd.Ads.addAttribute = function(name, value) {
    // assert(value != undefined);
    if (Scribd.Ads.attributes[name] == undefined && value != undefined) {
      if (!Scribd.Ads.use_gpt) {
        //note: some of these values are arrays.  Despite 
        //?google_debug's behavior, these array targetings
        //work as we expect (eg: we target ANY of the values in 
        // array value)
        GA_googleAddAttr(name, value);
      }
    Scribd.Ads.attributes[name] = value;
  }
};


// abstraction for refershUnit objects...
Scribd.Ads.RefreshUnit = function(name) {
  var self, params;
  self = Scribd.Ads.RefreshUnit.all[name] = this;
  
  params = Scribd.Ads.setupIframeUnit(name);
  this.width = params.size[0];
  this.height = params.size[1];
  this.url_params = params.url_params;
  this.name = name;
  this.isOver = false;
  this.timesRefreshed = 0;
  this.lastRefreshed = 0;
  this.timer = null;
  
  Scribd.Ads.observeUserActivity();
  document.write('<div id="' + name + '_container" class="hideable_ad"></div>');

  //setup hover watching
  // only have 'observe' when not in mobile.
  if( this.container().observe ) {
    this.container().observe('mouseenter', function() {
      self.isOver = true;
    }).observe('mouseleave', function() {
      self.isOver = false;
    });
  } else {
    self.isOver = false;
  }
  
  this.setNextRefresh();
};

Scribd.Ads.RefreshUnit.prototype = {
  container: function() {
    return document.getElementById(this.name + '_container');
  },
  getDuration: function() {
    if(this._duration)
      return this._duration;
    else
      return Scribd.Ads.refreshInterval * 1000;
  },
  resetDuration: function() {
    delete(this._duration);
    return this.getDuration();
  },
  
  duration: function(newDuration) {
    if(typeof(newDuration) === 'number') {
      if (newDuration < 1000)
        newDuration *= 1000;
      //set the duration
      this._duration = newDuration;
      this.setNextRefresh();
      //and reset the timer
    }
    return this.getDuration();
  },
  
  stopRefreshing: function() {
    clearTimeout(this.timer);
    delete(this.timer);
  },
  
  setNextRefresh: function() {
    var timeLeft, self;
    this.stopRefreshing();
    self = this;
    //is it time yet?

    timeLeft = this.duration() - ((new Date()).getTime() - this.lastRefreshed);
    if(timeLeft <= 0) {
      this.refresh();
      timeLeft = 10000 //timeout for ad loading
    }
 
    
    this.timer = setTimeout(function() { self.setNextRefresh(); }, timeLeft);
  },

  refresh: function() {
    //throw refresh in here...
    if ((Scribd.Ads.userIsActive || !Scribd.Ads.trackEngagement) &&
      !this.isOver) {
      //invalidating lastRefreshed, which should be set from ad_refresher
      this.resetDuration();
      this.lastRefreshed = null;
      Scribd.Ads.replaceIframe(this.name, this.width, this.height, this.url_params, this.timesRefreshed);
    }
  },
  
  //called from ad_refresher
  iframeLoaded:  function() {
    this.lastRefreshed = (new Date).getTime();
    this.timesRefreshed += 1;
  }
};

Scribd.Ads.RefreshUnit.get = Scribd.Ads.RefreshUnit.all = {};

(function() {
  var defined_slots = {};

  // gpt only
  Scribd.Ads.defineSlot = function(unit_name, size, node_id) {
    var full_name = '/1024966/ca-pub-7291399211842501/' + unit_name;
    googletag.defineSlot(full_name, size, node_id).addService(googletag.pubads());
    defined_slots[unit_name] = node_id;
  }

  Scribd.Ads.addUnit = function(unit_name) {
    if (Scribd.Ads.use_gpt) {
      googletag.cmd.push(function() {
        var tag_id = defined_slots[unit_name];
        if (!tag_id) {
          throw new 'Attempting to display undeclared ad unit: ' + unit_name;
        }
        googletag.display(tag_id);
      });
    } else {
      GA_googleAddSlot("ca-pub-7291399211842501", unit_name);
      document.write('<div class="hideable_ad" id="' + unit_name + '_container">');
      GA_googleFillSlot(unit_name);
      document.write('</div>');
    }
  };
})();

Scribd.Ads.betweenUnitForPage = function(page_num) {
  var name;
  if (page_num == 1)
    return ['Doc_Between_Top_FullBanner_468x60', [468, 60]];
  else if (page_num % 2 == 1 && page_num <= 21)
    return ['Doc_Between_Leaderboard_BTF_728x90_' + page_num, [728, 90]];
};

Scribd.Ads.addBetweenPageUnit = function(page_num) {
  if (Scribd.Ads.attributes['UserState'] == 'In' && !Scribd.Ads.attributes['FBRecent'])
    return;

  if (navigator.userAgent.match(/iPad/i))
    return;

  //hack to make mcdonalds work
  if (page_num == 1)
    Scribd.Ads.addUnit('Doc_Between_Leaderboard_BTF_679x779');
  if (page_num == 2)
    Scribd.Ads.addUnit('Doc_Between_Leaderboard_BTF_679x250');

  var unit = Scribd.Ads.betweenUnitForPage(page_num);
  if (!unit) return;
  var name = unit[0];
  Scribd.Ads.addUnit(name);

};


Scribd.Ads.addFullPageUnit = function(image_url, link_url) {
  document.write('<div class="autogen_class_views_shared_ad_code">'); // hack so we can get Erector styles but call the js in genserve or DFP
  document.write('<div class="full_page_ad_container">');
  document.write('<div class="full_page_ad">');
  document.write('<a href="' + link_url + '"><img src="' + image_url + '" border="0"></a>');
  document.write('</div>');
  document.write('<div class="b_tl"></div><div class="b_tr"></div><div class="b_br"></div><div class="b_bl"></div><div class="b_t"></div><div class="b_r"></div><div class="b_b"></div><div class="b_l"></div>');
  document.write('</div>');
  document.write('</div>');

  Scribd.Ads.originalFullPageAdWidth = $$('.full_page_ad')[0].getWidth();
  Scribd.Ads.originalFullPageAdInnerWidth = $$('.full_page_ad')[0].down('a').getWidth();

  Scribd.Ads.enableResizingFullPageAds();
};

Scribd.Ads.enableResizingFullPageAds = function() {
  if (typeof docManager === 'undefined') {
    setTimeout(Scribd.Ads.enableResizingFullPageAds, 100);
    return;
  };

  docManager.addEvent('zoomed', Scribd.Ads.resizeFullPageAds);
  docManager.addEvent('enteredFullscreen', Scribd.Ads.resizeFullPageAds);
  docManager.addEvent('exitedFullscreen', Scribd.Ads.resizeFullPageAds);
};

Scribd.Ads.resizeFullPageAds = function() {
  $$('.full_page_ad').each(function(ad) {
    var page = Scribd.Ads.makeFakePageForZooming(ad);
    page.setWidth(docManager._pageWidths);

    if (ad.getWidth() > Scribd.Ads.originalFullPageAdWidth) {
      ad.style.marginLeft = '0px';
      if (ad.style.WebkitTransformOrigin)
        ad.style.WebkitTransformOrigin = 'top center';
      else if (ad.style.MozTransformOrigin)
        ad.style.MozTransformOrigin = 'top center';
      else if (ad.style.OTransformOrigin)
        ad.style.OTransformOrigin = 'top center';
      // TODO: add an else clause that makes this work right in IE
    } else {
      ad.style.marginLeft = ad.getWidth() * (0.5 - ad.down('a').getWidth() / (2 * Scribd.Ads.originalFullPageAdWidth)) + 'px';
      if (ad.style.WebkitTransformOrigin)
        ad.style.WebkitTransformOrigin = 'top left';
      else if (ad.style.MozTransformOrigin)
        ad.style.MozTransformOrigin = 'top left';
      else if (ad.style.OTransformOrigin)
        ad.style.OTransformOrigin = 'top left';
      else
        ad.style.marginLeft = (Scribd.Ads.originalFullPageAdWidth - Scribd.Ads.originalFullPageAdInnerWidth) / 2 + 'px';
    }
  });
};

Scribd.Ads.makeFakePageForZooming = function(ad) {
  if (!Scribd.Ads.fakePagesForZooming)
    Scribd.Ads.fakePagesForZooming = {};

  if (Scribd.Ads.fakePagesForZooming[ad])
    return Scribd.Ads.fakePagesForZooming[ad];

  var fake_page = function() {};

  fake_page.innerPageElem = ad;
  fake_page.containerElem = ad.parentNode;
  fake_page.origWidth = ad.parentNode.getWidth();
  fake_page.origHeight = ad.parentNode.getHeight();
  fake_page._innerPageVisible = true;

  fake_page._setZoomScale = docManager.pages[1]._setZoomScale;
  fake_page._fitContentsToWidth = docManager.pages[1]._fitContentsToWidth;
  fake_page.setWidth = docManager.pages[1].setWidth;

  Scribd.Ads.fakePagesForZooming[ad] = fake_page;
  return fake_page;
};



Scribd.Ads.setupIframeUnit = function(name) {
  var url_params, size;
  url_params = 'ad_unit=' + escape(name);
  size = name.match(/.*_(\d+)x(\d+)$/)
             .slice(1)
             .map(function(f){return parseInt(f);});


  return { size: size, url_params: url_params };
};

Scribd.Ads.addPassbackUnit = function(name, replacingName) {
  var params = Scribd.Ads.setupIframeUnit(name);
  Scribd.Ads.replaceIframe(replacingName, params.size[0], params.size[1], params.url_params, 0);
};

Scribd.Ads.addRefreshUnit = function(name) {
  return new Scribd.Ads.RefreshUnit(name);
};

Scribd.Ads.replaceIframe = function(name, width, height, url_params, skip) {
  var iframe, container, interval;
  container = document.getElementById(name + '_container');
  if(container.hasChildNodes())
    container.parentNode.replaceChild(container.clone(false), container);
  
  iframe = document.createElement('iframe');
  iframe.width = width;
  iframe.height = height;
  iframe.scrolling = 'no';
  iframe.frameBorder = 0;
  iframe.marginWidth = 0;
  iframe.marginHeight = 0;
  iframe.allowTransparency = true;
  iframe.src = '/ad_refresher.html#' + url_params + '&skip=' + skip;
  container.appendChild(iframe);
};

var get_server_option = function(name, default_value) {
  if (typeof Scribd.ServerOptions == 'undefined' || eval('typeof Scribd.ServerOptions.' + name) == 'undefined')
    return default_value;

  return eval('Scribd.ServerOptions.' + name);
};

Scribd.Ads.trackEngagement = false;
Scribd.Ads.userIsActive = false;
Scribd.Ads.inactivityTimer = null;
Scribd.Ads.idleTimeBeforeInactive = get_server_option('ad_refresh_idle_time_before_inactive', 60);
Scribd.Ads.refreshInterval = get_server_option('ad_refresh_interval', 60);
Scribd.Ads.delayBeforeTrackingEngagement = get_server_option('ad_refresh_engagement_tracking_delay', 0);

setTimeout(function() {
  Scribd.Ads.trackEngagement = true;
}, Scribd.Ads.delayBeforeTrackingEngagement * 1000);

Scribd.Ads.onUserActivity = function() {
  Scribd.Ads.userIsActive = true;
  clearTimeout(Scribd.Ads.inactivityTimer);
  Scribd.Ads.inactivityTimer = setTimeout(Scribd.Ads.onUserInactivity, Scribd.Ads.idleTimeBeforeInactive * 1000);
};

Scribd.Ads.onUserInactivity = function() {
  Scribd.Ads.userIsActive = false;
};

Scribd.Ads.observingUserActivity = false;

Scribd.Ads.observeUserActivity = function() {
  if (!Scribd.Ads.observingUserActivity) {
    Scribd.Ads.onUserActivity(); // we consider them active to start off
    document.observe('mousemove', Scribd.Ads.onUserActivity);
    Event.observe(window, 'scroll', Scribd.Ads.onUserActivity);
    Scribd.Ads.observingUserActivity = true;
  }
};

Scribd.Ads.onViewModeChange = function(new_mode, old_mode) {
  if (old_mode == 'scroll')
    $$('.between_page_ads').each(function(ad) { ad.hide(); });
  if (new_mode == 'scroll')
    $$('.between_page_ads').each(function(ad) { ad.show(); });
};

if (typeof docManager !== 'undefined') {
    docManager.addEvent('viewmodeChanged', Scribd.Ads.onViewModeChange);
}

Scribd.Ads.launchVideo = function(timeout) {
  timeout = timeout || 60000;//default to one minute on page
  var interstitial = new __adaptv__.ads.VideoInterstitial();
  interstitial.setAdConfig(
    { key         :'scribd' });
  interstitial.setOptions({ 
      title             : 'Advertisement'
    , classNamePrefix   : 'adaptv-interstitial'
    , backgroundOpacity : 0.7
    , escapeToClose     : true
    , hasCloseButton    : true
    , coverPage         : false // whether to show page immadiately when we call show (before ad is loaded)
    , timeout_ms        : null  // timeout to ad server
    , loadOnView        : 1     // how many page views before we show this 
    , timeCap           : '1s'   // max show once every 10 minutes
    , viewCap           : 1     // max show once every 1 view
  });
  setTimeout(function() {
    interstitial.show();  
  }, timeout);
};

// Passback slot definitions

(function() {
  var as = GA_googleAddSlot,
    ca = "ca-pub-7291399211842501";

  as(ca, "PASSBACK_APAC_Explore_ATF_728x90");
  as(ca, "PASSBACK_APAC_Lihome_ATF_300x250");
  as(ca, "PASSBACK_APAC_Lohome_ATF_300x250");
  as(ca, "PASSBACK_APAC_PPPProfile_ATF_300x250");
  as(ca, "PASSBACK_APAC_PPPReader_ATF_300x250");
  as(ca, "PASSBACK_APAC_Profile_ATF_300x250");
  as(ca, "PASSBACK_APAC_Reader_ATF_300x250");
  as(ca, "PASSBACK_APAC_Reader_ATF_728x90");
  as(ca, "PASSBACK_APAC_Reader_Between_BTF_11_728x90");
  as(ca, "PASSBACK_APAC_Reader_Between_BTF_3_728x90");
  as(ca, "PASSBACK_APAC_Reader_Between_BTF_5_728x90");
  as(ca, "PASSBACK_APAC_Reader_Between_BTF_7_728x90");
  as(ca, "PASSBACK_APAC_Reader_Between_BTF_9_728x90");
  as(ca, "PASSBACK_APAC_Reader_BTF_468x60");
  as(ca, "PASSBACK_APAC_Reader_Pinned_ATF_160x600");
  as(ca, "PASSBACK_APAC_Reader_Pinned_ATF_300x250");
  as(ca, "PASSBACK_APAC_Reader_Pinned_ATF_300x600");
  as(ca, "PASSBACK_APAC_ROS_160x600");
  as(ca, "PASSBACK_APAC_ROS_300x250");
  as(ca, "PASSBACK_APAC_ROS_300x600");
  as(ca, "PASSBACK_APAC_ROS_468x60");
  as(ca, "PASSBACK_APAC_ROS_728x90");
  as(ca, "PASSBACK_EMEA_Explore_ATF_728x90");
  as(ca, "PASSBACK_EMEA_Lihome_ATF_300x250");
  as(ca, "PASSBACK_EMEA_Lohome_ATF_300x250");
  as(ca, "PASSBACK_EMEA_PPPProfile_ATF_300x250");
  as(ca, "PASSBACK_EMEA_PPPReader_ATF_300x250");
  as(ca, "PASSBACK_EMEA_Profile_ATF_300x250");
  as(ca, "PASSBACK_EMEA_Reader_ATF_300x250");
  as(ca, "PASSBACK_EMEA_Reader_ATF_728x90");
  as(ca, "PASSBACK_EMEA_Reader_Between_BTF_11_728x90");
  as(ca, "PASSBACK_EMEA_Reader_Between_BTF_3_728x90");
  as(ca, "PASSBACK_EMEA_Reader_Between_BTF_5_728x90");
  as(ca, "PASSBACK_EMEA_Reader_Between_BTF_7_728x90");
  as(ca, "PASSBACK_EMEA_Reader_Between_BTF_9_728x90");
  as(ca, "PASSBACK_EMEA_Reader_btf_468x60");
  as(ca, "PASSBACK_EMEA_Reader_Pinned_ATF_160x600");
  as(ca, "PASSBACK_EMEA_Reader_Pinned_ATF_300x250");
  as(ca, "PASSBACK_EMEA_Reader_Pinned_ATF_300x600");
  as(ca, "PASSBACK_EMEA_ROS_160x600");
  as(ca, "PASSBACK_EMEA_ROS_300x250");
  as(ca, "PASSBACK_EMEA_ROS_300x600");
  as(ca, "PASSBACK_EMEA_ROS_468x60");
  as(ca, "PASSBACK_EMEA_ROS_728x90");
  as(ca, "PASSBACK_LATAM_Explore_ATF_728x90");
  as(ca, "PASSBACK_LATAM_lihome_atf_300x250");
  as(ca, "PASSBACK_LATAM_lohome_atf_300x250");
  as(ca, "PASSBACK_LATAM_pppprofile_atf_300x250");
  as(ca, "PASSBACK_LATAM_pppreader_atf_300x250");
  as(ca, "PASSBACK_LATAM_profile_atf_300x250");
  as(ca, "PASSBACK_LATAM_reader_atf_300x250");
  as(ca, "PASSBACK_LATAM_reader_atf_728x90");
  as(ca, "PASSBACK_LATAM_reader_between_btf_728x90_11");
  as(ca, "PASSBACK_LATAM_reader_between_btf_728x90_3");
  as(ca, "PASSBACK_LATAM_reader_between_btf_728x90_5");
  as(ca, "PASSBACK_LATAM_reader_between_btf_728x90_7");
  as(ca, "PASSBACK_LATAM_reader_between_btf_728x90_9");
  as(ca, "PASSBACK_LATAM_reader_btf_468x60");
  as(ca, "PASSBACK_LATAM_reader_pinned_atf_160x600");
  as(ca, "PASSBACK_LATAM_reader_pinned_atf_300x250");
  as(ca, "PASSBACK_LATAM_reader_pinned_atf_300x600");
  as(ca, "PASSBACK_LATAM_ros_160x600");
  as(ca, "PASSBACK_LATAM_ros_300x250");
  as(ca, "PASSBACK_LATAM_ros_300x600");
  as(ca, "PASSBACK_LATAM_ros_468x60");
  as(ca, "PASSBACK_LATAM_ros_728x90");
  as(ca, "PASSBACK_NASO_explore_atf_728x90");
  as(ca, "PASSBACK_NASO_lihome_atf_300x250");
  as(ca, "PASSBACK_NASO_lohome_atf_300x250");
  as(ca, "PASSBACK_NASO_pppprofile_atf_300x250");
  as(ca, "PASSBACK_NASO_pppreader_atf_300x250");
  as(ca, "PASSBACK_NASO_profile_300x250");
  as(ca, "PASSBACK_NASO_reader_atf_300x250");
  as(ca, "PASSBACK_NASO_reader_atf_728x90");
  as(ca, "PASSBACK_NASO_reader_between_btf_11_728x90");
  as(ca, "PASSBACK_NASO_reader_between_btf_3_728x90");
  as(ca, "PASSBACK_NASO_reader_between_btf_5_728x90");
  as(ca, "PASSBACK_NASO_reader_between_btf_7_728x90");
  as(ca, "PASSBACK_NASO_reader_between_btf_9_728x90");
  as(ca, "PASSBACK_NASO_reader_btf_468x60");
  as(ca, "PASSBACK_NASO_reader_pinned_btf_160x600");
  as(ca, "PASSBACK_NASO_reader_pinned_btf_300x250");
  as(ca, "PASSBACK_NASO_reader_pinned_btf_300x600");
  as(ca, "PASSBACK_NASO_ros_160x600");
  as(ca, "PASSBACK_NASO_ros_300x250");
  as(ca, "PASSBACK_NASO_ros_300x600");
  as(ca, "PASSBACK_NASO_ros_468x60");
  as(ca, "PASSBACK_NASO_ros_728x90");
})();

