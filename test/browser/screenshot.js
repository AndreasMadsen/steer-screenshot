
var http = require('http');
var path = require('path');
var fs = require('fs');
var gm = require('gm');

var test = require('tap').test;
var director = require('director');

var browser = require('../start-browser.js');
var screenshot = require('../../steer-screenshot.js');

// Create a testing server
var router = new director.http.Router();
var server = http.createServer();

var INVALID_IMG = fs.readFileSync(
    path.resolve(__dirname, '..', 'fixture', 'invalid-screenshot.jpg'),
    'base64'
);

server.on('request', router.dispatch.bind(router));
server.listen(0, function() {
  var host = 'http://127.0.0.1:' + server.address().port;

  var chrome = browser({ size: [800, 600] }, function() {
    var originalExtensionSend = chrome.extension.send;

    test('taking screenshot outputs a base64 data url string', function(t) {
      router.get('/test', function() {
        var res = this.res;
        res.end('done');
      });

      // Navigate to /test url
      chrome.inspector.Page.navigate(host + '/test', function(err) {
        t.equal(err, null);

        //TODO: find some event there can do this
        setTimeout(function() {

          screenshot(chrome, 60, function(err, buffer, attempts) {
            t.equal(err, null);
            t.equal(attempts, 1);

            // Check the buffer size as a form of validation
            t.ok(buffer.length >= 3 * 1024, 'image is min 3 KB');
            t.ok(buffer.length <= 4 * 1024, 'image is max 4 KB');

            // Test the image size should be: 800 x 600
            gm(buffer, 'validate.jpeg').size(function(err, value) {
              t.equal(err || null, null); // gm is a bad citizen

              t.deepEqual(value, {
                width: 800,
                height: 600
              });

              t.end();
            });
          });
        }, 100);
      });
    });

    test('taking screenshot fails if its not a data url', function(t) {
      // extension.send is modifined to return an invalid data url
      chrome.extension.send = function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        callback(null, 'InvalidDataURL');
      };

      screenshot(chrome, 60, function(err, result, attempts) {
        // Restore extension.send
        chrome.extension.send = originalExtensionSend;

        t.equal(err.name, 'Error');
        t.equal(err.message, 'Screenshot generated is not a data-url');

        t.equal(result, null);
        t.equal(attempts, 5);

        t.end();
      });
    });

    test('taking screenshot fails if undefined', function(t) {
      // extension.send is modifined to return an invalid data url
      chrome.extension.send = function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        callback(null, undefined);
      };

      screenshot(chrome, 60, function(err, result, attempts) {
        // Restore extension.send
        chrome.extension.send = originalExtensionSend;

        t.equal(err.name, 'Error');
        t.equal(err.message, 'Screenshot generated should not ' +
                             'be undefined');

        t.equal(result, null);
        t.equal(attempts, 5);

        t.end();
      });
    });

    test('taking screenshot fails if its an invald image', function(t) {
      // extension.send is modifined to return an invalid data url
      chrome.extension.send = function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        callback(null, 'data:image/jpeg;base64,' + INVALID_IMG);
      };

      var msg = 'gm convert: No decode delegate for this image format';

      screenshot(chrome, 60, function(err, result, attempts) {
        // Restore extension.send
        chrome.extension.send = originalExtensionSend;

        t.equal(err.name, 'Error');
        t.ok(err.message.slice(0, msg.length) === msg, 'Got gm error');

        t.equal(result, null);
        t.equal(attempts, 5);

        t.end();
      });
    });

    test('close chromium', function(t) {
      chrome.close(function() {
        server.close(function() {
          t.end();
        });
      });
    });
  });
});
