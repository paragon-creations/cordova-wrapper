var remoteBundlesList = {};
var localBundlesList = populateLocalBundles();
var injectedBundleIndex = 0;
var updateBundles = true;
var appAlreadyLoaded = false;

console.log('Config: ', config);

// A function that attempts to include the css and js files from the host and then init the application.
function appLaunch(host, bundles) {
    if (!host || !bundles) return;
    host = host.replace(/\/$/, '') + '/';
    bundles = bundles.replace(/^\//, '');
    
    // Run a timeout timer until application is started; if not started in time, prompt the user to either wait some more or force a reload.
    appLaunch_timer_set();
    
    // Include the bundle and init the app if successful.
    try {
        $.get(host + bundles, {'_':$.now()}).done(function(data) {
            remoteBundlesList = data;
            console.log('remoteBundlesList:', remoteBundlesList);
            
            if (remoteBundlesList.version != localBundlesList.version) {
                // Need to update local version
                console.log('Loading and updating bundles from the Cloud.');
                updateBundles = true;
            } else {
                // Getting the bundles from the local file system
                console.log('Loading bundles from the local file system.');
                updateBundles = false;
                
                // Clear the timeout timer
                clearTimeout(appLaunch_timer);
            }
            
            // Start injecting the bundles
            injectBundles();
            
        }).fail(function() {
            // Fail
            console.log('Failed $.get bundles.json');
            appLaunch_timeout();
        });
    } catch (error) {
        console.log('Caught error downloading bundles.json');
        appLaunch_timeout();
    }
}

function populateLocalBundles() {
    var localBundlesList = {};
    localBundlesList = {
        bundles:[]
    };
    var localBundlesListString = window.localStorage.getItem('localBundlesList');
    // Checking validity of the local bundles
    if (/version/.test(localBundlesListString)) {
        localBundlesList = JSON.parse(localBundlesListString);
        if (localBundlesList && (!localBundlesList.bundles || (localBundlesList.bundles && localBundlesList.bundles.length == 0))) {
            // If no bundles exist - reject the local bundles
            localBundlesList.version = false;
            localBundlesList.bundles = [];
            window.localStorage.setItem('localBundlesList', '');
        }
    }
    console.log('localBundlesList:', localBundlesList);
    return localBundlesList;
}

// Store Bundle
function storeBundle(bundleURL, bundleData, index) {
    var bundleName = getBundlePath(bundleURL, 'returnLocalFilesOnly');
    if (bundleName) {
        // We store only bundles that have a proper name (no URLs).
        createPersistentBundle(bundleName, bundleURL, bundleData, index);
    } else {
        // If the bundle is a URL without a strict file name - we assume it should always be fetched from the cloud.
        // So we keep it in the list - but we'll detect that it doesn't exist in the file system, and load it remotely.
        // [ ! ] Important Note
        // The order in which we load the bundles is important - so we must use the INDEX to keep the exact same order like in the remote bundles list.
        localBundlesList.bundles[index] = bundleURL;
        injectBundle(bundleURL);
    }
}

// Create Persistent Bundle Locally
function createPersistentBundle(bundleName, bundleURL, bundleData, index) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
        fs.root.getFile(bundleName, { create: true, exclusive: false }, function (fileEntry) {
            writeFile(fileEntry, bundleURL, bundleData);
            // Storing the path in the local bundles list
            // [ ! ] Important Note
            // The order in which we load the bundles is important - so we must use the INDEX to keep the exact same order like in the remote bundles list.
            localBundlesList.bundles[index] = fileEntry.nativeURL; //fileEntry.toInternalURL();
            
            if (index == (remoteBundlesList.bundles.length - 1)) {
                updateLocalBundlesListAndClearTimer();
            }
            
        }, onErrorCreateFile);
    }, onErrorLoadFs);
}
function onErrorCreateFile(error) {
    console.log('onErrorCreateFile: ', error);
}
function onErrorLoadFs(error) {
    console.log('onErrorLoadFs: ', error);
}

// Write File
function writeFile(fileEntry, bundleURL, dataObj) {
    fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function() {
            // Successfull file write
            console.log('Successful write of file: ', fileEntry, fileEntry.toInternalURL());
            // Debug - verify we can read the file from the File System:
            //readFile(fileEntry);
            
            injectBundle(fileEntry.nativeURL);
        };
        fileWriter.onerror = function (error) {
            console.log('Failed to write file: ', error, fileEntry);
        };
        fileWriter.write(dataObj);
    });
}

// Read File
function readFile(fileEntry) {
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function() {
            console.log('Successful file read: ', fileEntry.fullPath);
        };
        console.log('Read File: ', fileEntry.fullPath, file);
        reader.readAsText(file);
    }, onErrorReadFile);
}
function onErrorReadFile(error) {
    console.log('onErrorReadFile: ', error);
}

// Inject Bundles (Recursive)
function injectBundles() {
    if (remoteBundlesList && remoteBundlesList.bundles && remoteBundlesList.bundles[injectedBundleIndex]) {
        var bundleURL = remoteBundlesList.bundles[injectedBundleIndex];
        if (updateBundles) {
            $.get(bundleURL, {'_':$.now()}, function(bundleData) {
                storeBundle(bundleURL, bundleData, injectedBundleIndex);
                // [ ! ] Important Note:
                // The injectBundle is executing only after a successful write of the file.
                // This is MANDATORY since it if we try to write files in parallel - it fails!
            }, 'text');
        } else {
            injectBundle(localBundlesList.bundles[injectedBundleIndex], bundleURL);
        }
    } else {
    	// Automatically hiding the splash screen (per configuration)
		if (parseInt(config.auto_hide_spalsh_in_seconds) > 0 && document.querySelector('#splash')) {
			setTimeout(function() {
				document.querySelector('#splash').remove();
			}, parseInt(config.auto_hide_spalsh_in_seconds)*1000);
		}
	}
}

