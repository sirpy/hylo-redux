# hylo-redux

Experimental version of the Hylo.com frontend, written with React and Redux.

## Goals

* universal rendering
  * reduce client-side effort and wait time when loading the site for the first time, as in the common case of responding to an email or push notification
  * support Facebook sharing with Open Graph meta tags more easily

* client-side caching
  * more responsiveness and less network activity

* better management of complexity
  * as always: less coupling, more adaptability

## Development

Use node ^6.2.2.

For local development, create a file named `.env` in the project root. Values in square brackets are team-specific and should be supplied:

```shell
FEATURE_FLAG_DIRECT_MESSAGES=on
FEATURE_FLAG_GENERATE_TOKEN=on
FEATURE_FLAG_COMMUNITY_SETUP_CHECKLIST=on
FEATURE_FLAG_PAYMENT_SETTINGS=on
FEATURE_FLAG_REQUEST_TO_JOIN_COMMUNITY=on
FEATURE_FLAG_CONTRIBUTORS=on
FEATURE_FLAG_IN_FEED_PROFILE_COMPLETION_MODULES=on
FEATURE_FLAG_IN_FEED_ENGAGEMENT_MODULES=on
FEATURE_FLAG_COMMENT_IMAGES=on
ASSET_HOST=[ host URL ]
PROXY_HOST=[ host URL ]
UPSTREAM_HOST=http://localhost:3001
SOCKET_HOST=http://localhost:3001
HOST=http://localhost:3001
AWS_S3_BUCKET=[ bucket name ] 
AWS_S3_HOST=[ host URL ]
BUNDLE_VERSION=[ version ]
FILEPICKER_API_KEY=[ key ]
GOOGLE_BROWSER_KEY=[ key ]
GOOGLE_CLIENT_ID=[ client id ]
LIVERELOAD=true
LOG_LEVEL=debug
PORT=9000
SEGMENT_KEY=[ key ]
```

Then it's just the usual: `npm install`, `npm start`, `npm test`. After you start it, you may need to trigger a LESS build with `touch css/index.less`.

It depends on a running instance of [hylo-node](https://github.com/Hylozoic/hylo-node), the location of which is set with `UPSTREAM_HOST`. You may notice a foreign key constraint error when first creating a community: a reload of the index page shows that the community is created regardless.

## Testing

Create a file named `.env.test` with similar contents as `.env` above:
```
ASSET_HOST=http://test-asset-host
ASSET_PATH=test-assets
DIST_PATH=dist-test
NODE_ENV=test
LOG_LEVEL=warn # change to "info" to get a lot more console output
UPSTREAM_HOST=http://test.host
```

Run all the tests with `npm test`; run only the server-side tests with `npm run test-server`; run only the client-side tests (which use jsdom to simulate a browser) with `npm run test-client`. You can run a single test file with `npm run test-server -- filename.js`.

## Deployment

The deployment code should probably be pulled out into a separate module at some point.

Create a file named `.env.deploy` in the project root, or get the variables below into your environment otherwise:
```
HEROKU_API_TOKEN=some_token
HEROKU_APP_NAME=some_app_name
DIST_PATH=dist
```
The specified token should be one that has access to the specified app.

To deploy, first run `gulp deploy`. This will:
* Read environment variables from the Heroku app specified above (see [loadHerokuEnv.js](https://github.com/Hylozoic/hylo-redux/blob/master/tasks/loadHerokuEnv.js) for the list)
* Write a Javascript bundle to `dist/`, using the environment variables from the app
* Copy all images from `public/` to `dist/`
* Write a CSS bundle to `dist/`
* Suffix all filenames in `dist/` with hashes based on their contents using [gulp-rev](https://github.com/sindresorhus/gulp-rev)
* Upload the files to S3 (the credentials for which are also fetched from the Heroku environment)
* Set `SOURCE_VERSION` on the Heroku app to be the first 8 characters of the current commit hash (the app uses this to determine which set of uploaded assets to use)

Then run `git push heroku master` to deploy the most recent code.

## Asset management

We use `gulp-rev` to create "fingerprinted" static assets (CSS, JS, and images), so that when we upload assets to S3 during deployment, we only have to upload new files if there are changes. This improves cacheability and shortens deployment time a bit. `gulp-rev` creates a `manifest.json` file which maps filenames (e.g. `index.js`) to their fingerprinted versions (e.g. `index-5dfc4e8f97.js`).

The final path to each static asset is determined with the use of the environment variables `ASSET_HOST` and `ASSET_PATH`. See `util/assets.js`.

If you want to test asset management in development, set `ASSET_PATH` to any value (e.g `dist-dev`), leave `ASSET_HOST` blank, and `USE_ASSET_MANIFEST` to 1. You will then have to run `gulp build-dev` to regenerate fingerprinted assets and `manifest.json` after any changes.

If you want to have your development instance point to assets that were deployed to production (e.g. to test a production issue), set `ASSET_HOST`, `ASSET_PATH`, `SOURCE_VERSION`, and `USE_ASSET_MANIFEST` to match their values in production. Also set `NODE_ENV` to 'production'.

## License

    Hylo is a mobile and web application to help people do more together.
    Hylo helps communities better understand who in their community has what skills,
    and how they can create things together.
    Copyright (C) 2017, Hylozoic, Inc.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
