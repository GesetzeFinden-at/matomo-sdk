/**
 * A Node.js wrapper for the Matomo (http://matomo.org) tracking HTTP API
 * https://github.com/matomo-org/matomo-nodejs-tracker
 *
 * @author  Frederic Hemberger, Matomo Team
 * @license MIT
 */

import { EventEmitter } from "events";
import invariant from 'tiny-invariant';

/**
 * @constructor
 * @param {Number} siteId     Id of the site you want to track
 * @param {String} trackerUrl URL of your Matomo instance
 * @param {Boolean} [noURLValidation]  Set to true if the `piwik.php` or `matomo.php` has been renamed
 */
export class MatomoTracker extends EventEmitter {
  readonly siteId: number;
  readonly trackerUrl: string;

  constructor(siteId: number | string, trackerUrl: string, noURLValidation?: boolean) {
    super();

    EventEmitter.call(this);

    invariant(siteId && (typeof siteId === 'number' || typeof siteId === 'string'), 'Matomo siteId required.');
    invariant(trackerUrl && typeof trackerUrl === 'string', 'Matomo tracker URL required, e.g. http://example.com/matomo.php');
    if (!noURLValidation) {
      invariant(trackerUrl.endsWith('matomo.php') || trackerUrl.endsWith('piwik.php'), 'A tracker URL must end with "matomo.php" or "piwik.php"');
    }

    this.siteId = Number(siteId);
    this.trackerUrl = trackerUrl;
  }


  /**
   * Low-level wrapper for the Matomo tracking API
   *
   * For a list of tracking option parameters see
   * https://developer.matomo.org/api-reference/tracking-api
   *
   * For general usage, prefer using specific methods like `trackUrl`, `trackEvent`, etc.
   *
   * @param options URL to track or options (must contain URL as well)
   */
  async track(options: MatomoTrackOptions) {
    options.idsite = this.siteId;
    options.rec = 1;

    const requestUrl = this.trackerUrl + '?' + new URLSearchParams(
      optionValuesToString(options),
    ).toString();

    try {
      const response = await fetch(requestUrl);

      if (!response.ok) {
        if (this.listeners('error').length) {
          this.emit('error', response.status);
        }
        return;
      }

      return response;
    } catch (err) {
      if (this.listeners('error').length) {
        this.emit('error', (err as Error).message);
      }
    }
  }


  /**
   * Track page views
   *
   * @param options Matomo tracking options
   */
  async trackUrl(options: MatomoSingleTrackOptions | string) {
    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    invariant(options && options.url, 'URL to be tracked must be specified.');
    return this.track(options);
  }


  /**
   * Track custom events
   *
   * Automatically sets the `ca` (custom action) flag to 1, which enables non-page-view event tracking.
   *
   * @param options Matomo tracking options
   */
  async trackEvent(options: MatomoTrackOptions) {
    invariant(options && options.e_c && options.e_a, 'Event category and action must be specified.');

    return this.track({
      ...options,
      ca: 1,
    });
  }


  /**
   * Track content impressions and interactions
   *
   * Automatically sets the `ca` (custom action) flag to 1, which enables non-page-view event tracking.
   *
   * @param options Matomo tracking options
   */
  async trackContent(options: MatomoTrackOptions) {
    invariant(options && options.c_n && options.c_p, 'Content name and piece must be specified.');

    return this.track({
      ...options,
      ca: 1,
    });
  }


  async trackBulk(eventItems: MatomoTrackOptions[]) {
    invariant(eventItems && (eventItems.length > 0), 'Events require at least one.');
    invariant(this.siteId !== undefined && this.siteId !== null, 'siteId must be specified.');

    const body = JSON.stringify({
      requests: eventItems.map(query => {
        query.idsite = this.siteId;
        query.rec = 1;
        return '?' + new URLSearchParams(
          optionValuesToString(query),
        ).toString();
      })
    });

    try {
      const response = await fetch(this.trackerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        if (this.listeners('error').length) {
          this.emit('error', response.status);
        }
        return;
      }

      return response;
    } catch (err) {
      if (this.listeners('error').length) {
        this.emit('error', (err as Error).message);
      }
    }
  }
}

interface MatomoSingleTrackOptions extends MatomoTrackOptions {
  url: string;
}


/**
 * Interface for Matomo tracking options
 */
export interface MatomoTrackOptions {
  [key: string]: number | string | undefined;

  /** Required: The ID of the website we're tracking a visit/action for */
  idsite?: number;
  /** Required for tracking, must be set to 1 */
  rec?: 1;

  // Recommended parameters
  /** The title of the action being tracked. For page tracks this is used as page title */
  action_name?: string;
  /** The full URL for the current action */
  url?: string;
  /** The unique visitor ID, must be a 16 characters hexadecimal string */
  _id?: string;
  /** Random value generated before each request to avoid caching by browser or proxy */
  rand?: string;
  /** API version to use (currently always set to 1) */
  apiv?: 1;

