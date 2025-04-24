# Unofficial Matomo SDK

> JavaScript wrapper for the Matomo HTTP API

- Lightweight
- TypeScript-ready with JSDoc annotations
- Promise-based design

## Usage

First, install `matomo-sdk` as a dependency:

```sh
npm install @gesetzefinden-at/matomo-sdk
```

Then, use it in your project:

```ts
import { MatomoTracker } from '@gesetzefinden-at/matomo-sdk'

// Initialize with your site ID and Matomo URL
const matomo = new MatomoTracker(1, 'http://mywebsite.com/matomo.php');

// Optional: Respond to tracking errors
matomo.on('error', function(err) {
  console.log('error tracking request: ', err);
});

// Track a request URL:
// Either as a simple string …
await matomo.track('http://example.com/track/this/url');

// … or provide further options:
await matomo.track({
  url: 'http://example.com/track/this/url',
  action_name: 'This will be shown in your dashboard',
  ua: 'Node.js v0.10.24',
  cvar: JSON.stringify({
    '1': ['custom variable name', 'custom variable value']
  })
});

// … or trackBulk:
const events = [{
  '_id': 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
  'cdt': '2018-03-22T02:32:22.867Z',
  'e_c': 'Buy',
  'e_a': 'rightButton',
  'e_v': '2'
},{
  '_id': 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
  'cdt': '2018-03-22T02:33:52.962Z',
  'e_c': 'Buy',
  'e_a': 'leftButton',
  'e_v': '4'
}];
matomo.trackBulk(events).then((resData) => {
  // done.
})
```

That's it. For a complete list of options, see [Matomo's Tracking HTTP API Reference](https://developer.matomo.org/api-reference/tracking-api).

## Advanced usage

If you renamed the tracking file `piwik.php` or `matomo.php` of your matomo instance, the following error will be thrown:

```ts
new MatomoTracker(1, 'http://matomo.my-site.com/my-file.php'))
// ERROR: A tracker URL must end with "matomo.php" or "piwik.php"
```

To skip this check, simply pass `true` as third argument to the constructor:

```ts
new MatomoTracker(1, 'http://matomo.my-site.com/my-file.php', true))
// OK
```

## Differences to the official `matomo-nodejs-tracker`

The original `matomo-nodejs-tracker` seems to be no longer maintained. As of April 2025, there's multiple important PRs open, the TypeScript port is unfinished and the last stable release is from August 2020.

Our unofficial Matomo SDK is based on `matomo-nodejs-tracker`, but does some house-cleaning and general modernizations:
- Merge the TypeScript branch as well as the open PRs with important fixes
- Remove third-party packages with standard built-ins where possible
- Update the testing infrastructure (replace mocha and its helper libs with vitest)
- Improve bundling (switch to tsup instead of using tsc directly)
- General maintainance (update packages, linter and various configs)
- Remove dependencies on NodeJS APIs where possible, which makes it possible to run both on the client and a server

The port keeps the general API the same, with the addition of detailed JSDoc strings for the tracking options. The previous callback-based design was also replaced by a modern Promise-based solution. `track()` can either be `await`ed directly, or handled as a callback via `then()`:

```ts
const tracker = new MatomoTracker(1, 'http://matomo.my-site.com/my-file.php)

await tracker.track('http://example.com/track/this/url')
// OR
tracker.track('http://example.com/track/this/url').then(() => {
  // tracking done
})
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
