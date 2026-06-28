'use strict';

const AirthingsAPI = require('../lib/airthings-api');

module.exports = function(RED) {
    // Test credentials without needing a deployed node — used by the config editor "Test" button
    RED.httpAdmin.post('/airthings/test-credentials', RED.auth.needsPermission('flows.write'), async (req, res) => {
        const { clientId, clientSecret } = req.body;
        if (!clientId || !clientSecret) {
            return res.json({ ok: false, error: 'Client ID and Client Secret are required' });
        }
        const api = new AirthingsAPI(clientId, clientSecret, null);
        try {
            await api._getToken();
            res.json({ ok: true });
        } catch (err) {
            res.json({ ok: false, error: err.message });
        }
    });

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
