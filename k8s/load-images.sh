#!/usr/bin/env bash
# Carga las imagenes Quarkus locales al containerd del nodo kind de Docker Desktop.
#
# Por que existe esto:
#   Docker Desktop usa kind para K8s, y kind tiene su propio image store
#   separado del daemon Docker del host. Las imagenes que ves con 'docker images'
#   NO son visibles para los pods de K8s. Este script las "inyecta" usando
#   un debug pod que hace chroot al nodo y llama ctr import.
#
# Uso:
#   ./load-images.sh                              # carga las 7 imagenes
#   ./load-images.sh ms-usuarios api-gateway      # solo las que pases
#
# Despues normalmente quieres reiniciar los Deployments para que tomen la nueva imagen:
#   kubectl rollout restart deployment ms-usuarios api-gateway

set -euo pipefail

NODE="desktop-control-plane"
SERVICES_DEFAULT=(api-gateway ms-usuarios ms-tiendas ms-productos ms-reportes ms-busqueda ms-notificaciones)

if [ $# -eq 0 ]; then
  SERVICES=("${SERVICES_DEFAULT[@]}")
else
  SERVICES=("$@")
fi

cleanup_debug_pods() {
  kubectl get pods --no-headers 2>/dev/null \
    | awk '/^node-debugger/ {print $1}' \
    | xargs -r kubectl delete pod --wait=false 2>/dev/null \
    || true
}
trap cleanup_debug_pods EXIT
cleanup_debug_pods

for svc in "${SERVICES[@]}"; do
  # Si solo existe la imagen con prefijo (docker compose la nombra profeco-XXX),
  # re-etiquetala sin prefijo para que coincida con la image: del manifiesto.
  if ! docker image inspect "$svc:latest" >/dev/null 2>&1; then
    if docker image inspect "profeco-$svc:latest" >/dev/null 2>&1; then
      echo ">>> Re-tag profeco-$svc:latest -> $svc:latest"
      docker tag "profeco-$svc:latest" "$svc:latest"
    else
      echo "!!! No existe imagen $svc:latest ni profeco-$svc:latest. Salto." >&2
      continue
    fi
  fi

  echo ">>> Cargando $svc:latest al nodo $NODE..."
  cleanup_debug_pods
  docker save "$svc:latest" \
    | MSYS_NO_PATHCONV=1 kubectl debug "node/$NODE" \
        --image=alpine --profile=sysadmin -i -- \
        chroot /host ctr -n=k8s.io images import -
done

echo ""
echo ">>> Listo. Para que los pods tomen la nueva imagen, reinicia los Deployments:"
echo "    kubectl rollout restart deployment ${SERVICES[*]}"
