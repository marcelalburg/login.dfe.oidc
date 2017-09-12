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
num run dev 
```

Visit
```
https://localhost:4430/auth?client_id=foo&response_type=code&scope=openid
```
