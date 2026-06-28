'use strict';

const fetch = require('node-fetch');

const TOKEN_URL = 'https://accounts-api.airthings.com/v1/token';
const BASE_URL = 'https://consumer-api.airthings.com/v1';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

class AirthingsAPI {
    constructor(clientId, clientSecret, accountId) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accountId = accountId || null;
        this._accessToken = null;
        this._tokenExpiry = 0;
    }

    async _getToken() {
        const now = Date.now();
        if (this._accessToken && now < this._tokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
            return this._accessToken;
        }

        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Token request failed (${response.status}): ${text}`);
        }

        const data = await response.json();
        this._accessToken = data.access_token;
        this._tokenExpiry = now + data.expires_in * 1000;
        return this._accessToken;
    }

    async _fetch(path, options = {}) {
        const token = await this._getToken();
        const response = await fetch(`${BASE_URL}${path}`, {
            timeout: REQUEST_TIMEOUT_MS,
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(`API error (${response.status}) for ${path}`);
        }

        if (response.status === 204) return null;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }
        return null;
    }

    async _getAccountId() {
        if (this.accountId) return this.accountId;
        const data = await this._fetch('/accounts');
        if (!data || !data.accounts || data.accounts.length === 0) {
            throw new Error('No accounts found for this user');
        }
        this.accountId = data.accounts[0].id;
        return this.accountId;
    }

    async getAccounts() {
        return this._fetch('/accounts');
    }

    async getDevices() {
        const accountId = await this._getAccountId();
        return this._fetch(`/accounts/${accountId}/devices`);
    }

    // Returns a flat object keyed by serial number: { "123": { temp: 27, co2: 642 }, ... }
    // If no serialNumbers given, fetches device list first to avoid the unfiltered /sensors 504.
    async getSensors({ unit = 'metric', serialNumbers = [] } = {}) {
        const accountId = await this._getAccountId();

        let sns = serialNumbers;
        if (sns.length === 0) {
            const devices = await this.getDevices();
            sns = (devices.devices || []).map(d => d.serialNumber);
        }

        // Query each device individually and collect results, skipping failures
        const results = {};
        await Promise.all(sns.map(async (sn) => {
            try {
                const params = new URLSearchParams({ unit, sn });
                const data = await this._fetch(`/accounts/${accountId}/sensors?${params.toString()}`);
                if (data && data.results && data.results[0]) {
                    const entry = data.results[0];
                    const flat = {};
                    for (const s of (entry.sensors || [])) {
                        flat[s.sensorType] = s.value;
                    }
                    results[sn] = {
                        sensors: flat,
                        recorded: entry.recorded,
                        batteryPercentage: entry.batteryPercentage,
                    };
                }
            } catch (err) {
                // Individual device failure — skip it, don't break the whole call
                results[sn] = { error: err.message };
            }
        }));

        return results;
    }

    async getRemoteControl(serialNumber) {
        const accountId = await this._getAccountId();
        return this._fetch(`/accounts/${accountId}/devices/${serialNumber}/remote-control`);
    }

    async setRemoteControl(serialNumber, mode, fanSpeed) {
        const accountId = await this._getAccountId();
        const body = { mode };
        if (mode === 'MANUAL') {
            if (fanSpeed == null) throw new Error('fanSpeed is required for MANUAL mode');
            body.fanSpeed = Number(fanSpeed);
            if (body.fanSpeed < 1 || body.fanSpeed > 5) {
                throw new Error('fanSpeed must be between 1 and 5');
            }
        }
        return this._fetch(`/accounts/${accountId}/devices/${serialNumber}/remote-control`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }
}

module.exports = AirthingsAPI;
