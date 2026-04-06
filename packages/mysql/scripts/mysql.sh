#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="${CONTAINER:-mysql}"
IMAGE="${IMAGE:-docker.io/library/mysql:8.4}"
HOST_PORT="${HOST_PORT:-3306}"
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

host_app_login_ready() {
  DB_HOST="localhost" \
  DB_PORT="$HOST_PORT" \
  DB_NAME="$APP_DB" \
  DB_USER="$APP_USER" \
  DB_PASSWORD="$APP_PASSWORD" \
  node --input-type=module >/dev/null 2>&1 <<'JS'
import mysql from "mysql2/promise";

let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.query("SELECT 1");
  await connection.query(
    "CREATE TABLE IF NOT EXISTS `__primate_db_check__` (`id` INT PRIMARY KEY)"
  );
  await connection.query("DROP TABLE `__primate_db_check__`");

  await connection.end();
} catch {
  try {
    await connection?.end();
  } catch {}
  process.exit(1);
}
JS
}

wait_for_mysql() {
  local deadline state
  deadline=$((SECONDS + STARTUP_TIMEOUT_SECS))

  log "waiting for MySQL to accept ${APP_USER} password auth over TCP..."

  while :; do
    if ! container_exists; then
      die "container $CONTAINER disappeared"
    fi

    state="$(container_state)"
    if [[ "$state" != "running" ]]; then
      show_logs
      die "container $CONTAINER is not running (state=$state)"
    fi

    if host_app_login_ready; then
      log "MySQL is ready for tests"
      return 0
    fi

    if (( SECONDS >= deadline )); then
      show_logs
      die "timed out waiting for MySQL auth"
    fi

    echo "still waiting..."
    sleep 2
  done
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
    -p "${HOST_PORT}:3306" \
    -e MYSQL_ROOT_PASSWORD="$ROOT_PASSWORD" \
    -e MYSQL_DATABASE="$APP_DB" \
    -e MYSQL_USER="$APP_USER" \
    -e MYSQL_PASSWORD="$APP_PASSWORD" \
    "$IMAGE" >/dev/null
}

main() {
  require_cmd podman
  require_cmd node

  podman info >/dev/null 2>&1 || die 'podman is installed but not usable for this user'

  if container_exists && container_running; then
    log "found running container $CONTAINER"

    if host_app_login_ready; then
      log "${APP_USER}@${APP_DB} is already ready for tests"
      exit 0
    fi

    log "running container exists but is not usable for tests; recreating it"
    podman rm -f "$CONTAINER" >/dev/null
  elif container_exists; then
    log "removing stale container $CONTAINER"
    podman rm -f "$CONTAINER" >/dev/null
  fi

  start_fresh_container
  wait_for_mysql

  log "connection string: mysql://${APP_USER}:${APP_PASSWORD}@localhost:${HOST_PORT}/${APP_DB}"
}

main "$@"
