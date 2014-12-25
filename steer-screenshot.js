
var gm = require('gm');
var async = require('async');
var endpoint = require('endpoint');

module.exports = function screenshot(browser, quality, callback) {
  var retryCount = 5;
  var currentAttempt = 1;
  var timeouts = [10, 100, 250, 500];

  // The error is never null in this function call
  function retry(err) {
    if (currentAttempt >= retryCount) {
      return callback(err, null, currentAttempt);
    }

    currentAttempt += 1;

    // Since the currentAttempt starts at 1 and it was just incremented
    // currentAttempt - 2 will be the actual timeout index.
    return setTimeout(attempt, timeouts[currentAttempt - 2]);
  }

  function attempt() {
    browser.extension.send('chrome.tabs.captureVisibleTab', null, {
        'quality': quality
    }, function(err, img) {
      if (err) return callback(err, null, currentAttempt);

      //if there are no other other errors then check if the screenshot
      //is actually present...
      if (typeof img !== 'string') {
        err = new Error('Screenshot generated should not be ' + typeof(img));
        return retry(err);
      }

      // Validate base64 url prefix
      var prefix = 'data:image/jpeg;base64,';
      var header = img.substring(0, prefix.length);
      if (header !== prefix) {
        err = new Error('Screenshot generated is not a data-url');
        return retry(err);
      }

      // Validate that its a real image
      var buffer = new Buffer(img.slice(prefix.length), 'base64');
      gm(buffer, 'validate.jpeg').stream(function(err, stdout, stderr) {
        if (err) return callback(err, null, currentAttempt);

        async.parallel({
          stdout: function (done) { stdout.pipe(endpoint(done)); },
          stderr: function (done) { stderr.pipe(endpoint(done)); }
        }, function(err, result) {
          if (err) return callback(err, null, currentAttempt);

          // Got stderr, the image is mostlikely malformated
          // try again
          if (result.stderr.length !== 0) {
            err = new Error(result.stderr.toString());
            return retry(err);
          }

          // Because the gm output is smaller than the chrome output
          // we will send that instead.
          return callback(null, result.stdout, currentAttempt);
        });
      });
    });
  }

  attempt();
};
