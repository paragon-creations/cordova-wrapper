# Cordova Wrapper
This tiny framework allows you to create a Cordova project as an "encapsulation wrapper" which allows to easily inject your App (frontend bundles) from a remote server.
You may freely fork this Repo and update it per your needs.

This way, updates to the frontend source-code (which do not require a new Cordova plugin) can be "injected" into the Cordova wrapper by simply deploying the updated bundles of the app on the remote server.

Your server will need to host the bundled frontend app, and a bundles.json file will tell the Cordova Wrapper which files to download.

## Example bundles.json file
http://pnc.co.il/cordovac-wrapper/bundles.json
```
{
    "version": "1.0",
    "last_update":"2018-07-22 18:16",
    "bundles":[
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://fonts.googleapis.com/css?family=Rubik:400,500,700",
        "https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/styles.bundle.css",
        "https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/inline.bundle.js",
        "https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/polyfills.bundle.js",
        "https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/main.bundle.js"
    ]
}
```

## Step by Step

1. Fork and then clone this repo to your local environment.
2. Edit the www/js/config.js file per your needs (see below for more details)
3. Edit the www/css/index.css to style your Splash screen.
4. Choose a background Splash image to match your Splash screen styling, and replace the existing img/logo.png file as well as the splash background image - res/screen/Default@2x~universal~anyany.png.
5. Replace the app icons under the res/icon folder (you many need to edit the config.xml with the relevant icons per your needs: https://cordova.apache.org/docs/en/latest/config_ref/images.html)
6. Build and Run your Cordova app:
   * Run `cordova platform add ios` (or any platform that you require)
   * Run `cordova build ios` (or any platform that you require)
   * **Note:** you will need to code-sign your application - please refer to Cordova documentation for more details (Refer to the "Getting Started with Cordovca CLI" section below for more details).
   * Run on your connected device `cordova run ios --device`

## How do I know which bundles I need?
Your App needs to be deployed as a website on a remote server, and ready for production (a.k.a bundled).
Take a look at the index.html file in the distribution folder of your app.
The bundles that appear there (in the <head> and <body>) should be included in the bundles.json.

## How it works?
The js/index.js of the Cordova Wrapper tries to fetch the above bundles.json from the remote API server.
If the bundles.json is not available - after 15 seconds (configurable) a timeout alert will appear.
If the bundles.json is available - the Cordovca Wrapper will start downloading the relevant files.
Any files which ends with .css or .js will be downloaded.
Bundles which have no extension (e.g. external fonts from Google) will be embedded into the <head> tag and will not be downloaded.
The bundles that have been successfully downloaded, will be stored in the App device storage (using cordova-plugin-file).
Everytime the app is started - the Cordova Wrapper checks the version number against the bundles.json on the server.
If the version has not changed - it will simply use the bundles which are stored locally on the device storage.
However, if the version has changed - it will download the new bundles, store them, and launch the App using the updated version.

## Configuration (config.js)
You should edit the www/js/config.js parameters per your needs.

#### api_url
Defines the API endpoint of your application backend.

#### app_url
Defines the frontend endpoint of your application (from which the app bundles will be downloaded and injected into Cordova).
This is where the cordovca-wrapper will look for the bundles.json (per the bundles_path below).

#### bundles_path
Defines the relative path of the bundles.json location (relative to the app_url)

#### bundles_timeout_in_seconds
Defines how long the Cordova Wrapper will wait for the bundles.json to load before displaying the "timeout" alert.

#### auto_hide_spalsh_in_seconds
Defines when the Cordova Wrapper will automatically hide it's Splash screen (see the "Styling the Splash Screen" section below for more details).

#### splash_logo_image_path
Defines the relative path (under the Cordovca Wrapper www/ folder) of where the logo image of the Splash screen is located.

#### html_app_container
Defines the HTML tag that should exist in the <body> for your App to bootstrap into.
For Angular (2+) you should be using <app-root></app-root>.
But for AngularJS, Vue.js or other frontend frameworks you should be using whatever your application requires.
You should look into your index.html and see what it requires.

### Example config.js file
```var config = {
    'api_url':'https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/',
    'app_url':'https://secure.pnc.co.il/pnc.co.il/dev/cordova-wrapper-example-app/dist/',
    'bundles_path':'assets/config/bundles.json',
    'bundles_timeout_in_seconds':15,
    'auto_hide_spalsh_in_seconds':10,
    'splash_logo_image_path':'img/logo.png',
    'html_app_container':'<app-root></app-root>'
}
```

## Styling the Splash Screen
You should first update the app icons and app splash screen native images.
The can be found under the res/ folder.
We recommend to use a solid background image for the splash screen, so that a matching background can be used by the CSS of the Cordova Wrapper.

Once the Cordova Wrapper is initiated, the native Splash image is replaced by the HTML Splash styling as defined in the ww/css/index.css.
You may edit it per your required styling.
The logo image can be found in www/img/logo.png and should be defined in the www/js/config.js file by the 'splash_logo_image_path' property.

The App icons should be defined in the config.xml per your needs.
In this GitHub branch we included the original Cordova icons (can be found under /res/icon) and therefore there is no icon(s) definition in the config.xml of this example repository.

### Hiding the Splash Screen when the App is ready
The Cordova Wrapper has a config option: auto_high_splash_in_seconds which automatically hides the Splash to reveal the application itself.
However, the preferred option is that you hide the splash-screen from within your App, when it has finished bootstrapping.

#### For Angular (angular.io v4+), you may follows these instructions:
In the `main.ts` replace the Angular bootstrap() with the following:

```
if (typeof window['cordova'] !== 'undefined') {
    document.addEventListener('deviceready', () => {
        bootstrap();
        // Hiding the Splash Screen
        document.querySelector('#splash').classList.add('transition');
        setTimeout(function() {
            document.querySelector('#splash').remove();
        }, 500);
    }, false);
} else {
    bootstrap();
}
```

### Applying a 'cordova' class when running as a Cordova App
If you wish to apply specific CSS rules when your App is running in Cordova - you may apply a 'cordova' class to your app component by following these instructions (for Angular):

In the `app.component.ts` - apply a class ".cordova" IF Cordova is detected.
```
host: {
    '[class.cordova]':'cordova'
}
```

In the `ngOnInit()` add:
```
ngOnInit() {
    ...
    this.cordova = window['cordova'];
    if (typeof window['cordova'] !== 'undefined') {
        console.log('Cordova exists');
    } else {
        console.log('Cordova does NOT exist');
    }
}
```

# Useful Information about Cordova in general

## Getting Started with Cordovca CLI
https://cordova.apache.org/docs/en/latest/guide/cli/

## Setting up a new app
cordova create hello com.example.hello HelloWorld

## Cordova Config.xml
https://cordova.apache.org/docs/en/latest/config_ref/index.html

## Important settings
Import setting for allowing outbound navigation:
```html
<allow-navigation href="*://*/*" />
```
Important Cordova config.xml settings for iOS:
```html
<preference name="DisallowOverscroll" value="true" />
<preference name="Fullscreen" value="true" />
<preference name="EnableViewportScale" value="false" />
<preference name="AllowInlineMediaPlayback" value="true"/>
```

In the index.html - must have the following meta tag, with viewport-fit=cover for iPhone-X to work properly and cover the whole screen:
```html
<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, viewport-fit=cover">
```

**[ ! ] Important Note**
You must NEVER use 'height=device-height' in the Viewport tag, as it causes severe issues when the keyboard it opened (and when it closes) - the touch coordinates in iOS become corrupted.
Therefore - only 'width=device-width' should be used.

## Mandatory plugins
(cd into the relevant app directory first)

### Splash Screen Plugin
https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-splashscreen/
```
cordova plugin add cordova-plugin-splashscreen
```

[ ! ] Important: The splash screen image MUST be named `Default@2x~universal~anyany.png` for it to work properly on iPhone-X and make the borders (top and bottom) go away.

### Whitelist Plugin
https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-whitelist/
(This plugin comes built-in with Cordova Core)

### Dialogs Plugin
https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-dialogs/
```
cordova plugin add cordova-plugin-dialogs
```

### File Plugin
https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/
```
cordova plugin add cordova-plugin-file --save
```

### WKWebView (with localhost webserver)
Apache Cordova WKWebView Engine Plugin:
https://github.com/apache/cordova-plugin-wkwebview-engine
```
cordova plugin add cordova-plugin-wkwebview-engine --save
```

Note:
this plugin has many known issues, but it's by far the preferred option over the old UIWEbView.

WKWebView Cordova Issue tracker:
https://issues.apache.org/jira/browse/CB-12074?jql=project%20%3D%20CB%20AND%20labels%20%3D%20wkwebview-known-issues

**Since WKWebView prevents using cdvfile:// and file:// we must use a local webserver.**
We wanted to use "Apache Cordova Local Web Server":
https://github.com/apache/cordova-plugins/blob/local-webserver/README.md

However, that plugin is no longer registered in NPM.
So we're using the mirror plugin "spark-local-webserver" instead:
https://www.npmjs.com/package/spark-local-webserver
```
cordova plugin add spark-local-webserver --save
```

Must read to understand why we must use a local webserver in iOS:
https://ionicframework.com/docs/wkwebview/
https://docs.google.com/document/d/19VQ-n7hGr9IDPPstQqU8_8WgqUh7R6sgQfL2neoT-Xw/edit

### InAppBrowser (with WKWebView)
https://github.com/dpa99c/cordova-plugin-inappbrowser-wkwebview
```
cordova plugin add cordova-plugin-inappbrowser-wkwebview
```

### Tips for a Native look-and-feel inside a Progressive Web Cordova App

## The 300ms click-delay issue
https://developer.telerik.com/featured/300-ms-click-delay-ios-8/

Bottom line:
**No need for libraries such as fastclick.js - simply use WKWebView instead**
- In Android - the 300ms doesn't exist, if the viewport is set to width=device-width.
- In iOS - Using WKWebView ONLY - the 300ms is gone (there is a 125ms delay only, to distinguish between a "fast tap" and a regular one).

## Limitations of Cordova that we need to comply with
Disable the html5mode / Pretty URL (routing must use on the hash #)
In the app-routing.module.ts:
```
@NgModule({
    imports: [ RouterModule.forRoot(routes, { useHash: true }) ],
    exports: [ RouterModule ]
})
```

All links to resources (e.g. static images, icons) - whatever is not found locally inside the Cordova app itself - must have an absolute path URL.
I've used a `host` parameter, that is part of the app configuration, and I pass all relevant paths through a service to join the `host` parameter and get an absolute path.
Example can be found in `app.service.ts > base()` (line 88).

## Prevent "bounce" / "Elastic Page" Effect
Let your <html> tag have width of 100vw and height of 100vh.
Let your <body> tag have a width of 100% and height of 100%.
Let the <app-root> (or any other "root container") have the following styling:
```
position:absolute;top:0;left:0;width:100vw;height:100vh;overflow:hidden;
```
In addition, make sure you have the following preference in the config.xml for Cordova:
```
<preference name="DisallowOverscroll" value="true" />
```

If you have a floating toolbar as the header - make sure you give it an `absolute` position too (otherwise it might cause weird behaviour on various devices / platforms).

**[ ! ] Important Note**
Do not use position:fixed, as it causes rendering issues on iOS, especially with WKWebView.

## Native-like Scrolling
Wherever you need scrolling inside the App - give the relevant container the following styling:
```
overflow:auto;-webkit-overflow-scrolling:touch;
```
Note: the `webkit-overflow-scrolling` gives it the "deceleration effect".

## iPhone-X Notch and Safe Areas
Use the following CSS variables to make sure the contents don't overlap the toolbar or the bottom part of the app:
https://css-tricks.com/the-notch-and-css/

Mixing example for a toolbar:
```
@mixin loyalty-toolbar {
    position:fixed;z-index:2;top:0;left:0;right:0;
    box-shadow:0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12);
    
    .cordova :host & {padding-top: env(safe-area-inset-top)};
}
```

#### [ ! ] Important Notes
- Notice the the class `.cordova` goes with `:host` afterwards - otherwise the Mixin won't be propagated down into the relevant component.
- Give the <body> and <html> a width and height of 100vw and 100vh so they will cover the whole screen.

## Inline Videos
In order to play inline videos ("background" videos) - make sure you have the following prefence in the config.xml:
```
<preference name="AllowInlineMediaPlayback" value="true"/>
```
In addition, make sure you have all the following <video> attributes:
```
<video playsinline="playsinline" webkit-playsinline autoplay="autoplay" muted="muted" loop="loop">
    <source src="https://media.istockphoto.com/videos/chef-flambaying-vegetables-video-id482924952" type="video/mp4">
</video>
```

## Animations
Refer to the Angular.io animations documentation: https://angular.io/guide/animations
An example for animations can be found in `dashboard.component.html` and `dashboard.component.ts`.
Make sure you read about:
- `:leave` and `:enter`
- animateChild()

Note:
To apply an animation to the component itself - use the `host` property:
```
host: {
    '[@parentAnimation]': ''
},
```
Example can be found in `dashboard.component.ts`.

## Running Cordova against "ng serve" (for development on localhost)

It's possible to inject the bundles generated by ng-serve, but the live-reload will need to be disabled, and the AOT flag will have to be used as well:
```
ng serve --aot --live-reload=false --port 5200
```

## Using Cookies with wkWebView
Adding support for cookies (due to a WebKit bug in iOS with WKWebView and cookies handling) can be done with this plugin:
https://github.com/CWBudde/cordova-plugin-wkwebview-inject-cookie
```
cordova plugin add cordova-plugin-wkwebview-cookie-sync
```
Usage:
```
if (config.api_url) wkWebView.injectCookie(config.api_url.replace(/https?:\/\//, '').replace(/\/$/, '') + '/');
```

## Working with NeDB (IndexedDB in particular)
It seems that WKWebView has issues using IndexedDB.
So need to avoid it, and use either localStorage or WebSQL instead.
For NeDB specifically, we need to set the memoryOnly flag to TRUE.
