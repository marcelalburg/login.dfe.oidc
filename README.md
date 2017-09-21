[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.oidc.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.oidc)

# login.dfe.oidc

Generic OpenID Connect server for DfE, part of the **login.dfe** project.

## Getting Started

Install deps
```
npm i
```

Setup Keystore & devlopment ssl certs
```
npm run setup
```

Run
```
npm run dev 
```

Visit
```
https://localhost:4430/auth?client_id=foo&response_type=code&scope=openid
```


## Using login.dfe.interactions

To use the [interactions project](https://github.com/DFE-Digital/login.dfe.interactions) with the OIDC server and to have 
request verification enabled, you will need to share the public key. The OIDC server relies on 
a **interactions.cert** being created in the ssl folder and populated with the cert contents from the interactions localhost.cert
