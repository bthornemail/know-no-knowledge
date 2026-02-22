# syntax=docker/dockerfile:1.6
FROM haskell:9.4.7 AS build

WORKDIR /src

# NOTE: The `haskell:9.4.7` image may be based on an EOL Debian release where
# apt repositories no longer exist at the default URLs. Avoid `apt-get` here to
# keep the build reproducible and not dependent on Debian archive mirrors.

# Copy cabal metadata first for better layer caching
COPY cabal.project /src/cabal.project
COPY json-canvas-cli.cabal /src/json-canvas-cli.cabal

# Copy source
COPY src /src/src
COPY app /src/app

# Build the executable
RUN cabal update
RUN cabal build exe:json-canvas

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /work

# Keep dist-newstyle available for debugging; install the executable into PATH.
COPY --from=build /src/dist-newstyle /opt/dist-newstyle
RUN set -eux; \
  BIN="$(find /opt/dist-newstyle -type f -name json-canvas -perm -111 | head -n 1)"; \
  test -n "$BIN"; \
  cp "$BIN" /usr/local/bin/json-canvas; \
  json-canvas --version || true

ENTRYPOINT ["json-canvas"]
