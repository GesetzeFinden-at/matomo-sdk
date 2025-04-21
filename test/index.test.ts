'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import { MatomoTracker } from '../index'; // Assuming MatomoTracker is exported as an ESM module

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('MatomoTracker()', () => {
  it('should throw if no parameters provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker()).should.throw(/siteId/);
  });

  it('should throw if no siteId is provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker(null)).should.throw(/siteId/);
  });

  it('should throw if siteId provided is neither a number nor a string', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker({ foo: 'bar' })).should.throw(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker([1, 2, 3])).should.throw(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker(true)).should.throw(/siteId/);
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker(() => true)).should.throw(/siteId/);
    (() => new MatomoTracker(1, 'http://example.com/matomo.php')).should.not.throw();
    (() => new MatomoTracker('siteId', 'http://example.com/matomo.php')).should.not.throw();
  });

  it('should throw if no trackerUrl is provided', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    (() => new MatomoTracker(1)).should.throw(/tracker/);
  });

  it('should throw if trackerUrl is not valid (no matomo.php endpoint)', () => {
    (() => new MatomoTracker(1, 'http://example.com/index.php')).should.throw(/tracker/);
  });

  it('should allow invalid URL if noURLValidation is set', () => {
    (() => new MatomoTracker(1, 'http://example.com/index.php', true)).should.not.throw(/tracker/);
  });

  it('should have properties siteId/trackerUrl', () => {
    const matomo = new MatomoTracker(1, 'http://example.com/matomo.php');
    matomo.siteId.should.equal(1);
    matomo.trackerUrl.should.equal('http://example.com/matomo.php');
  });
});

describe('#track()', () => {
  let httpMock: nock.Interceptor;
  let httpSpy: sinon.SinonSpy;
  let matomo: MatomoTracker;

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpSpy = sinon.spy(global, 'fetch');
  });

  afterEach(() => {
    matomo = null!;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    matomo.track().should.eventually.throw(/URL/);
  });

  it('should accept a url as string', async() => {
    httpMock.reply(200);
    await matomo.track('http://mywebsite.com/');
    httpSpy.should.have.been.calledWith(
      'http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });

  it('should accept a parameter object', () => {
    httpMock.reply(200);
    matomo.track({ url: 'http://mywebsite.com/' });
    httpSpy.should.have.been.calledWith(
      'http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });

  it('should throw without options.url', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    matomo.track({}).should.eventually.throw(/URL/);
  });

  it('should emit an error if HTTP response status is not 200/30x', (done) => {
    httpMock.reply(404);

    matomo.on('error', (param: string) => {
      param.should.match(/^(404|getaddrinfo ENOTFOUND)/);
      done();
    });
    matomo.track({ url: 'http://mywebsite.com/' });
  });
});

describe('#track() - HTTPS support', () => {
  let httpsMock: nock.Interceptor;
  let httpsSpy: sinon.SinonSpy;
  let matomo: MatomoTracker;

  before(() => {
    matomo = new MatomoTracker(1, 'https://example.com/matomo.php');

    httpsMock = nock('https://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpsSpy = sinon.spy(global, 'fetch');
  });

  after(() => {
    matomo = null!;
    nock.restore();
    httpsSpy.restore();
  });

  it('should use HTTPS to access Matomo, when stated in the URL', () => {
    httpsMock.reply(200);
    matomo.track('http://mywebsite.com/');
    httpsSpy.should.have.been.calledWith(
      'https://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1'
    );
  });
});

describe('#bulkTrack()', () => {
  let httpMock: nock.Interceptor;
  let httpSpy: sinon.SinonSpy;
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

  before(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpSpy = sinon.spy(global, 'fetch');
  });

  after(() => {
    matomo = null!;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', () => {
    // @ts-expect-error - Intentionally testing behavior with missing parameter
    matomo.trackBulk().should.eventually.throw();
  });

  it('should POST to server', () => {
    httpMock.reply(200);
    matomo.trackBulk(events);
  });
});

describe('#bulkTrack() - HTTPS support', () => {
  let httpsMock: nock.Interceptor;
  let httpsSpy: sinon.SinonSpy;
  let matomo: MatomoTracker;

  before(() => {
    matomo = new MatomoTracker(1, 'https://127.0.0.1/matomo.php');

    httpsMock = nock('https://127.0.0.1')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpsSpy = sinon.spy(global, 'fetch');
  });

  it('should use HTTPS to access Matomo, when stated in the URL', () => {
    httpsMock.reply(200);
    matomo.track('http://mywebsite.com/');
  });

  after(() => {
    matomo = null!;
    nock.restore();
    httpsSpy.restore();
  });
});
