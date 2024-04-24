# **PallyCon Multi-DRM + Tizen TV**
> Multi-DRM integration sample for Samsung Tizen TV application


 ## Overview

This document explains how to play `PallyCon Multi-DRM` content on `Samsung Smart TV(Tizen)`.

There are two ways to play PallyCon Multi-DRM content on Tizen OS, and we provide samples for you to test.
- Playback using AVPlay API : [PallyConTizen-AVPlay](#PallyConTizen-AVPlay-Sample) Sample
- Playback using HTML5 Player (Shaka) : [PallyConTizen-HTMLShaka](#PallyConTizen-HTMLShaka-Sample) Sample



## Supported Environments


- [Tizen 4.0](https://developer.samsung.com/smarttv/develop/specifications/general-specifications.html) and later
- The sample in this document was tested on [LS32BM702UKXKR](https://www.samsung.com/sec/monitors/smart-ls32bm702ukxkr-d2c/LS32BM702UKXKR/)(Tizen 6.5).



## Checklist


- The emulator does not support DRM, so you must have a physical TV device.
- Download [Tizen Studio](https://developer.samsung.com/smarttv/develop/tools/tizen-studio.html) and install it following the [installation guide](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html).
- Run [Packager Manager](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html#Installing-Required-Extensions), which was installed together with Tizen Studio installation, and install the items below.
  1. Tizen SDK tools
  2. TV Extensions-X.X
  3. TV Extension Tools
  4. Install Samsung Certificate Extension and [create Certification Profile](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
- For more information about your TV's Tizen version, supported media, etc., please refer to the [General Specifications](https://developer.samsung.com/tv/develop/specifications/general-specifications) on our homepage.



## PallyConTizen-AVPlay Sample 


> The Tizen SDK provides a [PlayerAVPlayDRM](https://github.com/SamsungDForum/PlayerAVPlayDRM) sample that uses [webapis.avplay](https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html). The `PlayerAVPlayDRM` sample implements the functions required for DRM playback, including the [webapis.avplay.setDrm()](https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html#AVPlayManager-setDrm) function. For the `PlayerAVPlayDRM` sample, all source files are in the same path. In order to run the `PlayerAVPlayDRM` sample as a Tizen Studio project, you must edit the `index.html` file and change the paths to the `.js file` and `.css file`.

> `PallyConTizen-AVPlay` Sample was implemented by referring to [Playback Using AVPlay](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html) in `Web Application` on `Smart TV` on [Samsung developer](https://developer.samsung.com/) site.

#### `PallyConTizen-AVPlay` is a sample modified to reflect the above content so that it can be used in Tizen Studio.

- You can test it by changing the value of the `drms` variable in the `main.js` file included in `PallyConTizen-AVPlay` to `PallyCon Multi-DRM` information as follows.

  ```javascript
  // main.js
  ...
  var drms = {
      PLAYREADY: {
          name: 'PlayReady',
          url: 'https://playready-dash-content-url/stream.mpd',
          licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
          customData: 'PallyCon Multi-DRM License Request Token'
      },
      WIDEVINE: {
          name: 'Widevine',
          url: 'https://widevine-dash-content-url/stream.mpd',
          licenseServer: 'https://license-global.pallycon.com/ri/licenseManager.do',
          customData: 'PallyCon Multi-DRM License Request Token'
      }
  };
  ...
  ```

  

- Set PallyCon Multi-DRM information through the `setPlayready` and `setWidevine` functions in the `videoPlayer.js` file.

  - [PlayReady](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html) 

    ```javascript
    // videoPlayer.js
    setPlayready: function () {
        var drmParam = {
            DeleteLicenseAfterUse: true
        };
        if (chosenDrm.licenseServer !== '' && chosenDrm.licenseServer !== undefined) {
            drmParam.LicenseServer = chosenDrm.licenseServer;
        }
        if (chosenDrm.customData !== '' && chosenDrm.customData !== undefined) {
            drmParam.CustomData = chosenDrm.customData;
        }
    
        try {
            webapis.avplay.setDrm("PLAYREADY", "SetProperties", JSON.stringify(drmParam));
        } catch (e) {
            log(e.name);
        }
    }
    ```

    

  - [Widevine](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html)

    ```javascript
    // videoPlayer.js
    setWidevine: function () {
        var PrepareSuccessCallback = function () {
            webapis.avplay.play();
        };
    
        var drmParam = {};
        drmParam.AppSession = "app session ID";
        drmParam.DataType = "MPEG-DASH";
        try {
            webapis.avplay.setDrm("WIDEVINE_CDM", "SetProperties", JSON.stringify(drmParam));
            webapis.avplay.prepareAsync(PrepareSuccessCallback);
        } catch (e) {
            log(e.name);
        }
    }
    
    // webapis.avplay.setListener(AVPlayPlaybackCallback);
    AVPlayPlaybackCallback.ondrmevent: function (drmEvent, drmData) {
      	
      ...
        
        if (drmData.name == "Challenge" && drmEvent == "WIDEVINE_CDM") {
            var message = atob(drmData.challenge); // The challenge data is base64 encoded type.   
    
            var buf = new Uint8Array(message.length);
            for (var i = 0; i < message.length; ++i)
                buf[i] = message.charCodeAt(i);
    
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.responseType = "arraybuffer";
            xmlhttp.open("POST", chosenDrm.licenseServer);
            xmlhttp.setRequestHeader("pallycon-customdata-v2", chosenDrm.customData);
    
            xmlhttp.onload = function (e) {
                if (this.status == 200) {
                    if (this.response) {
                        const base64Response = btoa(new Uint8Array(this.response)
                            .reduce(function (data, byte) { return data + String.fromCharCode(byte) }, ''));
    
                        var licenseParam = drmData.session_id + "PARAM_START_POSITION" + base64Response + "PARAM_START_POSITION";
                        webapis.avplay.setDrm("WIDEVINE_CDM", "widevine_license_data", licenseParam);
                    }
                }
            };
            xmlhttp.send(buf);
        } else if (drmData.name == "DrmError") {
            // error handling
            log('DRM Error: ' + drmData.name + '::::')
        }
    },
    ```

    

- If you play 4K video, you must set `SET_MODE_4K`.

  ```javascript
  // videoPlayer.js
  set4K: function () {
      webapis.avplay.setStreamingProperty("SET_MODE_4K", "true");
  },
  ```

  

### More..


  - `PallyConTizen-AVPlay` follows [LICENSE.txt](https://github.com/SamsungDForum/PlayerAVPlayDRM/blob/master/LICENSE.txt) of [PlayerAVPlayDRM sample](https://github.com/SamsungDForum/PlayerAVPlayDRM).
  - When running PallyConTizen-AVPlay in Tizen Studio, the directory name and project name must be `PallyConTizen-AVPlay`. 
    - If you use a different name, the project will not open properly. 
    - Since the distributed compressed file name is `PallyConTizen-AVPlay`, in a normal environment, just uncompress the file without changing the file name.

  - If you inevitably use a different name, you must modify the `PallyConTizen-AVPlay` value in the `.project` and `config.xml` files in PallyConTizen-AVPlay.



## PallyConTizen-HTMLShaka Sample

> Shaka Player is an [Google open-source JavaScript library](https://github.com/shaka-project/shaka-player) for adaptive media. It plays adaptive media formats (such as [DASH](http://dashif.org/), [HLS](https://developer.apple.com/streaming/) and [MSS](https://learn.microsoft.com/en-us/iis/media/smooth-streaming/smooth-streaming-transport-protocol)) in a browser, without using plugins or Flash. Instead, Shaka Player uses the open web standards [MediaSource Extensions](https://www.w3.org/TR/media-source/) and [Encrypted Media Extensions](https://www.w3.org/TR/encrypted-media/).

#### The `PallyConTizen-HTMLShaka` sample uses Shaka Player.

- You can test it by changing the value of the `playerConfig` variable in the `main.js` file included in `PallyConTizen-HTMLShaka` to `PallyCon Multi-DRM` information as follows.

  ```javascript
  // main.js
  var playerConfig = [
      ...
      
    	{
          // PallyCon Multi-DRM Widevine or PlayReady Content
          manifest: 'https://widevine-dash-content-url/stream.mpd',
          description: 'PallyCon Contents',
          drmServers: {
              'com.widevine.alpha': 'https://license-global.pallycon.com/ri/licenseManager.do'
              // or 'com.microsoft.playready': 'https://license-global.pallycon.com/ri/licenseManager.do'
          }
      }
  ];
  ```

  

- Set the licence acquisition token in the `initPlayer()` function of the `main.js` file.

  ```javascript
  // main.js
  function initPlayer() {
      player = new window.shaka.Player(videoEl);
  
      ...
  
      // set PallyCon Multi-DRM Token
      player.getNetworkingEngine().registerRequestFilter(function (type, request) {
          // Only add headers to license requests:
          if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
              console.log("request :" + request.body);
              // PallyCon License Request Token
              request.headers['pallycon-customdata-v2'] = 'PallyCon Multi-DRM License Request Token';
          }
      });
  }
  ```

  

## More..

- `PallyConTizen-HTMLShaka` follows [LICENSE.txt](https://github.com/SamsungDForum/PlayerAVPlayDRM/blob/master/LICENSE.txt) of [SampleWebApps-PlayerHTMLShaka](https://github.com/SamsungDForum/SampleWebApps-PlayerHTMLShaka).

- To use `Shaka Player` on Tizen, you need to specify in your [content security policy](https://developer.tizen.org/development/training/web-application/understanding-tizen-programming/web-runtime#security) in your `config.xml` file.

  ```xml
  // config.xml
  <tizen:content-security-policy>script-src 'self' 'unsafe-inline' ./assets/shaka-player.compiled.js blob: data:</tizen:content-security-policy>
  ```
- For more information on Security and Privilege in Tizen, see the [Tizen Developer page](https://developer.tizen.org/development/training/web-application/understanding-tizen-programming/web-runtime#security).
