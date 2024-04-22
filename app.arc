@app
burn-on-read

@http
get /
get /write
get /read/:id
put /api/key
delete /api/key
get /api/key/:id/:hash

@aws
# profile default
region eu-central-1
architecture arm64
runtime typescript

@plugins
architect/plugin-typescript
fingerprinting-fix
infra

@static
fingerprint true

@tables
keys
  id *String

@typescript
base-runtime nodejs20.x
esbuild-config esbuild.custom.cjs

