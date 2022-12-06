const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');
require('dotenv').config();
const qrcode = require('qrcode-terminal');
const https = require('https');
// News api
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
// Open AI
const { Configuration, OpenAIApi} = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    }
    // OPEN AI chatbot
    else if (msg.body.startsWith('!cb ')) {
        const query = msg.body.split('!cb')[1];
        // check if query is empty
        if (query === '') {
            client.sendMessage(msg.from, '🤖 Ketik !cb <pesan>');
            return false;
        }
        const openai = new OpenAIApi(configuration);
        const prompt = "Human: " + query + "\nBot: ";
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0,
            max_tokens: 100,
          });
        // count is the world more than 100, give the user a warning
        client.sendMessage(msg.from, "🤖 " + response.data.choices[0].text);
        if (response.data.choices[0].text.split(' ').length > 100) {
            client.sendMessage(msg.from, '🤖 WARNING: The response is too long, please try again with a shorter prompt.');
        }
    }
    // OPEN AI Generate Image
    else if (msg.body.startsWith('!img ')) {
        msg.reply('🤖 Generating image, it may take a while....');
        const query = msg.body.split('!img')[1];
        // check if the query is empty
        if (query === '') {
            msg.reply('🤖 Please enter a valid prompt. e.g. !img a dog with a ball');
            return false;
        }
        const openai = new OpenAIApi(configuration);
        const response = await openai.createImage({
            prompt: query,
            n: 1,
            size: "256x256",
          });
          image_url = response.data.data[0].url;
          const media = await MessageMedia.fromUrl(image_url);
          msg.reply(media);

    }
});

client.initialize();