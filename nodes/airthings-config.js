'use strict';

const AirthingsAPI = require('../lib/airthings-api');

module.exports = function(RED) {
    function AirthingsConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.accountId = config.accountId;

        const clientId = this.credentials.clientId;
        const clientSecret = this.credentials.clientSecret;

        if (clientId && clientSecret) {
            this.api = new AirthingsAPI(clientId, clientSecret, this.accountId || null);
        } else {
            this.api = null;
        }
    }

    RED.nodes.registerType('airthings-config', AirthingsConfigNode, {
        credentials: {
            clientId: { type: 'text' },
            clientSecret: { type: 'password' },
        },
    });
};
