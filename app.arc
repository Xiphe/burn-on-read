@app
burn-on-read

@http
get /

@aws
# profile default
region eu-central-1
architecture arm64
runtime typescript

@plugins
architect/plugin-typescript
