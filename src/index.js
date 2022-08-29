require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, IntentsBitField, Partials } = require('discord.js');

const client = new Client({
    intents: Object.values(IntentsBitField.Flags),
    partials: Object.values(Partials)
});



require('./Handler/events.js').loadEvents(client);
client.login(process.env.TOKEN);