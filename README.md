# q-oauth-tests

Q REST API OAuth 2.0 compliance tests

This test suite only covers the **Requirements** in the [OAuth 2.0
incompatibilities](https://github.com/DasKeyboard/q/issues/10) GitHub issue.

When this badge says `passing`, all tests have passed.

[![Build
Status](https://travis-ci.org/jordanbtucker/q-oauth-tests.svg?branch=master)](https://travis-ci.org/jordanbtucker/q-oauth-tests)

## How to run the tests manually

These tests are run every 24 hours and the results can be seen at
https://travis-ci.org/jordanbtucker/q-oauth-tests. However, if you'd like to run
these tests manually, please follow these instructions.

Install [Node.js](https://nodejs.org/en/).

Install [Git](https://git-scm.com/).

In a terminal/command prompt, enter the following commands:

```sh
git clone https://github.com/jordanbtucker/q-oauth-tests
cd q-oauth-tests
npm install
```

Use a text editor to edit the `.env.example` file, set all of the blank
variables to valid values, then save it as a new file named `.env`.
Specifically, the following variables need to be set:

- CLIENT_ID
- CLIENT_SECRET
- REFRESH_TOKEN
- USER_USERNAME
- USER_PASSWORD

The rest of the variables have values that already work, but you can change them
as you see fit.

Now, everytime you want to run the tests, just use the following command:

```sh
npm test
```
