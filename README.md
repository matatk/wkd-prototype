Well-known destinations - demo browser extension
================================================

A prototype/testbed browser extension that follows the WAI-Adapt 'Well-known destinations' proposal.

**This is a demo extension for developer use only - it is not an assistive technology, and it is not suitable for users. Please read the warning and note below.**

The Well-known destinations proposal is in the very early stages of development - check back here for updates.

**Note:** At the time of writing, no sites support this spec (it is in the early stages of development), so it's recommended to only use the extension with the test site provided in this repo.

![Screengrab of the extension pop-up, showing the 6 well-known destinations that the example 'shopping' site supports](docs/screengrab.png)

Trying out the extension and test site
--------------------------------------

### You will need

* NodeJS and NPM already installed.

* [Zola](https://www.getzola.org/) installed, to generate the demo site. We are looking at Node-based alternatives that may be easier for you to install.

### First-time set-up

* Check out this repo

* `npm install` - to install required packages

* `npm run build` - to transpile the code, and bundle required files.

You can use `npm test` at any time _after running an initial build_ to run ESLint, StyleLint, and the TypeScript checker. The reason this needs to be after running a build is that the build process generates a list of known elements (and their IDs) in the UI HTML.

### Launching the demo site

* `npm start` - the site will be served on `localhost:3000`

### Launching the extension in a test profile

This will open the extension in a new profile, and open the demo site, which provides some well-known destinations.

As described above, extension data when the browser is closed.

**Note:** You will need to pin the extension's icon to the browser's toolbar each time (the profile is created anew each time you run the extension this way).

* `npm run ext:chrome` - launch in Chromium

* `npm run ext:firefox` - launch in Firefox

Sideloading
-----------

You can build and then sideload the extension into your existing browser profile - but for the reasons noted above, this is not yet recommended.

For more information
--------------------

More details will be added here as the spec proposal is developed.
