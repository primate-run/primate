#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="${CONTAINER:-postgresql}"
IMAGE="${IMAGE:-docker.io/library/postgres:17}"
HOST_PORT="${HOST_PORT:-5432}"

SUPERUSER="${SUPERUSER:-postgres}"
SUPERUSER_PASSWORD="${SUPERUSER_PASSWORD:-password}"

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

psql_super() {
  podman exec -i \
    -e PGPASSWORD="$SUPERUSER_PASSWORD" \
    "$CONTAINER" \
    psql \
      -h 127.0.0.1 \
      -p 5432 \
      -U "$SUPERUSER" \
      -d postgres \
      -v ON_ERROR_STOP=1 \
      "$@"
}

psql_app() {
  podman exec -i \
    -e PGPASSWORD="$APP_PASSWORD" \
    "$CONTAINER" \
    psql \
      -h 127.0.0.1 \
      -p 5432 \
      -U "$APP_USER" \
      -d "$APP_DB" \
      -v ON_ERROR_STOP=1 \
      "$@"
}

superuser_login_ready() {
  podman exec -i \
    -e PGPASSWORD="$SUPERUSER_PASSWORD" \
    "$CONTAINER" \
    psql \
      -h 127.0.0.1 \
      -p 5432 \
      -U "$SUPERUSER" \
      -d postgres \
      -Atqc 'select 1' \
      >/dev/null 2>&1
}

app_login_ready() {
  podman exec -i \
    -e PGPASSWORD="$APP_PASSWORD" \
    "$CONTAINER" \
    psql \
      -h 127.0.0.1 \
      -p 5432 \
      -U "$APP_USER" \
      -d "$APP_DB" \
      -Atqc 'select 1' \
      >/dev/null 2>&1
}

wait_for_postgres() {
  local deadline state
  deadline=$((SECONDS + STARTUP_TIMEOUT_SECS))

  log 'waiting for PostgreSQL to accept connections...'

  while :; do
    if ! container_exists; then
      die "container $CONTAINER disappeared"
    fi

    state="$(container_state)"
    if [[ "$state" != "running" ]]; then
      show_logs
      die "container $CONTAINER is not running (state=$state)"
    fi

    if podman exec "$CONTAINER" pg_isready -h 127.0.0.1 -p 5432 -U "$SUPERUSER" >/dev/null 2>&1; then
      if superuser_login_ready; then
        log 'PostgreSQL is accepting authenticated connections'
        return 0
      fi
    fi

    if (( SECONDS >= deadline )); then
      show_logs
      die 'timed out waiting for PostgreSQL'
    fi

    echo 'still waiting...'
    sleep 2
  done
}

ensure_app_role_and_db() {
  log "ensuring role ${APP_USER} exists..."
  psql_super <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = '${APP_USER}'
  ) THEN
    CREATE ROLE ${APP_USER} LOGIN PASSWORD '${APP_PASSWORD}';
  ELSE
    ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}';
  END IF;
END
\$\$;
SQL

  log "ensuring database ${APP_DB} exists..."
  if ! psql_super -Atqc "SELECT 1 FROM pg_database WHERE datname = '${APP_DB}'" | grep -q '^1$'; then
    psql_super -c "CREATE DATABASE ${APP_DB} OWNER ${APP_USER}"
  else
    psql_super -c "ALTER DATABASE ${APP_DB} OWNER TO ${APP_USER}"
  fi

  log "granting test privileges on ${APP_DB}..."
  podman exec -i \
    -e PGPASSWORD="$SUPERUSER_PASSWORD" \
    "$CONTAINER" \
    psql \
      -h 127.0.0.1 \
      -p 5432 \
      -U "$SUPERUSER" \
      -d "$APP_DB" \
      -v ON_ERROR_STOP=1 <<SQL
GRANT CONNECT, TEMP ON DATABASE ${APP_DB} TO ${APP_USER};
GRANT USAGE, CREATE ON SCHEMA public TO ${APP_USER};
ALTER SCHEMA public OWNER TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR USER ${APP_USER} IN SCHEMA public
  GRANT ALL ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR USER ${APP_USER} IN SCHEMA public
  GRANT ALL ON SEQUENCES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES FOR USER ${APP_USER} IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO ${APP_USER};
SQL
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
    -p "${HOST_PORT}:5432" \
    -e POSTGRES_USER="$SUPERUSER" \
    -e POSTGRES_PASSWORD="$SUPERUSER_PASSWORD" \
    -e POSTGRES_DB=postgres \
    "$IMAGE" >/dev/null
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

    if superuser_login_ready; then
      log "container is usable; provisioning app role/database"
      ensure_app_role_and_db
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
  wait_for_postgres
  ensure_app_role_and_db
  verify_app_user

  log 'PostgreSQL is ready for tests'
  log "connection string: postgres://$APP_USER:$APP_PASSWORD@localhost:$HOST_PORT/$APP_DB"
}

main "$@"
