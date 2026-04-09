// Compliance verification program for DePIN hardware nodes.
// Functions are designed to be chained: verify_compliance → verify_device_credentials → compute_node_score.
// Callers must honestly provide the boolean outputs of the first two functions as inputs to compute_node_score.
// After computing a score, call emit_compliance_record to mint a private on-chain record.
program compliance.aleo {

    struct DeviceLocation {
        lat: u64,
        lng: u64,
    }

    struct RegionBounds {
        min_lat: u64,
        max_lat: u64,
        min_lng: u64,
        max_lng: u64,
    }

    // On-chain record proving a device passed compliance with a specific trust score.
    // The record is private — only the owner can read it.
    // device_id binds the record to a specific hardware device.
    record ComplianceRecord {
        owner: address,
        score: u64,
        device_id: field,
        nonce: u64,
    }

    @noupgrade
    constructor() {}

    fn verify_compliance(
        private device: DeviceLocation,
        public region: RegionBounds,
        private device_id: field,    // binds this proof to a specific device identity
    ) -> bool {
        let lat_ok: bool = device.lat >= region.min_lat && device.lat <= region.max_lat;
        let lng_ok: bool = device.lng >= region.min_lng && device.lng <= region.max_lng;
        return lat_ok && lng_ok;
    }

    fn verify_device_credentials(
        private uptime_pct: u64,
        private hashrate: u64,
        public min_uptime: u64,
        public min_hashrate: u64,
        private device_id: field,    // binds this proof to a specific device identity
    ) -> bool {
        let uptime_ok: bool = uptime_pct >= min_uptime;
        let hashrate_ok: bool = hashrate >= min_hashrate;
        return uptime_ok && hashrate_ok;
    }

    // Combines location and operational compliance into a trust score for reward weighting.
    // Score range: 40–100 (40 = minimum pass, 100 = perfect node)
    // Formula: 40 base + 30% * uptime_pct + 30% * hashrate_score
    fn compute_node_score(
        private location_ok: bool,
        private ops_ok: bool,
        private uptime_pct: u64,
        private hashrate_score: u64,
        private device_id: field,    // binds this proof to a specific device identity
    ) -> u64 {
        assert(location_ok);
        assert(ops_ok);
        assert(uptime_pct <= 100u64);
        assert(hashrate_score <= 100u64);
        let uptime_weight: u64 = uptime_pct * 30u64 / 100u64;
        let hashrate_weight: u64 = hashrate_score * 30u64 / 100u64;
        let score: u64 = 40u64 + uptime_weight + hashrate_weight;
        return score;
    }

    // Mints a private on-chain ComplianceRecord after a device passes verification.
    // The score must be in the valid range [40, 100].
    // The nonce parameter is caller-supplied (e.g. a timestamp or counter) to ensure uniqueness.
    // The resulting record is private to the owner and can be presented as proof of compliance
    // when interacting with the FHE reward layer on Fhenix (Ethereum Sepolia).
    fn emit_compliance_record(
        private owner: address,
        private device_id: field,
        private score: u64,
        private nonce: u64,
    ) -> ComplianceRecord {
        assert(score >= 40u64);
        assert(score <= 100u64);
        return ComplianceRecord {
            owner: owner,
            score: score,
            device_id: device_id,
            nonce: nonce,
        };
    }

}
