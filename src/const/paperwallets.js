export const PrivateKey = (qrs = []) => {
    let areas = ''
    qrs.forEach(qr => {
        qr.red = qr.red ? 'red' : ''
        areas += qr.img
            ? `
        <div class="area">
            <div class="area-qr">
                <img width="125" src="${qr.img}">
            </div>
            <div class="area-right ${qr.red}">
                <div class="area-title">${qr.title}</div>
                <div class="area-hash">${qr.hash}</div>
                <div class="area-description">${qr.description}</div>
            </div>
        </div>
        `
            : `
        <div class="area small ${qr.red}">
            <div class="area-titlesmall">${qr.title}:</div>
            <div class="area-long">${qr.hash}</div>
        </div>
        `
    })

    return `
<html>
    <head>
    <style>
body {
    font-family: sans-serif;
    font-size: 1rem;
    color: black;
}
#content {
    /* border: 1px solid black */
}
.area {
    width: 95%;
    height: 135px;
    clear: both;
    margin: 0 auto 2.3em auto;
}
.area.small {
    height: auto;
}
.area-qr {
    float: left;
    padding-top: 0.7em;
    padding-right: 1em;
}

.area-title {
    font-weight: bold;
    font-size: 2em;
    padding-top: 0.5em;
    padding-bottom: 0.3em;
}
.area-hash {
    color:black;
    font-family: monospace;
    font-weight: bold;
    word-break: break-all;
    font-size: 1.3em;
}
.area-description {
    padding-top: 0.8em;
    font-size: 1em;
    font-weight: bold;
    opacity: 0.3;
}
.area-titlesmall {
    font-weight: bold;
    font-size: 1.2em;
}
.area-long {
    font-family: monospace;
    word-break: break-all;
}
.red * {
    color: #DD0033 !important
}
#claim {
    text-align: center;
    color: #CCC
}
    </style>
    </head>
    <body>
        <div id="content">
            ${areas}
            <div id="claim">ELDORADO.BLUE</div>
        </div>
    </body>
</html>
`
}

export const Words = words => {
    return `
<html>
<head>
    <style>
        body {
            font-family: sans-serif;
            font-size: 1rem;
            color: black;
        }
        #content {
            width: 90%;
            margin: 0 auto;
        }
        #logo {
            margin-top: 20px;
            text-align: center;
        }
        #info {
            margin-top: 30px;
            color: gray;
            font-size: 12px;
        }
        #words {
            margin-top: 20px;
            margin-bottom: 30px;
            font-size: 27px;
            color: black;
            padding: 25px;
            text-align: center;
            font-weight: bold;
            border-radius: 5px;
            background: url('/static/image/pattern_background.png');
            font-family: monospace;
        }
        #claim {
            text-align: center;
            color: #CCC
        }
    </style>
</head>
<body>
    <div id="content">
        <div id="logo">
            <img src="/static/image/logo2.svg" height="40" />
        </div>
        <div id="info">
            Your recovery phrase allows you to recover your asset in case of loss or damage.
            <strong>Without it, you will not be able to access your cryptocurrency if something goes wrong.</strong>
            Make two copies of your recovery phrase and store them in separate physical locations.
            Please note, your recovery phrase is case sensitive and each word must be written in the correct order.
        </div>
        <div id="words">${words}</div>
        <div id="claim">ELDORADO.BLUE</div>
    </div>
</body>
</html>`
}