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
        return true;
    }

}
