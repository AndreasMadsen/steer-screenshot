#steer-screenshot

> Take a screenshot of a google chrome window

## Installation

```sheel
npm install steer-screenshot
```

## Dependencies

You will need to install graphicsmagick since this is whats used to validate
the screenshot.

On Mac OS X with `brew` you can install it with:

```shell
brew install graphicsmagick
```

Also be sure to check out the requirements for `steer`.

## Documentation

Sometimes Chrome hits a racecondtion so it either completly fails and returns
undefined or the picture gets malformated. This module validates the picture
and retries 5 times.

```javascript
var path = require('path');
var steer = require('steer');
var screenshot = require('steer-screenshot');

var chrome = steer({
  cache: path.resolve(__dirname, 'cache'),
  inspectorPort: 7510,
  permissions: ['tabs'] // this module needs `tabs` permissions
});

chrome.once('open', function () {

  var options = {
    format: 'png', // defaults to "jpeg", "png"|"jpeg"
    quality: 100 // defaults to 100, 0 <= quality <= 100,
  }

  screenshot(chrome, options, function (err, buffer, attemps) {
    if (err) throw err;
    console.log('Screenshot taken after ' + attemps + ' attemps');
    fs.writeFileSync('picture.jpg', buffer);
  });
});
```

##License

**The software is license under "MIT"**

> Copyright (c) 2014 Peter V. T. Schlegel
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
