<p align="center"><a href="https://eldorado.blue/"><img width="200"src="https://eldorado.blue/static/image/logo.png"></a></p>


### Eldorado.blue is a free open source online multicoins wallet for Bitcoin, Litecoin, Ethereum and ERC20 tokens where you own your private keys and hold your cryptocurrencies securely in your browser.

<img width="100%" src="https://eldorado.blue/static/image/share.png">

## [FAQ](https://github.com/dora-blue/eldorado/blob/master/FAQ.md)

## Security

We have a cron that is running contiously in background checking if the files served by https://eldorado.blue are the same version of this repository.

You can run it yourself by clonning this repository and running this two commands:

```
npm install
npm run hashes
```

The output will be something similar to this:

```
Getting tree list...
Checking list: Tue Jul 03 2018 18:50:34 GMT+0200 (CEST)
✔ fcd68a44bb1f50ea722420ddb865459cbe269a26 https://eldorado.blue/index.html
✔ 46cc72aa782beda606cdcb96ebd95bfc8c313bbb https://eldorado.blue/static/css/index.css
✔ 610f961f6e7ee96956157540fcccebb1b32bdfc2 https://eldorado.blue/static/bundle/main.js
✔ a284dedba3fb97fe4a233bacb8729db908ab37e6 https://eldorado.blue/static/bundle/libs.js
✔ 5905705df7c34b92140e6b91dba9e9d5111f4d4a https://eldorado.blue/static/libs/instascan.min.js
  0 fails
```

## Download and running the latest release on your machine

In order to follow this you will need to install the latest version of: [git](https://git-scm.com/downloads), [node.js](https://nodejs.org) and [npm](https://www.npmjs.com/)

Open a terminal/console and type these commands

```
git clone https://github.com/dora-blue/eldorado.git
cd eldorado
npm install
npm run build
npm run prod
open http://localhost:8000
```

## Developers

```
git clone git@github.com:dora-blue/eldorado.git
cd eldorado
npm install
npm run dev
open http://localhost:8000
```

... to do

## License

[MIT](http://opensource.org/licenses/MIT)