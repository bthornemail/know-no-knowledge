.PHONY: build-image extract emit

build-image:
	docker compose build json-canvas

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
