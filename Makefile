.PHONY: build-image test-image extract emit
.PHONY: demo-wwltt demo-wwltt-emit web-demo-wwltt

build-image:
	docker compose build json-canvas

test-image:
	docker build --target test -t json-canvas:test ./packages/json-canvas

extract:
	docker compose run --rm json-canvas md extract \
	  --root /work/docs --out /work/build/docs \
	  --mode all --langs ndjson,jsonl,jsonlines,json,hash,canvas \
	  --strict --aggregate --loose-ndjson --canon-filter \
	  --emit-canvas-pointers --emit-manifest

emit:
	docker compose run --rm json-canvas mnemonic-manifold emit \
	  --in /work/build/docs/ndjson/all.ndjson \
	  --out /work/build/docs/mnemonic-manifold.events.ndjson \
	  --emit-static --strict --centroid \
	  --manifest /work/build/docs/manifest.json

# Demo: narrative-series/When Wisdom, Law, and the Tribe Sat Down Together (ARTICLE I–VIII)
demo-wwltt:
	cd packages/json-canvas && cabal run json-canvas -- md extract \
	  --root ../../docs/narrative-series/When\ Wisdom,\ Law,\ and\ the\ Tribe\ Sat\ Down\ Together \
	  --out ../../build/demo/wwltt \
	  --mode ndjson-only --langs ndjson,jsonl,jsonlines,json,hash \
	  --strict --aggregate --canon-filter --emit-prose-events --emit-manifest

demo-wwltt-emit:
	cd packages/json-canvas && cabal run json-canvas -- mnemonic-manifold emit \
	  --in ../../build/demo/wwltt/ndjson/all.ndjson \
	  --out ../../build/demo/wwltt/mnemonic-manifold.events.ndjson \
	  --emit-static --strict --centroid \
	  --manifest ../../build/demo/wwltt/manifest.json

# Copy demo artifacts into the web app public/ folder for one-click loading.
# This keeps the UI deterministic (it fetches fixed bytes) without requiring
# the browser to access local filesystem paths.
web-demo-wwltt: demo-wwltt demo-wwltt-emit
	mkdir -p packages/mnemonic-web-app/public/demo/wwltt/ndjson
	cp -f build/demo/wwltt/manifest.json packages/mnemonic-web-app/public/demo/wwltt/manifest.json
	cp -f build/demo/wwltt/mnemonic-manifold.events.ndjson packages/mnemonic-web-app/public/demo/wwltt/mnemonic-manifold.events.ndjson
	cp -f build/demo/wwltt/ndjson/all.ndjson packages/mnemonic-web-app/public/demo/wwltt/ndjson/all.ndjson