  // Optional User info
  /** Full HTTP Referrer URL. Used to determine how someone got to your website */
  urlref?: string;
  /** Visit scope custom variables. JSON encoded string of the custom variable array */
  _cvar?: string;
  /** Current count of visits for this visitor */
  _idvc?: string;
  /** Timestamp of the previous visit */
  _viewts?: string;
  /** Timestamp of the first visit */
  _idts?: string;
  /** Campaign name used to attribute goal conversions */
  _rcn?: string;
  /** Campaign keyword used to attribute goal conversions */
  _rck?: string;
  /** The resolution of the device the visitor is using, e.g., 1280x1024 */
  res?: string;
  /** Current hour (local time) */
  h?: number;
  /** Current minute (local time) */
  m?: number;
  /** Current second (local time) */
  s?: number;
  /** Set to 1 if visitor has Flash plugin */
  fla?: 1;
  /** Set to 1 if visitor has Java plugin */
  java?: 1;
  /** Set to 1 if visitor has Director plugin */
  dir?: 1;
  /** Set to 1 if visitor has Quicktime plugin */
  qt?: 1;
  /** Set to 1 if visitor has PDF plugin */
  pdf?: 1;
  /** Set to 1 if visitor has Windows Media plugin */
  wma?: 1;
  /** Set to 1 if visitor has Silverlight plugin */
  ag?: 1;
  /** Set to 1 if visitor's client supports cookies */
  cookie?: 1;
  /** Override for User-Agent HTTP header */
  ua?: string;
  /** Override for Accept-Language HTTP header */
  lang?: string;
  /** User ID - any non-empty unique string identifying the user */
  uid?: string;
  /** Visitor ID - must be exactly a 16 character hexadecimal string */
  cid?: string;
  /** If set to 1, forces a new visit to be created for this action */
  new_visit?: number;

  // Optional Action info
  /** Page scope custom variables. JSON encoded string of the custom variable array */
  cvar?: string;
  /** An external URL the user has opened. Used for tracking outlink clicks */
  link?: string;
  /** URL of a file the user has downloaded. Used for tracking downloads */
  download?: string;
  /** The Site Search keyword. Tracked as a Site Search request rather than a pageview */
  search?: string;
  /** Optional search category when search is specified */
  search_cat?: string;
  /** Number of search results displayed on the results page */
  search_count?: number;
  /** Six character unique ID that identifies which actions were performed on a specific page view */
  pv_id?: string;
  /** Triggers a conversion for the goal of the website with this ID */
  idgoal?: number;
  /** Monetary value generated as revenue by this goal conversion */
  revenue?: number;
  /** Generation time in milliseconds */
  gt_ms?: number;
  /** Charset of the page being tracked, if different from default utf-8 */
  cs?: string;
  /** Custom action flag. Set to 1 for non-pageview tracking requests */
  ca?: 1;

  // Optional Event Tracking info
  /** Event category. Must not be empty (e.g., Videos, Music, Games) */
  e_c?: string;
  /** Event action. Must not be empty (e.g., Play, Pause, Download) */
  e_a?: string;
  /** Event name (e.g., a Movie name, Song name, File name) */
  e_n?: string;
  /** Event value. Must be a numeric value (float or integer) */
  e_v?: string;

  // Optional Content Tracking info
  /** Name of the content (e.g., 'Ad Foo Bar') */
  c_n?: string;
  /** The actual content piece (e.g., path to image, video, audio, text) */
  c_p?: string;
  /** Target of the content (e.g., URL of a landing page) */
  c_t?: string;
  /** Name of the interaction with the content (e.g., 'click') */
  c_i?: string;

  // Optional Ecommerce info
  /** Unique string identifier for the ecommerce order */
  ec_id?: string;
  /** JSON encoded array of items in the ecommerce order */
  ec_items?: string;
  /** Subtotal of the order (excluding shipping) */
  ec_st?: number;
  /** Tax amount of the order */
  ec_tx?: number;
  /** Shipping cost of the order */
  ec_sh?: number;
  /** Discount offered */
  ec_dt?: number;
  /** Timestamp when ecommerce order was stored */
  _ects?: number;

  // Other parameters (require authentication via token_auth)
  /** 32 character authorization key used to authenticate the API request */
  token_auth?: string;
  /** Override value for the visitor IP (IPv4 or IPv6) */
  cip?: string;
  /** Override for the datetime of the request (format: 2011-04-05 00:11:42 or UNIX timestamp) */
  cdt?: string;
  /** Override value for the country (two letter lowercase country code) */
  country?: string;
  /** Override value for the region (ISO 3166-2 region code) */
  region?: string;
  /** Override value for the city (e.g., Tokyo) */
  city?: string;
  /** Override value for the visitor's latitude (e.g., 22.456) */
  lat?: string;
  /** Override value for the visitor's longitude (e.g., 22.456) */
  long?: string;

  // Optional Media Analytics parameters
  /** Media ID */
  ma_id?: string;
  /** Media title */
  ma_ti?: string;
  /** Media resource URL */
  ma_re?: string;
  /** Media type: "video" or "audio" */
  ma_mt?: "video" | "audio";
  /** Media player name */
  ma_pn?: string;
  /** Media session number */
  ma_sn?: number;
  /** Media length/duration in seconds */
  ma_le?: number;
  /** Media position in seconds */
  ma_ps?: number;
  /** Time to play - how long until media started playing */
  ma_ttp?: number;
  /** Media player width */
  ma_w?: number;
  /** Media player height */
  ma_h?: number;
  /** Fullscreen flag (1 for fullscreen, 0 otherwise) */
  ma_fs?: 1 | 0;
  /** Media segment */
  ma_se?: string;

  // Optional Queued Tracking parameters
  /** Set to 0 to bypass queued tracking and execute request directly */
  queuedtracking?: 0;

  // Other parameters
  /** If set to 0, Matomo responds with HTTP 204 instead of GIF image */
  send_image?: 0;
  /** If set to 1, tracks a heartbeat instead of new activity (updates visit duration) */
  ping?: 1;
  /** If set to 1, enables tracking of bot requests */
  bots?: 1;
}

function optionValuesToString(options: MatomoTrackOptions) {
  return Object.entries(options).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);
}
