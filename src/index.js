'use strict'

// see previous example for the things that are not commented

const assert = require('assert')
const Provider = require('oidc-provider')

const fs = require('fs')
const express = require('express')

const app = express()

const options = {
    key: fs.readFileSync('./ssl/localhost.key'),
    cert: fs.readFileSync('./ssl/localhost.cert'),
    requestCert: false,
    rejectUnauthorized: false
}


// TODO : Work out the URL based on the ENV...
const oidc = new Provider(`https://${process.env.HOST}:${process.env.PORT}`, {
    features: {
        claimsParameter: true,
        discovery: true,
        encryption: true,
        introspection: true,
        registration: true,
        request: true,
        revocation: true,
        sessionManagement: true
    }
})

//TODO : Work out a better way of managing Keys when not in Dev...
const keystore = require('./keystore.json')

oidc.initialize({
    clientCacheDuration: 60,
    keystore,
    clients: [{client_id: 'foo', client_secret: 'bar', redirect_uris: ['http://lvh.me/cb']}]
}).then(() => {
    app.proxy = true
    app.keys = process.env.SECURE_KEY.split(',')
    app.use(oidc.callback)

    const port = process.env.PORT

    if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
        const https = require('https')
        const server = https.createServer(options, app)

        server.listen(port, function () {
            console.log(`Dev server listening on https://${process.env.HOST}:${process.env.PORT}`)
        })
    } else {
        app.listen(port)
    }

}).catch((e) => {
        console.log(e)
    }
)