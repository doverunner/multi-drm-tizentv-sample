(function() {
	'use strict';

	/**
	 * Displays logging information on the screen and in the console.
	 * 
	 * @param {string}
	 *            msg - Message to log.
	 */
	function log(msg) {
		var logsEl = document.getElementById('logs');

		if (msg) {
			// Update logs
			console.log('[PlayerAvplayDRM]: ', msg);
			logsEl.innerHTML += msg + '<br />';
		} else {
			// Clear logs
			logsEl.innerHTML = '';
		}

		logsEl.scrollTop = logsEl.scrollHeight;
	}
	
	var player;

	// flag to monitor UHD toggling
	var uhdStatus = false;

	// Configuration data for different DRM systems
	/**
	 * 
	 * @property {String} name - name to be displayed in UI
	 * @property {String} url - content url
	 * @property {String} licenseServer - [Playready/Widevine] url to the
	 *           license server
	 * @property {String} customData - [Playready] extra data to add to the
	 *           license request
	 */
	var drms = {
		NO_DRM : {
			name : 'No DRM',
			url : 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest'
		},
		WIDEVINE : {
			name : 'Widevine',
			url : 'https://drm-contents.doverunner.com/TEST/PACKAGED_CONTENT/TEST_SIMPLE/dash/stream.mpd',
			licenseServer : 'https://drm-license.doverunner.com/ri/licenseManager.do',
			customData : 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJwYWxseWNvbiIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiJTRFhzQjRrUTJockFoaUhESTZoMjBhdk1UVGZHQlZvS0VLZVAyVEhOR1NZPSIsImNpZCI6IlRlc3RSdW5uZXIiLCJwb2xpY3kiOiI5V3FJV2tkaHB4VkdLOFBTSVljbkpzY3Z1QTlzeGd1YkxzZCthanVcL2JvbVFaUGJxSSt4YWVZZlFvY2NrdnVFZnhEY2NtN2NXZFZYcXJkTWdBUWptcVo5bzdYTEZ6MjBOaG1Kdklpd1FidWhLaCtDMmZJSEw5T3UxU09Bc2hQU0FWZHhhWVVKSnJsWjVVMXU1UGNlcjE0NVpCczdnc3ZRc0lsbDlGVHZXanQ3bWhaOHJ3ejdybVNYcURBdEdqYTRsYmVrUnhcL1pyRWx4dkJhWXV0YWFvdVlISWpkNlZpRWVXZEVpRzJIV0VIMGczcW1LYW1QbUp2VUluN0tVODZrUDQiLCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTE3VDAzOjIzOjAyWiJ9'
		},	
	};

	/**
	 * Register keys used in this application
	 */
	function registerKeys() {
		var usedKeys = [ 'MediaPause', 'MediaPlay', 'MediaPlayPause',
				'MediaFastForward', 'MediaRewind', 'MediaStop', '0', '1', '2',
				'3' ];

		usedKeys.forEach(function(keyName) {
			tizen.tvinputdevice.registerKey(keyName);
		});
	}

	/**
	 * Handle input from remote
	 */
	function registerKeyHandler() {
		document.addEventListener('keydown', function(e) {
			switch (e.keyCode) {
			case 13: // Enter
				player.toggleFullscreen();
				break;
			case 38: // UP arrow
				switchDrm('up');
				break;
			case 40: // DOWN arrow
				switchDrm('down');
				break;
			case 10252: // MediaPlayPause
			case 415: // MediaPlay
			case 19: // MediaPause
				player.playPause();
				break;
			case 413: // MediaStop
				player.stop();
				break;
			case 417: // MediaFastForward
				player.ff();
				break;
			case 412: // MediaRewind
				player.rew();
				break;
			case 48: // key 0
				log();
				break;
			case 49: // Key 1
				setUhd();
				break;
			case 50: // Key 2
				player.getTracks();
				break;
			case 51: // Key 3
				player.getProperties();
				break;
			case 10009: // Return
				if (webapis.avplay.getState() !== 'IDLE'
						&& webapis.avplay.getState() !== 'NONE') {
					player.stop();
				} else {
					tizen.application.getCurrentApplication().hide();
				}
				break;
			default:
				log("Unhandled key");
			}
		});
	}

	/**
	 * Display application version
	 */
	function displayVersion() {
		var el = document.createElement('div');
		el.id = 'version';
		el.innerHTML = 'ver: ' + tizen.application.getAppInfo().version;
		document.body.appendChild(el);
	}

	function registerMouseEvents() {
		const playBtn = document.querySelector('.video-controls .play');
		if (!playBtn) {
			alert('PlayButton is nothing!');
		} else {
		  playBtn.addEventListener('click', function() {
			  player.playPause();
			  document.getElementById('streamParams').style.visibility = 'visible';
		  });
		}
		const stopBtn = document.querySelector('.video-controls .stop');
		if (!stopBtn) {
		  alert('StopButton is nothing!');
		} else {
		  playBtn.addEventListener('click', function() {
			  player.stop();
			  document.getElementById('streamParams').style.visibility = 'hidden';
		  });
		}
		document.querySelector('.video-controls .pause').addEventListener(
				'click', player.playPause);
		document.querySelector('.video-controls .ff').addEventListener('click',
				player.ff);
		document.querySelector('.video-controls .rew').addEventListener(
				'click', player.rew);
		document.querySelector('.video-controls .fullscreen').addEventListener(
				'click', player.toggleFullscreen);
	}

	/**
	 * Create drm switching list
	 */
	function createDrmList() {
		var drmParent = document.querySelector('.drms');
		var currentDrm;
		var li;
		for ( var drmID in drms) {
			li = document.createElement('li');
			li.className = li.innerHTML = drms[drmID].name;
			li.dataset.drm = drmID;
			drmParent.appendChild(li);
		}
		currentDrm = drmParent.firstElementChild;
		currentDrm.classList.add('drmFocused');
	}

	/**
	 * Enabling uhd manually in order to play uhd streams
	 */
	function setUhd() {
		if (!uhdStatus) {
			if (webapis.productinfo.isUdPanelSupported()) {
				log('4k enabled');
				uhdStatus = true;
			} else {
				log('this device does not have a panel capable of displaying 4k content');
			}
		} else {
			log('4k disabled');
			uhdStatus = false;
		}
		player.setUhd(uhdStatus);
	}

	/**
	 * Changes drm settings according to user's action
	 * 
	 * @param {String}
	 *            direction - 'up' or 'down'
	 */
	function switchDrm(direction) {
	    var drmParent = document.querySelector('.drms');
	    var currentDrm = drmParent.querySelector('.drmFocused');

	    currentDrm.classList.remove('drmFocused');
	    if (direction === 'up') {
	        currentDrm = currentDrm === drmParent.firstElementChild
	            ? drmParent.lastElementChild
	            : currentDrm.previousElementSibling;
	    } else if (direction === 'down') {
	        currentDrm = currentDrm === drmParent.lastElementChild
	            ? drmParent.firstElementChild
	            : currentDrm.nextElementSibling;
	    }
	    currentDrm.classList.add('drmFocused');

	    var drmKey = currentDrm.dataset.drm;
//	    var selectedDrm = drms[drmKey];
		player.setChosenDrm(drms[currentDrm.dataset.drm]);
	}

	/**
	 * Function initialising application.
	 */
	window.onload = function() {

		if (window.tizen === undefined) {
			log('This application needs to be run on Tizen device');
			return;
		}

		/**
		 * Player configuration object.
		 * 
		 * @property {Object} drms - object containing drm configurations
		 * @property {HTML Element} player - application/avplayer object
		 * @property {HTML Div Element} controls - player controls
		 * @property {HTLM Div Element} info - place to display stream info
		 * @property {Function} logger - function to use for logging within
		 *           player component
		 * 
		 */
		var config = {
			drms : drms,
			player : document.getElementById('av-player'),
			controls : document.querySelector('.video-controls'),
			info : document.getElementById('info'),
			logger : log
		};

		displayVersion();
		createDrmList();
		registerKeys();
		registerKeyHandler();

		// Check the screen width so that the AVPlay can be scaled accordingly
		tizen.systeminfo.getPropertyValue("DISPLAY", function(display) {
			log("The display width is " + display.resolutionWidth);
			config.resolutionWidth = display.resolutionWidth;

			// initialize player - loaded from videoPlayer.js
			player = new VideoPlayer(config);
			var drmList = Object.keys(drms);
		    player.setChosenDrm(drms[drmList[0]]);

			registerMouseEvents();
		}, function(error) {
			log("An error occurred " + error.message);
		});
	};
}());
