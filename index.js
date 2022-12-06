const {
    Client,
    LocalAuth
} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const {
    https,
    get
} = require('https');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('84dd02731f5d4994925eac88318ecff4');

var globalDate = new Date();

// 84dd02731f5d4994925eac88318ecff4

function getTanggal(tgl = '') {
    var date = new Date(tgl);
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    return (year + "-" + month + "-" + day);
}

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    console.log(msg);

    if (msg.body === '!help') {
        msg.reply('cari SENDIRI lah !');
    } else if (msg.body === '!ping') {
        client.sendMessage(msg.from, 'ping pong?');
    } else if (msg.body === '!quote') {
        https.get('https://api.quotable.io/random', (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                let message = JSON.parse(data).content;
                client.sendMessage(msg.from, message);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    } else if (msg.body.startsWith('!berita ')) {
        const query = msg.body.split('!berita')[1];
        const dateWeekAgo = getTanggal(globalDate.getTime() - (3 * 24 * 60 * 60 * 1000));
        const dateNow = getTanggal(globalDate.getTime());
        
        newsapi.v2.everything({
            q: query,
            from: dateNow,
            to: dateWeekAgo,
            sortBy: 'relevancy',
            pageSize: 5
        }).then(res => {
            let message = '';
            res.articles.forEach((val, key) => {
                message += "> " + val.title + "\n link: " + val.url + "\n\n";
            });
            message += "Total hasil pencarian " + res.totalResults

            client.sendMessage(msg.from, message);
        });
    } else if (msg.body.includes('!') && !msg.body.startsWith('!berita ')) {
        msg.reply('UDAH WOY !');
    }
});

client.initialize();