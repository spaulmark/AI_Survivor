mkdir -p ./out
esbuild app.ts --bundle > ./out/app.js
node ./out/app.js


