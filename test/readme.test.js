const assert = require('assert');
const { decorateApp, wrap } = require('../');
const superagent = require('superagent');

describe('API', function() {
  /**
   * The `decorateApp()` function is the preferred way to add async/await
   * support to your Express app. This function adds several helper functions
   * to your Express app.
   */
  describe('decorateApp()', function() {
    /**
     * The `decorateApp()` function adds `useAsync()`, `getAsync()`,
     * `putAsync()`, `postAsync()`, and `headAsync()`.
     */
    it('adds `useAsync()`, `getAsync()`, etc. to your Express app', async function() {
      const express = require('express');
      const app = decorateApp(express());

      // `useAsync()` is like `app.use()`, but supports async functions
      app.useAsync(async function(req, res, next) {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // `getAsync()` is like `app.get()`, but supports async functions
      app.getAsync('*', async function(req, res, next) {
        throw new Error('Oops!');
      });

      // Because of `getAsync()`, this error handling middleware will run.
      // `decorateApp()` also enables async error handling middleware.
      app.use(function(error, req, res, next) {
        res.send(error.message);
      });

      const server = await app.listen(3000);
      // acquit:ignore:start
      const res = await superagent.get('http://localhost:3000');

      assert.equal(res.text, 'Oops!');

      await server.close();
      // acquit:ignore:end
    });
  });

  /**
   * If you need more fine-grained control than what `decorateApp()` gives
   * you, you can use the `wrap()` function. This function wraps an async
   * Express middleware or route handler for better error handling.
   */
  describe('wrap()', function() {
    it('wraps an async function with Express-compatible error handling', async function() {
      const express = require('express');
      const app = express();

      // `wrap()` takes an async middleware or route handler and adds a
      // `.catch()` to handle any errors. It also prevents double-calling
      // `next()`.
      app.get('*', wrap(async function(req, res, next) {
        throw new Error('Oops!');
      }));

      // `wrap()` also supports async error handling middleware.
      app.use(wrap(async function(error, req, res, next) {
        throw new Error('foo');
      }));

      app.use(function(error, req, res, next) {
        res.send(error.message); // Will send back 'foo'
      });

      const server = await app.listen(3000);
      // acquit:ignore:start
      const res = await superagent.get('http://localhost:3000');

      assert.equal(res.text, 'foo');

      await server.close();
      // acquit:ignore:end
    });
  });
});