// Inject a specific bundle into the DOM
function injectBundle(bundlePath, bundleURLFallback) {
    if (/.+\.js$/.test(bundlePath)) {
        // Javascript files go into the <body>, below the <app-root>
        $.getScript(bundlePath).done(function() {
            // Script loaded successfully
            //console.log('Injection successful: ',bundlePath);
            // Move on to the next bundle
            injectedBundleIndex = injectedBundleIndex + 1;
            injectBundles();
        }).fail(function() {
            // Script not found - fallback to remote
            console.log('injectBundle - local script not found:', bundlePath);
            console.log('injectBundle - loading JS from fallback URL:', bundleURLFallback);
            $.getScript(bundleURLFallback).done(function() {
                // Move on to the next bundle
                injectedBundleIndex = injectedBundleIndex + 1;
                injectBundles();
            });
        });
        
        // Cannot be used too... (doesn't work)
        //$('body').append('<script type="text/javascript" src="'+bundlePath+'"><\/script>');
        
    } else {
        // Everything else is assumed to be CSS and goes into the <head>
        // So we use $.get (instead of $.getScript) to simply check if it exists
        $.get(bundlePath).done(function() {
            // Script loaded successfully
            $('head').append('<link href="'+bundlePath+'" rel="stylesheet" />');
            // Move on to the next bundle
            injectedBundleIndex = injectedBundleIndex + 1;
            injectBundles();
        }).fail(function() {
            // Script not found - fallback to remote
            console.log('injectBundle - local CSS not found:', bundlePath);
            console.log('injectBundle - loading CSS from fallback URL:', bundleURLFallback);
            $('head').append('<link href="'+bundleURLFallback+'" rel="stylesheet" />');
            // Move on to the next bundle
            injectedBundleIndex = injectedBundleIndex + 1;
            injectBundles();
        });
    }
}

// Once everything is stored - we update the version and clear the app-launch timer
function updateLocalBundlesListAndClearTimer() {
    // Updating the local list version
    localBundlesList.version = remoteBundlesList.version;
    // Storing the list locally
    window.localStorage.setItem('localBundlesList', JSON.stringify(localBundlesList));
    // Clear the timeout timer
    clearTimeout(appLaunch_timer);
    // Automatically hiding the splash screen (per configuration)
    if (parseInt(config.auto_hide_spalsh_in_seconds) > 0 && document.querySelector('#splash')) {
        setTimeout(function() {
            document.querySelector('#splash').remove();
        }, parseInt(config.auto_hide_spalsh_in_seconds)*1000);
    }
}

// Determine the bundle path (local or remote)
function getBundlePath(bundleURL, returnLocalFilesOnly) {
    var matches = bundleURL.match(/.+(\/.+\.[a-zA-Z0-9]+)$/);
    if (matches && matches[1]) {
        return matches[1];
    } else if (!returnLocalFilesOnly) {
        return bundleURL;
    }
}

function appLaunch_timer_set() {
    if (appAlreadyLoaded) return; // If the Application has already been loaded successfully - we prevent the timer from being reset.
    appLaunch_timer = setTimeout(appLaunch_timeout, parseInt(config.bundles_timeout_in_seconds) >= 0 ? parseInt(config.bundles_timeout_in_seconds)*1000 : 15000);
}

// A recursive function that prompts the user to wait some more, refresh the page, or specify a new application host.
function appLaunch_timeout() {
    clearTimeout(appLaunch_timer);
    if (navigator && navigator.notification) {
        navigator.notification.confirm(
            'Hmmm...'+"\n"+'Please check your Internet connection.',
            function (buttonIndex) {
                if (buttonIndex == 1) {
                    appLaunch_timer_set();
                } else if (buttonIndex == 2) {
                    // Clearing the local storage
                    window.localStorage.setItem('localBundlesList', '');
                    // Reloading
                    location.reload();
                }
            },
            'Error',
            'Wait,Retry'
        );
    }
}

// Called when Cordova (local) has been initiated.
document.addEventListener('deviceready', function() {
    // Adding support for cookies (due to a WebKit bug in iOS with WKWebView and cookies handling) 
    // https://github.com/CWBudde/cordova-plugin-wkwebview-inject-cookie
    if (config.api_url && window['wkWebView']) wkWebView.injectCookie(config.api_url.replace(/https?:\/\//, '').replace(/\/$/, '') + '/');
    
    $('body').append('\
        <div id="splash">\
            '+(config.splash_logo_image_path ? '<img id="logo" src="'+(config.splash_logo_image_path)+'">' : '')+'\
            <div class="loader">\
                <svg class="circular" viewBox="25 25 50 50">\
                    <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10" />\
                </svg>\
            </div>\
        </div>\
    ');
    
    if (config.html_app_container) {
        $('body').append(config.html_app_container);
    }
    
    appLaunch(config.app_url, config.bundles_path);
}, false);