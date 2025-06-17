App = window.App || {};
App.Main = (function Main() {
    var logger = App.Logger.create({
        loggerEl: document.querySelector('.logsContainer'),
        loggerName: 'Main',
        logLevel: App.Logger.logLevels.ALL
    });

    // Manifest files with extension required by Shaka Player (.mpd)
    var playerConfig = [
        {
            manifest: 'https://drm-contents.doverunner.com/DEMO/app/big_buck_bunny/dash/stream.mpd',
            description: 'Widevine-Encryption',
            drmServers: {
                'com.widevine.alpha': 'https://license-global.pallycon.com/ri/licenseManager.do'
            },
            authData: 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ0ZXN0VXNlciIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiREVNTyIsImhhc2giOiIxb1h5aTFYRUdHRm14bE44V2orbGMxdnY1UjRmSVZSYkVycUZaVjVteEs0PSIsImNpZCI6ImRlbW8tYmJiLXNpbXBsZSIsInBvbGljeSI6IjlXcUlXa2RocHhWR0s4UFNJWWNuSnNjdnVBOXN4Z3ViTHNkK2FqdVwvYm9rQzlTMit4QVBZUmJtZno4dG9FQjM4UGRyM0JqeHZId0J1WlA2WUttY042dHlFSW16a05zQ1I2ZllkUlVvMG9ielVkdVhNdTAydjlxemZEMXdzUWlkdEJtdUZUNjNKc01KTzdDZ2xyWWMyWkRaeWt0dHRQNW1FenR5Mm9aOWdFaVVkYXFCTFE5Sm5sNlZQMko3THlZQVdJNmI1a0g3aUdBMXE4WDE2MVFcL2V5OFo1UHpqZDRhc2cwUVRJaXUwb3VuMzdGc0ZPbzFyYkZcL3FBc0IzYUlEUDdQc2FjTE5Wc2l4bGVCSEV6WjZUWEVTelVFdWtNV0l3R29TdjdCK1d1YW5vTnVIK0RVRitZalByTU5Gbjk1TlwvQ3hJeUY5enQ5UlplT0Q2VHA4UDhHaEZIRlRTSXFSWEVPSkdKMTRUYlZ6TEI3UmptM2tWaUZIRGduTjY1Nks0S3RxMGxuNktXbWRacThobGtMNUVDU21CVUNzZDh5a3lGXC92ckFnS2VnWVpranhmZ0VmT096QTZXYXFJaXl6VTh1YWxxV1RGT0hKTVArY3hLSkNcL2gyd2Y3MVVHQU9vTFpyUzRDOEcxYm51c1lqUklJVEpnZXpzeStcL0kzWXdRWmZiamhQRUZaSGRyOHNtSERydmE0cXNzVk9cL0JUckhsb1JDWTRRQnRWZzZia2g4MURleHlRVjNNZExyWVN5RXoycDlqcU9oY2tpNCtEMHRcL0VhUTNUODBkZHdJdEZCeWtKaGI5MmFFNEZJc09wU3VuNVgrNUlVRGgycTRvanI3cTFNKzNGaU1ocFZ0TWpGSm56UE5JV0NqSytkN1RHMnRKZHRhTnBoTHc3bk1cL1NJZlRUNHd4ZVUxQTk5d3E1ZE1iVWNmTGd6dWZuTkJKSFA1RnY2Z1IxbmNYWDFnVWgyQUhlVHpPUU5DYkl4SllmOCswTksrRVVJUWZVcDQ2TWFIckI4TXFSTkFsTUQrR0gzRHptMXpOUlM3bFNHSkRCS1YwZVNRY1V0eEFZV0dESXVYbDNBanRqdW81YU1wWlV3c3hGSm9CVGNFZHNUTWphY2k4MmhMOW5Jbks0RnBOMWxxQlFcL0FkVmpsRTNzdTROR1dtcms4WW1SVmtvellKaXZOYXBmSXBCVUMyb0dqZGN2SVwvVnVjR0xydlhLTThNbThrMXprZ0FFVWR0RGVLR3dpdk1vV1NDZHh4NUhRZW83N3lLMjNOUk9zZ3RjRjN3YjNJbDVsTCtwXC9ENGhiSHh4XC8xaG5PZ0lBNEJtUHE2Z1NTMD0iLCJ0aW1lc3RhbXAiOiIyMDI0LTA4LTI3VDA0OjQ0OjE3WiJ9'
        }
    ];

    var currentIndex = 0;
    var skipStep = 5;

    var AutoPlayMode = {
        PLAY: 'play',
        PAUSE: 'pause'
    };

    var DRMLicenseCipherSdk = window.DrDlcSdk.DRMLicenseCipherSdk;
    var cipher = null;
    var isPrepared = false;

    var playPauseEl = document.querySelector('.playpause');
    var videoEl = document.querySelector('#video');
    var descriptionEl = document.querySelector('#description');
    var buttonsEl = document.querySelector('.buttons');
    var backgroundEl = document.querySelector('.background');

    var player;
        
    async function fetchTableAndLoad(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw "Failed to load table file: ${path}";
            }

            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (e) {
            console.error("Error during table loading:", e);
        }
    }
    
    async function prepareDRMLicenseCipherSdk() {
    		if (isPrepared) {
    			return;
    		}
    	
	    	if (cipher === null) {
			cipher = new DRMLicenseCipherSdk();
		}
			
		const table = await fetchTableAndLoad("assets/plc-kt-DEMO.bin");
		isPrepared = await cipher.prepare("DEMO", table);
	    if (!isPrepared) {
	        console.error('DRMLicenseCipher preparation failed');
	        return;
	    }
    }

    async function initApp() {
//    		await loadWasmModule();
        if (window.shaka && window.shaka.Player.isBrowserSupported()) {
        		await prepareDRMLicenseCipherSdk();
            initPlayer();
        } else {
            logger.error('Shaka player is not supported or not found on the device');
        }
    }

    function initPlayer() {
        player = new window.shaka.Player(videoEl);
        player.addEventListener('error', onErrorEvent);

        const currentConfig = playerConfig[currentIndex];

        player.configure({
            drm: {
                servers: currentConfig.drmServers || {}
            }
        });

        player.getNetworkingEngine().registerRequestFilter(async function (type, request) {
            if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                const authData = currentConfig.authData;
                if (authData) {
                    request.headers['pallycon-customdata-v2'] = authData;
                }
                
                if (cipher && request.body.byteLength > 3) {
                    const encryptedPayload = await cipher.doCipher(request.body);
                    request.body = encryptedPayload;
                }
            }
        });
      
        player.load(currentConfig.manifest).then(function () {
            logger.log('Video has been loaded');
            descriptionEl.innerText = currentConfig.description;
        }).catch(onError);

        videoEl.addEventListener('ended', onEnded);
    }

    function reloadPlayer(playMode) {
        const currentConfig = playerConfig[currentIndex];

        player.unload()
            .then(() => player.configure({ drm: { servers: currentConfig.drmServers || {} } }))
            .then(() => player.load(currentConfig.manifest))
            .then(function () {
                logger.log('Video has been reloaded');
                descriptionEl.innerText = currentConfig.description;
                if (playMode === AutoPlayMode.PLAY) {
                    videoEl.play();
                    playPauseEl.innerText = 'Pause';
                } else {
                    videoEl.pause();
                    playPauseEl.innerText = 'Play';
                }
            })
            .catch(onError);
    }

    function onEnded() {
        reloadPlayer(AutoPlayMode.PAUSE);
    }

    function onErrorEvent(event) {
        onError(event.detail);
    }

    function onError(e) {
        logger.error('Error code: ', e.code, ', Object: ', e);
    }

    async function onTogglePlayPause() {
        if (videoEl.paused || videoEl.ended) {
            playPauseEl.innerText = 'Pause';
            videoEl.play();
        } else {
            playPauseEl.innerText = 'Play';
            videoEl.pause();
        }
    }

    function onStop() {
        reloadPlayer(AutoPlayMode.PAUSE);
    }

    function onNext() {
        currentIndex = (currentIndex + 1) % playerConfig.length;
        reloadPlayer(AutoPlayMode.PLAY);
    }

    function onPrevious() {
        currentIndex = (currentIndex - 1 + playerConfig.length) % playerConfig.length;
        reloadPlayer(AutoPlayMode.PLAY);
    }

    function onFastForward() {
        videoEl.currentTime += skipStep;
        logger.log('Skipped ' + skipStep + 's');
    }

    function onRewind() {
        videoEl.currentTime -= skipStep;
        logger.log('Rewinded ' + skipStep + 's');
    }

    function onFullscreen() {
        var fullscreenClass = 'fullscreenMode';
        videoEl.classList.toggle(fullscreenClass);
        buttonsEl.classList.toggle(fullscreenClass);
        backgroundEl.classList.toggle(fullscreenClass);
    }

    function addButtonsHandlers() {
        var buttonsWithHandlers = [
            { elementSelector: '.playpause', handler: onTogglePlayPause },
            { elementSelector: '.stop', handler: onStop },
            { elementSelector: '.next', handler: onNext },
            { elementSelector: '.previous', handler: onPrevious },
            { elementSelector: '.ff', handler: onFastForward },
            { elementSelector: '.rw', handler: onRewind },
            { elementSelector: '.togglefullscreen', handler: onFullscreen }
        ];

        App.KeyHandler.addHandlersForButtons(buttonsWithHandlers);
    }

    App.Navigation.registerMenu({
        name: 'Basic',
        domEl: document.querySelector('#buttons')
    });

    window.onload = async function () {
        addButtonsHandlers();
        await initApp();
    };
}());
