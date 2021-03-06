require('dotenv/config')
const assert = require('assert')
const url = require('url')
const request = require('request-promise-native')
const supertest = require('supertest')

require('tap').mochaGlobals()

describe(`Q REST API`, () => {
	describe(`Token endpoint`, () => {
		describe(`client_credentials grant type`, () => {
			it(`must support HTTP Basic authentication`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.auth(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
					.type('form')
					.accept('json')
					.send({grant_type: 'client_credentials'})
					.expect(200)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('access_token' in res.body, `Expected 'access_token' field in response body`)
					})
			})

			it(`must support x-www-form-urlencoded bodies`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.auth(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
					.type('form')
					.accept('json')
					.send({grant_type: 'client_credentials'})
					.expect(res => {
						assert.notStrictEqual(res.status, 415, `Got HTTP status 415 Unsuported Media Type`)
					})
			})

			it(`must return an HTTP 400 or 401 response with an invalid_client error when given invalid client credentials`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.auth(process.env.CLIENT_ID, process.env.INVALID_CLIENT_SECRET)
					.type('form')
					.accept('json')
					.send({grant_type: 'client_credentials'})
					.expect('Content-Type', /json/)
					.expect(res => {
						assert(res.status === 400 || res.status === 401, `Expected HTTP status 400 or 401, got ${res.status}`)
						assert('error' in res.body, `Expected 'error' field in response body`)
						assert.strictEqual(res.body.error, 'invalid_client', `Expected error to be invalid_client, got ${res.body.error}`)
					})
			})
		})

		describe(`authorization_code grant type`, () => {
			it(`must support x-www-form-urlencoded bodies`, async () => {
				const code = await getAuthorizationCode()

				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'authorization_code',
						client_id: process.env.CLIENT_ID,
						redirect_uri: process.env.REDIRECT_URI,
						code,
					})
					.expect(res => {
						assert.notStrictEqual(res.status, 415, `Got HTTP status 415 Unsuported Media Type`)
					})
			})

			it(`must return an HTTP 400 response with an invalid_request error when not given a redirect_uri paramter`, async () => {
				const code = await getAuthorizationCode()

				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'authorization_code',
						client_id: process.env.CLIENT_ID,
						redirect_uri: process.env.INVALID_REDIRECT_URI,
						code,
					})
					.expect(400)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('error' in res.body, `Expected 'error' field in response body`)
						assert.strictEqual(res.body.error, 'invalid_request', `Expected error to be invalid_request, got ${res.body.error}`)
					})
			})

			it(`must return an HTTP 400 response with an invalid_grant error when given an invalid code`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'authorization_code',
						client_id: process.env.CLIENT_ID,
						redirect_uri: process.env.INVALID_REDIRECT_URI,
						code: process.env.INVALID_CODE,
					})
					.expect(400)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('error' in res.body, `Expected 'error' field in response body`)
						assert.strictEqual(res.body.error, 'invalid_grant', `Expected error to be invalid_grant, got ${res.body.error}`)
					})
			})
		})

		describe(`password grant type`, () => {
			it(`must support x-www-form-urlencoded bodies`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'password',
						username: process.env.USER_USERNAME,
						password: process.env.USER_PASSWORD,
					})
					.expect(res => {
						assert.notStrictEqual(res.status, 415, `Got HTTP status 415 Unsuported Media Type`)
					})
			})

			it(`must support a username parameter`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'password',
						username: process.env.USER_USERNAME,
						password: process.env.USER_PASSWORD,
					})
					.expect(200)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('access_token' in res.body, `Expected 'access_token' field in response body`)
					})
			})

			it(`must return an HTTP 400 response with an invalid_grant error when given invalid user credentials`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'password',
						username: process.env.USER_USERNAME,
						password: process.env.USER_PASSWORD,
					})
					.expect(400)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('error' in res.body, `Expected 'error' field in response body`)
						assert.strictEqual(res.body.error, 'invalid_grant', `Expected error to be invalid_grant, got ${res.body.error}`)
					})
			})
		})

		describe(`refresh_token grant type`, () => {
			it(`must support x-www-form-urlencoded bodies`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'refresh_token',
						client_id: process.env.CLIENT_ID,
						refresh_token: process.env.REFRESH_TOKEN,
					})
					.expect(res => {
						assert.notStrictEqual(res.status, 415, `Got HTTP status 415 Unsuported Media Type`)
					})
			})

			it(`must return an HTTP 400 response with an invalid_grant error when given an invalid refresh_token`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.type('form')
					.accept('json')
					.send({
						grant_type: 'refresh_token',
						client_id: process.env.CLIENT_ID,
						refresh_token: process.env.INVALID_REFRESH_TOKEN,
					})
					.expect(400)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('error' in res.body, `Expected 'error' field in response body`)
						assert.strictEqual(res.body.error, 'invalid_grant', `Expected error to be invalid_grant, got ${res.body.error}`)
					})
			})
		})
	})

	describe(`Authorization endpoint`, () => {
		it(`must return an HTTP 400 response with an invalid_request error when not given a response_type paramter`, async () => {
			return supertest(process.env.AUTHORIZATION_ENDPOINT)
				.get('/')
				.query({
					client_id: process.env.CLIENT_ID,
					redirect_uri: process.env.REDIRECT_URI,
				})
				.expect(400)
				.expect(res => {
					assert('error' in res.body, `Expected 'error' field in response body`)
					assert.strictEqual(res.body.error, 'invalid_request', `Expected error to be invalid_request, got ${res.body.error}`)
				})
		})
	})
})

async function getAuthorizationCode () {
	let code

	try {
		await request({
			method: 'POST',
			uri: process.env.AUTHORIZATION_POST_ENDPOINT,
			qs: {
				client_id: process.env.CLIENT_ID,
				redirect_uri: process.env.REDIRECT_URI,
				state: '',
			},
			form: {
				email: process.env.USER_USERNAME,
				password: process.env.USER_PASSWORD,
			},
			followRedirect: false,
		})
	} catch (err) {
		const locationURI = url.parse(err.response.headers.location, true)
		code = locationURI.query.code
	}

	return code
}
