@app
burn-on-read

@http
get /
get /write

@aws
# profile default
region eu-central-1
architecture arm64
runtime typescript

@plugins
architect/plugin-typescript

@static
fingerprint true
