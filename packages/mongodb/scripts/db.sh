#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="${CONTAINER:-mongodb}"
IMAGE="${IMAGE:-docker.io/library/mongo:8.2}"
HOST_PORT="${HOST_PORT:-27017}"

ROOT_USER="${ROOT_USER:-root}"
ROOT_PASSWORD="${ROOT_PASSWORD:-password}"

APP_DB="${APP_DB:-primate}"
APP_USER="${APP_USER:-primate}"
APP_PASSWORD="${APP_PASSWORD:-primate}"

STARTUP_TIMEOUT_SECS="${STARTUP_TIMEOUT_SECS:-180}"

log() {
  printf '==> %s\n' "$*"
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed"
}

container_exists() {
  podman container exists "$CONTAINER"
}

image_exists() {
  podman image exists "$IMAGE"
}

container_running() {
  [[ "$(podman inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" == "true" ]]
}

container_state() {
  podman inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || true
}

show_logs() {
  echo
  echo '--- last container logs ---'
  podman logs "$CONTAINER" 2>&1 | tail -n 200 || true
  echo '---------------------------'
}

root_login_ready() {
  podman exec -i "$CONTAINER" \
    mongosh --quiet \
      --host 127.0.0.1 \
      --port 27017 \
      --username "$ROOT_USER" \
      --password "$ROOT_PASSWORD" \
      --authenticationDatabase admin \
      admin \
      --eval 'db.runCommand({ ping: 1 })' \
      >/dev/null 2>&1
}

app_login_ready() {
  podman exec -i "$CONTAINER" \
    mongosh --quiet \
      --host 127.0.0.1 \
      --port 27017 \
      --username "$APP_USER" \
      --password "$APP_PASSWORD" \
      --authenticationDatabase "$APP_DB" \
      "$APP_DB" \
      --eval 'db.runCommand({ ping: 1 })' \
      >/dev/null 2>&1
}

wait_for_root_login() {
  local deadline state
  deadline=$((SECONDS + STARTUP_TIMEOUT_SECS))

  log 'waiting for MongoDB to accept authenticated connections...'

  while :; do
    if ! container_exists; then
      die "container $CONTAINER disappeared"
    fi

    state="$(container_state)"
    if [[ "$state" != "running" ]]; then
      show_logs
      die "container $CONTAINER is not running (state=$state)"
    fi

    if root_login_ready; then
      log 'MongoDB is accepting root connections'
      return 0
    fi

    if (( SECONDS >= deadline )); then
      show_logs
      die "timed out waiting for MongoDB root login"
    fi

    echo "still waiting..."
    sleep 2
  done
}

ensure_app_user() {
  log "ensuring ${APP_USER} exists on database ${APP_DB}..."

  podman exec -i \
    -e APP_DB="$APP_DB" \
    -e APP_USER="$APP_USER" \
    -e APP_PASSWORD="$APP_PASSWORD" \
    "$CONTAINER" \
    mongosh --quiet \
      --host 127.0.0.1 \
      --port 27017 \
      --username "$ROOT_USER" \
      --password "$ROOT_PASSWORD" \
      --authenticationDatabase admin \
      admin <<'JS'
const dbName = process.env.APP_DB;
const username = process.env.APP_USER;
const password = process.env.APP_PASSWORD;

const targetDb = db.getSiblingDB(dbName);
const roles = [{ role: 'dbOwner', db: dbName }];

const existing = targetDb.getUser(username);

if (existing) {
  targetDb.updateUser(username, { pwd: password, roles });
  print(`updated user ${username} on ${dbName}`);
} else {
  targetDb.createUser({
    user: username,
    pwd: password,
    roles
  });
  print(`created user ${username} on ${dbName}`);
}

/*
  Ensure the database exists right away so tests can connect and use it
  without relying on lazy database creation semantics.
*/
targetDb.getCollection('__primate_init__').updateOne(
  { _id: 'ready' },
  { $set: { ready: true, updatedAt: new Date() } },
  { upsert: true }
);
JS
}

verify_app_user() {
  log "verifying ${APP_USER} can connect..."
  app_login_ready || die "${APP_USER} could not connect to ${APP_DB} after provisioning"
}

start_fresh_container() {
  if image_exists; then
    log "image already present: $IMAGE"
  else
    log "pulling image: $IMAGE"
    podman pull "$IMAGE"
  fi

  log "starting fresh container $CONTAINER"
  podman run -d \
    --name "$CONTAINER" \
    -p "${HOST_PORT}:27017" \
    -e MONGO_INITDB_ROOT_USERNAME="$ROOT_USER" \
    -e MONGO_INITDB_ROOT_PASSWORD="$ROOT_PASSWORD" \
    "$IMAGE" \
    --bind_ip_all >/dev/null
}

main() {
  require_cmd podman
  podman info >/dev/null 2>&1 || die 'podman is installed but not usable for this user'

  if container_exists && container_running; then
    log "found running container $CONTAINER"

    if app_login_ready; then
      log "${APP_USER}@${APP_DB} is already ready for tests"
      exit 0
    fi

    if root_login_ready; then
      log "container is healthy enough to reuse; provisioning app user"
      ensure_app_user
      verify_app_user
      exit 0
    fi

    log "running container exists but is not usable for tests; recreating it"
    podman rm -f "$CONTAINER" >/dev/null
  elif container_exists; then
    log "removing stale container $CONTAINER"
    podman rm -f "$CONTAINER" >/dev/null
  fi

  start_fresh_container
  wait_for_root_login
  ensure_app_user
  verify_app_user

  log 'MongoDB is ready for tests'
  log "connection string: mongodb://${APP_USER}:${APP_PASSWORD}@localhost:${HOST_PORT}/${APP_DB}?authSource=${APP_DB}"
}

main "$@"
