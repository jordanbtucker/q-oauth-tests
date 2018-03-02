import 'dotenv/config'
import assert from 'assert'
import url from 'url'
import request from 'request-promise-native'
import supertest from 'supertest'

describe(`Q REST API`, () => {
	describe(`Token endpoint`, () => {
		describe(`client_credentials grant type`, () => {
			it(`must support HTTP Basic authentication`, useClientCredentials)
			it(`must support x-www-form-urlencoded bodies`, useClientCredentials)

			it(`must return an invalid_client when given invalid client credentials`, async () => {
				return supertest(process.env.TOKEN_ENDPOINT)
					.post('/')
					.auth(process.env.CLIENT_ID, process.env.INVALID_CLIENT_SECRET)
					.type('form')
					.accept('json')
					.send({grant_type: 'client_credentials'})
					.expect('Content-Type', /json/)
					.expect(res => {
						assert(res.status === 400 || res.status === 401, `Expected HTTP status 400 or 401, got ${res.status}`)
						assertValidError(res.body.error, 'invalid_client')
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
					.expect(200)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('access_token' in res.body)
					})
			})

			it(`must require a redirect_uri`, async () => {
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
						assertValidError(res.body.error, 'invalid_request')
					})
			})

			it(`must return an invalid_grant error when given an invalid code`, async () => {
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
						assertValidError(res.body.error, 'invalid_grant')
					})
			})
		})

		describe(`password grant type`, () => {
			it(`must support x-www-form-urlencoded bodies`, usePassword)
			it(`must support a username parameter`, usePassword)

			it(`must return an invalid_grant error when given invalid user credentials`, async () => {
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
						assertValidError(res.body.error, 'invalid_grant')
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
					.expect(200)
					.expect('Content-Type', /json/)
					.expect(res => {
						assert('access_token' in res.body)
					})
			})

			it(`must return an invalid_grant error when given an invalid refresh_token`, async () => {
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
						assertValidError(res.body.error, 'invalid_grant')
					})
			})
		})
	})

	describe(`Authorization endpoint`, () => {
		it(`must require a reponse_type parameter`, async () => {
			return supertest(process.env.AUTHORIZATION_ENDPOINT)
				.get('/')
				.query({
					client_id: process.env.CLIENT_ID,
					redirect_uri: process.env.REDIRECT_URI,
				})
				.expect(400)
				.expect(res => {
					assertValidError(res.body, 'invalid_request')
				})
		})
	})
})

async function useClientCredentials () {
	return supertest(process.env.TOKEN_ENDPOINT)
		.post('/')
		.auth(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
		.type('form')
		.accept('json')
		.send({grant_type: 'client_credentials'})
		.expect(200)
		.expect('Content-Type', /json/)
		.expect(res => {
			assert('access_token' in res.body)
		})
}

async function usePassword () {
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
			assert('access_token' in res.body)
		})
}

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

function assertValidError (actualError, expectedError) {
	if (expectedError != null) {
		assert.strictEqual(actualError, expectedError)
	}

	switch (actualError) {
	case 'invalid_request':
	case 'invalid_client':
	case 'invalid_grant':
	case 'unauthorized_client':
	case 'unsupported_grant_type':
	case 'invalid_scope':
		break
	default:
		assert.fail('Unknown error')
	}
}
