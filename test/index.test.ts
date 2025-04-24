import type { MockInstance } from 'vitest';
import { MatomoTracker } from '../src/index';
import nock from 'nock';

describe('MatomoTracker()', () => {
  it('should throw if no parameters provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker()).toThrow(/siteId/);
  });

  it('should throw if no siteId is provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker(null)).toThrow(/siteId/);
  });

  it('should throw if siteId provided is neither a number nor a string', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker({ foo: 'bar' })).toThrow(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker([1, 2, 3])).toThrow(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker(true)).toThrow(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker(() => true)).toThrow(/siteId/);
    expect(() => new MatomoTracker(1, 'http://example.com/matomo.php')).not.toThrow();
    expect(() => new MatomoTracker('siteId', 'http://example.com/matomo.php')).not.toThrow();
  });

  it('should throw if no trackerUrl is provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    expect(() => new MatomoTracker(1)).toThrow(/tracker/);
  });

  it('should throw if trackerUrl is not valid (no matomo.php endpoint)', () => {
    expect(() => new MatomoTracker(1, 'http://example.com/index.php')).toThrow(/tracker/);
  });

  it('should allow invalid URL if noURLValidation is set', () => {
    expect(() => new MatomoTracker(1, 'http://example.com/index.php', true)).not.toThrow(/tracker/);
  });

  it('should have properties siteId/trackerUrl', () => {
    const matomo = new MatomoTracker(1, 'http://example.com/matomo.php');
    expect(matomo.siteId).toBe(1);
    expect(matomo.trackerUrl).toBe('http://example.com/matomo.php');
  });
});

describe('#track()', () => {
  let httpMock: nock.Interceptor;
  let fetchSpy: MockInstance;
  let matomo: MatomoTracker;

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');
    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    matomo = null!;
    nock.restore();
    vi.restoreAllMocks();
  });

  it('should throw without parameter', async() => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    await expect(matomo.track()).rejects.toThrow(/URL/);
  });

  it('should accept a url as string', async() => {
    httpMock.reply(200);
    await matomo.track('http://mywebsite.com/');
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });

  it('should accept a parameter object', async() => {
    httpMock.reply(200);
    await matomo.track({ url: 'http://mywebsite.com/' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });

  it('should throw without options.url', async() => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    await expect(matomo.track({})).rejects.toThrow(/URL/);
  });

  it('should emit an error if HTTP response status is not 200/30x', async() => {
    httpMock.reply(404);

    const errorPromise = new Promise((resolve) => {
      matomo.on('error', (param: string) => {
        console.log(param);
        expect(String(param)).toMatch(/^(404|getaddrinfo ENOTFOUND)/);
        resolve(undefined);
      });
    });

    await matomo.track({ url: 'http://mywebsite.com/' });
    await errorPromise;
  });
});

describe('#track() - HTTPS support', () => {
  let httpsMock: nock.Interceptor;
  let fetchSpy: MockInstance;
  let matomo: MatomoTracker;

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'https://example.com/matomo.php');

    httpsMock = nock('https://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    matomo = null!;
    nock.restore();
    vi.restoreAllMocks();
  });

  it('should use HTTPS to access Matomo, when stated in the URL', async() => {
    httpsMock.reply(200);
    await matomo.track('http://mywebsite.com/');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });
});

describe('#bulkTrack()', () => {
  let httpMock: nock.Interceptor;
  let fetchSpy: MockInstance;
  let matomo: MatomoTracker;

  const events = [
    {
      _id: 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
      cdt: '2018-03-22T02:32:22.867Z',
      e_c: 'Buy',
      e_a: 'rightButton',
      e_v: '2',
    },
  ];

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    matomo = null!;
    nock.restore();
    vi.restoreAllMocks();
  });

  it('should throw without parameter', async() => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    await expect(matomo.trackBulk()).rejects.toThrow();
  });

  it('should POST to server', async() => {
    httpMock.reply(200);
    await matomo.trackBulk(events);
    expect(fetchSpy).toHaveBeenCalled();
  });
});

describe('#bulkTrack() - HTTPS support', () => {
  let httpsMock: nock.Interceptor;
  let fetchSpy: MockInstance;
  let matomo: MatomoTracker;

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'https://127.0.0.1/matomo.php');

    httpsMock = nock('https://127.0.0.1')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    matomo = null!;
    nock.restore();
    vi.restoreAllMocks();
  });

  it('should use HTTPS to access Matomo, when stated in the URL', async() => {
    httpsMock.reply(200);
    await matomo.track('http://mywebsite.com/');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://127.0.0.1/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });
});
