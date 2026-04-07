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

    transition verify_compliance(
        private device: DeviceLocation,
        public region: RegionBounds,
        private device_id: field,
    ) -> bool {
        let lat_ok: bool = device.lat >= region.min_lat && device.lat <= region.max_lat;
        let lng_ok: bool = device.lng >= region.min_lng && device.lng <= region.max_lng;
        return lat_ok && lng_ok;
    }

}
