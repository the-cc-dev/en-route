'use strict';

var Router = require('../lib/router');
var expect = require('chai').expect;


describe('Router', function() {

  describe('with strings', function () {

    describe('with two simple routes', function() {
      var router = new Router();

      router.route('/foo', function(key, page, next) {
        page.routedToFoo = true;
        next();
      });

      router.route('/bar', function(key, page, next) {
        page.routedToBar = true;
        next();
      });

      it('should have two routes', function() {
        expect(router.stack).to.have.length(2);
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'
        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.true;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

      it('should dispatch /bar', function(done) {
        var page = {};
        page.path = '/bar'

        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.true;
          done();
        })
      });

      it('should not dispatch /baz', function(done) {
        var page = {};
        page.path = '/baz'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

    });

    describe('with route containing multiple callbacks', function() {

      var router = new Router();

      router.route('/foo',
        function(key, page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(key, page, next) {
          page.routedTo.push('2');
          next();
        },
        function(key, page, next) {
          page.routedTo.push('3');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          expect(page.routedTo[2]).to.equal('3');
          done();
        })
      });

    });

    describe('with route containing multiple callbacks some of which are skipped', function() {

      var router = new Router();

      router.route('/foo',
        function(page, next) {
          page.routedTo = [ 'a1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('a2');
          next('route');
        },
        function(page, next) {
          page.routedTo.push('a3');
          next();
        });

      router.route('/foo', function(page, next) {
        page.routedTo.push('b1');
        next();
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('a1');
          expect(page.routedTo[1]).to.equal('a2');
          expect(page.routedTo[2]).to.equal('b1');
          done();
        })
      });

    });

    describe('with route that is parameterized', function() {

      var router = new Router();

      router.route('/blog/:year/:month/:day/:slug', function(page, next) {
        page.gotParams = [];
        page.gotParams.push(this.params['year']);
        page.gotParams.push(this.params['month']);
        page.gotParams.push(this.params['day']);
        page.gotParams.push(this.params['slug']);
        next();
      });

      router.route('/blog/2013/04/20/foo', function(page, next) {
        page.blogPage = true;
        next();
      });

      it('should dispatch /blog', function(done) {
        var page = {};
        page.path = '/blog/2013/04/20/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.gotParams).to.have.length(4);
          expect(page.gotParams[0]).to.equal('2013');
          expect(page.gotParams[1]).to.equal('04');
          expect(page.gotParams[2]).to.equal('20');
          expect(page.gotParams[3]).to.equal('foo');
          expect(page.blogPage).to.be.true;
          done();
        })
      });

    });

    describe('with route that encounters an error', function() {

      var router = new Router();

      router.route('/foo', function(page, next) {
        next(new Error('something went wrong'));
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went wrong');
          done();
        })
      });

    });

    describe('with route that throws an exception', function() {

      var router = new Router();

      router.route('/foo', function(page, next) {
        throw new Error('something went horribly wrong');
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went horribly wrong');
          done();
        })
      });

    });

    describe('with route containing error handling that is not called', function() {

      var router = new Router();

      router.route('/foo',
        function(page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push('error');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          done();
        })
      });

    });

    describe('with route containing error handling that is called', function() {

      var router = new Router();

      router.route('/foo',
        function(page, next) {
          page.routedTo = [ '1' ];
          next(new Error('1 error'));
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('1 error');
          done();
        })
      });

    });

    describe('with route containing error handling that is called due to an exception', function() {

      var router = new Router();

      router.route('/foo',
        function(page, next) {
          page.routedTo = [ '1' ];
          wtf
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.have.string('is not defined');
          done();
        })
      });

    });

  });

  describe('with regex', function () {

    describe('with two simple routes', function() {
      var router = new Router();

      router.route(/\/foo/, function(key, page, next) {
        page.routedToFoo = true;
        next();
      });

      router.route(/\/bar/, function(key, page, next) {
        page.routedToBar = true;
        next();
      });

      it('should have two routes', function() {
        expect(router.stack).to.have.length(2);
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'
        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.true;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

      it('should dispatch /bar', function(done) {
        var page = {};
        page.path = '/bar'

        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.true;
          done();
        })
      });

      it('should not dispatch /baz', function(done) {
        var page = {};
        page.path = '/baz'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

    });

    describe('with route containing multiple callbacks', function() {

      var router = new Router();

      router.route(/\/foo/,
        function(key, page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(key, page, next) {
          page.routedTo.push('2');
          next();
        },
        function(key, page, next) {
          page.routedTo.push('3');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page.path, page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          expect(page.routedTo[2]).to.equal('3');
          done();
        })
      });

    });

    describe('with route containing multiple callbacks some of which are skipped', function() {

      var router = new Router();

      router.route(/\/foo/,
        function(page, next) {
          page.routedTo = [ 'a1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('a2');
          next('route');
        },
        function(page, next) {
          page.routedTo.push('a3');
          next();
        });

      router.route(/\/foo/, function(page, next) {
        page.routedTo.push('b1');
        next();
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('a1');
          expect(page.routedTo[1]).to.equal('a2');
          expect(page.routedTo[2]).to.equal('b1');
          done();
        })
      });

    });

    describe('with route that encounters an error', function() {

      var router = new Router();

      router.route(/\/foo/, function(page, next) {
        next(new Error('something went wrong'));
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went wrong');
          done();
        })
      });

    });

    describe('with route that throws an exception', function() {

      var router = new Router();

      router.route(/\/foo/, function(page, next) {
        throw new Error('something went horribly wrong');
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went horribly wrong');
          done();
        })
      });

    });

    describe('with route containing error handling that is not called', function() {

      var router = new Router();

      router.route(/\/foo/,
        function(page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push('error');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          done();
        })
      });

    });

    describe('with route containing error handling that is called', function() {

      var router = new Router();

      router.route(/\/foo/,
        function(page, next) {
          page.routedTo = [ '1' ];
          next(new Error('1 error'));
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('1 error');
          done();
        })
      });

    });

    describe('with route containing error handling that is called due to an exception', function() {

      var router = new Router();

      router.route(/\/foo/,
        function(page, next) {
          page.routedTo = [ '1' ];
          wtf
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.have.string('is not defined');
          done();
        })
      });

    });

  });

  describe('with filters', function () {

    describe('with two simple routes', function() {
      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
      function(page, next) {
        page.routedToFoo = true;
        next();
      });

      router.route(function (page) {return page.path.indexOf('bar') !== -1; },
      function(page, next) {
        page.routedToBar = true;
        next();
      });

      it('should have two routes', function() {
        expect(router.stack).to.have.length(2);
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'
        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.true;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

      it('should dispatch /bar', function(done) {
        var page = {};
        page.path = '/bar'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.true;
          done();
        })
      });

      it('should not dispatch /baz', function(done) {
        var page = {};
        page.path = '/baz'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedToFoo).to.be.undefined;
          expect(page.routedToBar).to.be.undefined;
          done();
        })
      });

    });

    describe('with route containing multiple callbacks', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
        function(page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(page, next) {
          page.routedTo.push('3');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          expect(page.routedTo[2]).to.equal('3');
          done();
        })
      });

    });

    describe('with route containing multiple callbacks some of which are skipped', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
        function(page, next) {
          page.routedTo = [ 'a1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('a2');
          next('route');
        },
        function(page, next) {
          page.routedTo.push('a3');
          next();
        });

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
      function(page, next) {
        page.routedTo.push('b1');
        next();
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(3);
          expect(page.routedTo[0]).to.equal('a1');
          expect(page.routedTo[1]).to.equal('a2');
          expect(page.routedTo[2]).to.equal('b1');
          done();
        })
      });

    });

    describe('with route that is parameterized', function() {

      var router = new Router();

      router.route(
        function (page) {
          this.createPathRegex('/blog/:year/:month/:day/:slug');
          return this.matchStr(page.path);
        },
        function(page, next) {
          page.gotParams = [];
          page.gotParams.push(this.params['year']);
          page.gotParams.push(this.params['month']);
          page.gotParams.push(this.params['day']);
          page.gotParams.push(this.params['slug']);
          next();
        });

      router.route(
        function (page) {
          this.createPathRegex('/blog/2013/04/20/foo');
          return this.matchStr(page.path);
        },
        function(page, next) {
          page.blogPage = true;
          next();
        });

      it('should dispatch /blog', function(done) {
        var page = {};
        page.path = '/blog/2013/04/20/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.gotParams).to.have.length(4);
          expect(page.gotParams[0]).to.equal('2013');
          expect(page.gotParams[1]).to.equal('04');
          expect(page.gotParams[2]).to.equal('20');
          expect(page.gotParams[3]).to.equal('foo');
          expect(page.blogPage).to.be.true;
          done();
        })
      });

    });

    describe('with route that encounters an error', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
      function(page, next) {
        next(new Error('something went wrong'));
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went wrong');
          done();
        })
      });

    });

    describe('with route that throws an exception', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
      function(page, next) {
        throw new Error('something went horribly wrong');
      });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          expect(err).to.not.be.undefined;
          expect(err.message).to.equal('something went horribly wrong');
          done();
        })
      });

    });

    describe('with route containing error handling that is not called', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
        function(page, next) {
          page.routedTo = [ '1' ];
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push('error');
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('2');
          done();
        })
      });

    });

    describe('with route containing error handling that is called', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
        function(page, next) {
          page.routedTo = [ '1' ];
          next(new Error('1 error'));
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.equal('1 error');
          done();
        })
      });

    });

    describe('with route containing error handling that is called due to an exception', function() {

      var router = new Router();

      router.route(function (page) {return page.path.indexOf('foo') !== -1; },
        function(page, next) {
          page.routedTo = [ '1' ];
          wtf
          next();
        },
        function(page, next) {
          page.routedTo.push('2');
          next();
        },
        function(err, page, next) {
          page.routedTo.push(err.message);
          next();
        });

      it('should dispatch /foo', function(done) {
        var page = {};
        page.path = '/foo'

        router.middleware(page, function(err) {
          if (err) { return done(err); }
          expect(page.routedTo).to.be.an.instanceOf(Array);
          expect(page.routedTo).to.have.length(2);
          expect(page.routedTo[0]).to.equal('1');
          expect(page.routedTo[1]).to.have.string('is not defined');
          done();
        })
      });

    });

  });

  describe('.use', function () {

    describe('only stages', function () {

      describe('with two simple stages', function() {
        var router = new Router();

        router.use('first', function(key, page, next) {
          page.routedToFirst = true;
          next();
        });

        router.use('second', function(key, page, next) {
          page.routedToSecond = true;
          next();
        });

        it('should have two stages', function() {
          expect(Object.keys(router.stages)).to.have.length(2);
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'
          router.stage('first', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.true;
            expect(page.routedToSecond).to.be.undefined;
            done();
          })
        });

        it('should dispatch second', function(done) {
          var page = {};
          page.path = '/bar'

          router.stage('second', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.undefined;
            expect(page.routedToSecond).to.be.true;
            done();
          })
        });

        it('should not dispatch third', function(done) {
          var page = {};
          page.path = '/baz'

          router.stage('third', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.undefined;
            expect(page.routedToSecond).to.be.undefined;
            done();
          })
        });

      });

      describe('with stage containing multiple callbacks', function() {

        var router = new Router();

        router.use('first',
          function(key, page, next) {
            page.routedTo = [ '1' ];
            next();
          },
          function(key, page, next) {
            page.routedTo.push('2');
            next();
          },
          function(key, page, next) {
            page.routedTo.push('3');
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(3);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('2');
            expect(page.routedTo[2]).to.equal('3');
            done();
          })
        });

      });

      describe('with stage containing multiple callbacks some of which are skipped', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.routedTo = [ 'a1' ];
            next();
          },
          function(page, next) {
            page.routedTo.push('a2');
            next('route');
          },
          function(page, next) {
            page.routedTo.push('a3');
            next();
          });

        router.use('first', function(page, next) {
          page.routedTo.push('b1');
          next();
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(3);
            expect(page.routedTo[0]).to.equal('a1');
            expect(page.routedTo[1]).to.equal('a2');
            expect(page.routedTo[2]).to.equal('b1');
            done();
          })
        });

      });

      describe('with stage that encounters an error', function() {

        var router = new Router();

        router.use('first', function(page, next) {
          next(new Error('something went wrong'));
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            expect(err).to.not.be.undefined;
            expect(err.message).to.equal('something went wrong');
            done();
          })
        });

      });

      describe('with stage that throws an exception', function() {

        var router = new Router();

        router.use('first', function(page, next) {
          throw new Error('something went horribly wrong');
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            expect(err).to.not.be.undefined;
            expect(err.message).to.equal('something went horribly wrong');
            done();
          })
        });

      });

      describe('with stage containing error handling that is not called', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.routedTo = [ '1' ];
            next();
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push('error');
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('2');
            done();
          })
        });

      });

      describe('with stage containing error handling that is called', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.routedTo = [ '1' ];
            next(new Error('1 error'));
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push(err.message);
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('1 error');
            done();
          })
        });

      });

      describe('with stage containing error handling that is called due to an exception', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.routedTo = [ '1' ];
            wtf
            next();
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push(err.message);
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.have.string('is not defined');
            done();
          })
        });

      });

    });

    describe('stages and routes', function () {

      describe('with two simple stages and two simeple routes', function() {
        var router = new Router();

        router.use('first', function(key, page, next) {
          page.routedToFirst = true;
          next();
        });

        router.use('second', function(key, page, next) {
          page.routedToSecond = true;
          next();
        });

        router.route('/foo', function(key, page, next) {
          page.routedToFoo = true;
          next();
        });

        router.route('/bar', function(key, page, next) {
          page.routedToBar = true;
          next();
        });


        it('should have two stages', function() {
          expect(Object.keys(router.stages)).to.have.length(2);
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'
          router.stage('first', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.true;
            expect(page.routedToSecond).to.be.undefined;
            expect(page.routedToFoo).to.be.true;
            expect(page.routedToBar).to.be.undefined;
            done();
          })
        });

        it('should dispatch second', function(done) {
          var page = {};
          page.path = '/bar'

          router.stage('second', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.undefined;
            expect(page.routedToSecond).to.be.true;
            expect(page.routedToFoo).to.be.undefined;
            expect(page.routedToBar).to.be.true;
            done();
          })
        });

        it('should not dispatch third', function(done) {
          var page = {};
          page.path = '/baz'

          router.stage('third', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.routedToFirst).to.be.undefined;
            expect(page.routedToSecond).to.be.undefined;
            expect(page.routedToFoo).to.be.undefined;
            expect(page.routedToBar).to.be.undefined;
            done();
          })
        });

      });

      describe('with stage containing multiple callbacks', function() {

        var router = new Router();

        router.use('first',
          function(key, page, next) {
            page.stageCalled = [ '1' ];
            next();
          },
          function(key, page, next) {
            page.stageCalled.push('2');
            next();
          },
          function(key, page, next) {
            page.stageCalled.push('3');
            next();
          });

        router.route('/foo',
          function(key, page, next) {
            page.routedTo = [ '1' ];
            next();
          },
          function(key, page, next) {
            page.routedTo.push('2');
            next();
          },
          function(key, page, next) {
            page.routedTo.push('3');
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page.path, page, function(err) {
            if (err) { return done(err); }
            expect(page.stageCalled).to.be.an.instanceOf(Array);
            expect(page.stageCalled).to.have.length(3);
            expect(page.stageCalled[0]).to.equal('1');
            expect(page.stageCalled[1]).to.equal('2');
            expect(page.stageCalled[2]).to.equal('3');
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(3);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('2');
            expect(page.routedTo[2]).to.equal('3');
            done();
          })
        });

      });

      describe('with stage containing multiple callbacks some of which are skipped', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.stageCalled = [ 'a1' ];
            next();
          },
          function(page, next) {
            page.stageCalled.push('a2');
            next('route');
          },
          function(page, next) {
            page.stageCalled.push('a3');
            next();
          });

        router.use('first', function(page, next) {
          page.stageCalled.push('b1');
          next();
        });

        router.route('/foo',
          function(page, next) {
            page.routedTo = [ 'a1' ];
            next();
          },
          function(page, next) {
            page.routedTo.push('a2');
            next('route');
          },
          function(page, next) {
            page.routedTo.push('a3');
            next();
          });

        router.route('/foo', function(page, next) {
          page.routedTo.push('b1');
          next();
        });


        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.stageCalled).to.be.an.instanceOf(Array);
            expect(page.stageCalled).to.have.length(3);
            expect(page.stageCalled[0]).to.equal('a1');
            expect(page.stageCalled[1]).to.equal('a2');
            expect(page.stageCalled[2]).to.equal('b1');
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(3);
            expect(page.routedTo[0]).to.equal('a1');
            expect(page.routedTo[1]).to.equal('a2');
            expect(page.routedTo[2]).to.equal('b1');
            done();
          })
        });

      });

      describe('with route that encounters an error', function() {

        var router = new Router();

        router.use('first', function(page, next) {
          next();
        });

        router.route('/foo', function(page, next) {
          next(new Error('something went wrong'));
        });


        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            expect(err).to.not.be.undefined;
            expect(err.message).to.equal('something went wrong');
            done();
          })
        });

      });

      describe('with route that throws an exception', function() {

        var router = new Router();

        router.use('first', function(page, next) {
          next();
        });

        router.route('/foo', function(page, next) {
          throw new Error('something went horribly wrong');
        });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            expect(err).to.not.be.undefined;
            expect(err.message).to.equal('something went horribly wrong');
            done();
          })
        });

      });

      describe('with stage containing error handling that is not called', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.stageCalled = [ '1' ];
            next();
          },
          function(page, next) {
            page.stageCalled.push('2');
            next();
          },
          function(err, page, next) {
            page.stageCalled.push('error');
            next();
          });

        router.route('/foo',
          function(page, next) {
            page.routedTo = [ '1' ];
            next();
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push('error');
            next();
          });

        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.stageCalled).to.be.an.instanceOf(Array);
            expect(page.stageCalled).to.have.length(2);
            expect(page.stageCalled[0]).to.equal('1');
            expect(page.stageCalled[1]).to.equal('2');
            expect(page.stageCalled[2]).to.be.undefined
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('2');
            expect(page.routedTo[2]).to.be.undefined;
            done();
          })
        });

      });

      describe('with stage containing error handling that is called', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.stageCalled = [ '1' ];
            next(new Error('1 error'));
          },
          function(page, next) {
            page.stageCalled.push('2');
            next();
          },
          function(err, page, next) {
            page.stageCalled.push(err.message);
            next();
          });

        router.route('/foo',
          function(page, next) {
            page.routedTo = [ '1' ];
            next(new Error('1 error'));
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push(err.message);
            next();
          });


        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.stageCalled).to.be.an.instanceOf(Array);
            expect(page.stageCalled).to.have.length(2);
            expect(page.stageCalled[0]).to.equal('1');
            expect(page.stageCalled[1]).to.equal('1 error');
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.equal('1 error');
            done();
          })
        });

      });

      describe('with stage containing error handling that is called due to an exception', function() {

        var router = new Router();

        router.use('first',
          function(page, next) {
            page.stageCalled = [ '1' ];
            wtf
            next();
          },
          function(page, next) {
            page.stageCalled.push('2');
            next();
          },
          function(err, page, next) {
            page.stageCalled.push(err.message);
            next();
          });

        router.route('/foo',
          function(page, next) {
            page.routedTo = [ '1' ];
            wtf
            next();
          },
          function(page, next) {
            page.routedTo.push('2');
            next();
          },
          function(err, page, next) {
            page.routedTo.push(err.message);
            next();
          });


        it('should dispatch first', function(done) {
          var page = {};
          page.path = '/foo'

          router.stage('first', page, function(err) {
            if (err) { return done(err); }
            expect(page.stageCalled).to.be.an.instanceOf(Array);
            expect(page.stageCalled).to.have.length(2);
            expect(page.stageCalled[0]).to.equal('1');
            expect(page.stageCalled[1]).to.have.string('is not defined');
            expect(page.routedTo).to.be.an.instanceOf(Array);
            expect(page.routedTo).to.have.length(2);
            expect(page.routedTo[0]).to.equal('1');
            expect(page.routedTo[1]).to.have.string('is not defined');
            done();
          })
        });

      });

    });


  });

});
