'use strict';

module.exports = function(RED) {
    function AirthingsRenewGetNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.configNode = RED.nodes.getNode(config.configNode);
        node.serialNumber = config.serialNumber;

        if (!node.configNode || !node.configNode.api) {
            node.error('No valid Airthings config node');
            node.status({ fill: 'red', shape: 'ring', text: 'no config' });
            return;
        }

        node.on('input', async function(msg, send, done) {
            const sn = msg.serialNumber || node.serialNumber;
            if (!sn) {
                done(new Error('Serial number is required (set in node config or msg.serialNumber)'));
                return;
            }

            try {
                node.status({ fill: 'blue', shape: 'dot', text: 'fetching...' });
                const data = await node.configNode.api.getRemoteControl(sn);
                msg.payload = data;
                node.status({ fill: 'green', shape: 'dot', text: data && data.mode ? data.mode.toLowerCase() : 'ok' });
                send(msg);
                done();
            } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: err.message });
                done(err);
            }
        });
    }

    RED.nodes.registerType('airthings-renew-get', AirthingsRenewGetNode);
};
