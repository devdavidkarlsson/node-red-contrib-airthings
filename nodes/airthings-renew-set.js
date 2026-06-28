'use strict';

const VALID_MODES = ['OFF', 'AUTO', 'SLEEP', 'BOOST', 'MANUAL'];

module.exports = function(RED) {
    function AirthingsRenewSetNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.configNode = RED.nodes.getNode(config.configNode);
        node.serialNumber = config.serialNumber;
        node.mode = config.mode;
        node.fanSpeed = config.fanSpeed;

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

            let mode, fanSpeed;

            if (msg.payload && typeof msg.payload === 'object') {
                mode = String(msg.payload.mode || node.mode || '').toUpperCase();
                fanSpeed = msg.payload.fanSpeed != null ? msg.payload.fanSpeed : node.fanSpeed;
            } else if (typeof msg.payload === 'string' && msg.payload) {
                mode = msg.payload.toUpperCase();
                fanSpeed = node.fanSpeed;
            } else {
                mode = String(node.mode || '').toUpperCase();
                fanSpeed = node.fanSpeed;
            }

            if (!VALID_MODES.includes(mode)) {
                done(new Error(`Invalid mode "${mode}". Must be one of: ${VALID_MODES.join(', ')}`));
                return;
            }

            try {
                node.status({ fill: 'blue', shape: 'dot', text: `setting ${mode.toLowerCase()}...` });
                await node.configNode.api.setRemoteControl(
                    sn,
                    mode,
                    fanSpeed != null ? Number(fanSpeed) : undefined
                );
                msg.payload = { mode, ...(mode === 'MANUAL' ? { fanSpeed: Number(fanSpeed) } : {}) };
                node.status({ fill: 'green', shape: 'dot', text: mode.toLowerCase() });
                send(msg);
                done();
            } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: err.message });
                done(err);
            }
        });
    }

    RED.nodes.registerType('airthings-renew-set', AirthingsRenewSetNode);
};
