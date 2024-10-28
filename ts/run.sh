mkdir -p ./out
esbuild app.ts --bundle --platform=node > ./out/app.js
node ./out/app.js


