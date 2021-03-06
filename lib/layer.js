'use strict';

const assert = require('assert');
const toRegex = require('./to-regex');

/**
 * Create a new `Layer` with the given `pattern`, handler function and options.
 *
 * ```js
 * const layer = new Layer('/', file => {
 *   // do stuff to file
 *   file.extname = '.html';
 * });
 * ```
 * @name Layer
 * @param {string} `pattern`
 * @param {function} `handler`
 * @param {object} `options`
 * @api public
 */

class Layer {
  constructor(pattern, fn, options) {
    assert.equal(typeof fn, 'function', 'expected handler to be a function');
    this.options = { strict: false, end: false, ...options };
    this.pattern = pattern;
    this.handler = file => {
      let params = this.match(file.path);
      if (params) {
        return fn(file, params);
      }
    };
  }

  /**
   * Calls the layer handler on the given file if the `file.path` matches
   * the layer pattern.
   *
   * ```js
   * layer.handle(file)
   *   .then(() => console.log('Done:', file))
   *   .then(console.error)
   * ```
   * @name .handle
   * @param {object} `file` File object
   * @return {Promise}
   * @api public
   */

  handle(file) {
    let params = this.handler(file);
    if (params instanceof Promise) {
      return params.then(res => {
        file.params = res;
        return file;
      });
    }
    file.params = params;
    return file;
  }

  /**
   * Attempts to match a file path with the layer pattern. If the path matches,
   * an object of params is returned (see [path-to-regexp][] for details), otherwise
   * `null` is returned.
   *
   * ```js
   * const layer = new Layer('/:name');
   * console.log(layer.match('/foo')) //=> { name: 'foo' }
   * ```
   * @name .match
   * @param {string} `filepath`
   * @return {object|null}
   * @api public
   */

  match(filepath) {
    if (!filepath) return null;

    let match = this.regex.exec(filepath);
    if (!match) return null;

    let captures = match.slice(1);
    let params = {};
    let n = 0;

    for (let i = 0; i < captures.length; i++) {
      let val = captures[i];
      let key = this._regex.keys[i];
      let prop = key && key.name ? key.name : n++;
      params[prop] = val;
    }
    return params;
  }

  /**
   * Lazily create the regex to use for matching
   */

  get regex() {
    if (this._regex instanceof RegExp) {
      this._regex.lastIndex = 0;
      return this._regex;
    }

    if (this.pattern && !this._regex) {
      let pattern = this.pattern;
      let keys = [];
      let regex = this._regex = toRegex(pattern, keys, this.options);
      regex.lastIndex = 0;
      regex.keys = keys;
      this._regex = regex;
      return regex;
    }
  }
}

/**
 * Expose `Layer`
 */

module.exports = Layer;

