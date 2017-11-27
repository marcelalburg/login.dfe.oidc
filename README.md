[![Travis Build Status](https://travis-ci.org/DFE-Digital/login.dfe.oidc.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.oidc)

[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

[![VSTS Build Status](https://sfa-gov-uk.visualstudio.com/_apis/public/build/definitions/aa44e142-c0ac-4ace-a6b2-0d9a3f35d516/700/badge)](https://sfa-gov-uk.visualstudio.com/DfE%20New%20Secure%20Access/_build/index?definitionId=700&_a=completed)



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
## HotConfig & JWT Auth

If the env variable **CLIENTS_URL** is not present a file based adapter will be used for loading config (should run out of the box) however if the **CLIENTS_URL** is supplied the API Adapter will be used which will require on of the following setups to work (in conjunction with login.dfe.hot-config):  

### Simple JWT

**CLIENTS_TOKEN** this env veriable is the JWT key generated with a shared secret

### Active Directory Auth

this config requires you to set up an App and a Client in the Azure AD console (with the appropriate manifest)   
**CLIENTS_AAD_TENANT** Your AAD Tenant (somthing like 'dfensadev.omicrosoft.com')  
**CLIENTS_AAD_AUTHORITY** Your AAD Tenant authority URL https://login.microsoftonline.com/...  
**CLIENTS_AAD_CLIENT_ID** Your AAD Client ID  
**CLIENTS_AAD_CLIENT_SECRET**  Your AAD Secret key  
**CLIENTS_AAD_RESOURCE** The AAD ResourceID (ObjectID) you are trying to access


## Using login.dfe.interactions

To use the [interactions project](https://github.com/DFE-Digital/login.dfe.interactions) with the OIDC server and to have 
request verification enabled, you will need to share the public key. The OIDC server relies on 
a **interactions.cert** being created in the ssl folder and populated with the cert contents from the interactions localhost.cert
