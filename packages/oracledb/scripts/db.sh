#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="${CONTAINER:-oracledb}"
IMAGE="${IMAGE:-container-registry.oracle.com/database/free:latest}"
HOST_PORT="${HOST_PORT:-1521}"
SYS_PASSWORD="${SYS_PASSWORD:-password}"
APP_USER="${APP_USER:-primate}"
APP_PASSWORD="${APP_PASSWORD:-primate}"
STARTUP_TIMEOUT_SECS="${STARTUP_TIMEOUT_SECS:-900}"

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

container_health() {
  podman inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || true
}

show_logs() {
  echo
  echo '--- last container logs ---'
  podman logs "$CONTAINER" 2>&1 | tail -n 200 || true
  echo '---------------------------'
}

run_as_oracle() {
  podman exec --user oracle -i "$CONTAINER" bash -lc '
    set -Eeuo pipefail
    source /home/oracle/.bashrc >/dev/null 2>&1 || true
    export ORACLE_SID="${ORACLE_SID:-FREE}"

    if command -v sqlplus >/dev/null 2>&1; then
      exec sqlplus -L -s "$@"
    elif [[ -n "${ORACLE_HOME:-}" && -x "$ORACLE_HOME/bin/sqlplus" ]]; then
      exec "$ORACLE_HOME/bin/sqlplus" -L -s "$@"
    else
      echo "sqlplus not found inside container" >&2
      exit 127
    fi
  ' -- "$@"
}

system_login_ready() {
  run_as_oracle "system/${SYS_PASSWORD}@localhost:1521/FREEPDB1" >/dev/null 2>&1 <<'SQL'
whenever sqlerror exit failure
select 1 from dual;
exit
SQL
}

app_login_ready() {
  run_as_oracle "${APP_USER}/${APP_PASSWORD}@localhost:1521/FREEPDB1" >/dev/null 2>&1 <<'SQL'
whenever sqlerror exit failure
select 1 from dual;
exit
SQL
}

wait_for_database() {
  local deadline state health
  deadline=$((SECONDS + STARTUP_TIMEOUT_SECS))

  log 'waiting for OracleDB to accept connections on FREEPDB1...'

  while :; do
    if ! container_exists; then
      die "container $CONTAINER disappeared"
    fi

    state="$(container_state)"
    health="$(container_health)"

    if [[ "$state" != "running" ]]; then
      show_logs
      die "container $CONTAINER is not running (state=$state)"
    fi

    podman healthcheck run "$CONTAINER" >/dev/null 2>&1 || true
    health="$(container_health)"

    if system_login_ready; then
      log 'database is accepting SYSTEM connections'
      return 0
    fi

    if (( SECONDS >= deadline )); then
      show_logs
      die "timed out waiting for OracleDB (state=$state, health=${health:-unknown})"
    fi

    printf 'still waiting... state=%s health=%s\n' "$state" "${health:-unknown}"
    sleep 5
  done
}

ensure_app_user() {
  log "ensuring ${APP_USER} exists with test privileges..."

  run_as_oracle / as sysdba <<SQL
whenever sqlerror exit failure
alter session set container = FREEPDB1;

declare
  v_count number := 0;
begin
  select count(*) into v_count
  from dba_users
  where username = upper('${APP_USER}');

  if v_count = 0 then
    execute immediate 'create user ${APP_USER} identified by "${APP_PASSWORD}" default tablespace users temporary tablespace temp';
  else
    execute immediate 'alter user ${APP_USER} identified by "${APP_PASSWORD}" account unlock';
  end if;
end;
/

grant connect, resource, unlimited tablespace to ${APP_USER};
exit
SQL
}

verify_app_user() {
  log "verifying ${APP_USER} can connect..."
  app_login_ready || die "${APP_USER} could not connect to FREEPDB1 after provisioning"
}

main() {
  require_cmd podman
  podman info >/dev/null 2>&1 || die 'podman is installed but not usable for this user'

  if container_exists && container_running; then
    log "found running container $CONTAINER; reusing it"

    if app_login_ready; then
      log "${APP_USER} is already ready for tests"
      return 0
    fi

    log "${APP_USER} is not ready yet; will provision it in the existing container"
    wait_for_database
    ensure_app_user
    verify_app_user
    return 0
  fi

  if container_exists; then
    log "removing stale container $CONTAINER"
    podman rm -f "$CONTAINER" >/dev/null
  fi

  if image_exists; then
    log "image already present: $IMAGE"
  else
    log "pulling image: $IMAGE"
    podman pull "$IMAGE"
  fi

  log "starting fresh container $CONTAINER"
  podman run -d \
    --name "$CONTAINER" \
    -p "${HOST_PORT}:1521" \
    -e ORACLE_PWD="$SYS_PASSWORD" \
    "$IMAGE" >/dev/null

  wait_for_database
  ensure_app_user
  verify_app_user

  log 'OracleDB is ready for tests'
  log "connect string: localhost:${HOST_PORT}/FREEPDB1"
  log "username: ${APP_USER}"
}

main "$@"
