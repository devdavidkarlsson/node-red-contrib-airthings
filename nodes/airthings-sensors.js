'use strict';

module.exports = function(RED) {
    function AirthingsSensorsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.configNode = RED.nodes.getNode(config.configNode);
        node.unit = config.unit || 'metric';
        node.serialNumbers = config.serialNumbers || '';

        if (!node.configNode || !node.configNode.api) {
            node.error('No valid Airthings config node');
            node.status({ fill: 'red', shape: 'ring', text: 'no config' });
            return;
        }

        node.on('input', async function(msg, send, done) {
            const unit = msg.unit || node.unit;
            const serialNumbers = msg.serialNumbers
                || (node.serialNumbers
                    ? node.serialNumbers.split(',').map(s => s.trim()).filter(Boolean)
                    : []);

            try {
                node.status({ fill: 'blue', shape: 'dot', text: 'fetching...' });
                const data = await node.configNode.api.getSensors({ unit, serialNumbers });
                msg.payload = data;
                node.status({ fill: 'green', shape: 'dot', text: 'ok' });
                send(msg);
                done();
            } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: err.message });
                done(err);
            }
        });
    }

    RED.nodes.registerType('airthings-sensors', AirthingsSensorsNode);
};
