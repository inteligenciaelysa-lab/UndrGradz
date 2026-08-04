# Desplegar el backend de UndrGradz en Google Cloud Run

Guía paso a paso para construir la imagen, configurar Cloud SQL + Redis (Memorystore) y desplegar el backend en Cloud Run.

## 0. Prerrequisitos

- `gcloud` CLI instalado y autenticado (`gcloud auth login`, `gcloud config set project PROJECT_ID`).
- Docker instalado localmente (o usar Cloud Build, no cubierto aquí).
- Una instancia de Cloud SQL PostgreSQL ya creada, con su **connection name** (`PROJECT_ID:REGION:INSTANCE_NAME`).
- Variables de referencia usadas en esta guía: `PROJECT_ID`, `REGION` (ej. `us-central1`), `INSTANCE_NAME` (Cloud SQL).

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  redis.googleapis.com
```

## 1. Artifact Registry: crear repo, build y push de la imagen

```bash
gcloud artifacts repositories create undrgradz-repo \
  --repository-format=docker \
  --location=REGION

gcloud auth configure-docker REGION-docker.pkg.dev

cd backend
docker build -t REGION-docker.pkg.dev/PROJECT_ID/undrgradz-repo/backend:latest .
docker push REGION-docker.pkg.dev/PROJECT_ID/undrgradz-repo/backend:latest
```

El build usa `backend/` como contexto (el `Dockerfile` vive en `backend/Dockerfile`), así que los dumps `.sql` de la raíz del repo ni siquiera son visibles para el build.

## 2. Secret Manager: crear los secretos

Todos los valores sensibles van a Secret Manager, no como variables de entorno planas.

```bash
# DATABASE_URL con el formato de socket Unix de Cloud SQL (ver sección 3)
printf '%s' "postgresql://USER:PASSWORD@localhost/undrgradz?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME" | \
  gcloud secrets create DATABASE_URL --data-file=-

printf '%s' "un-secreto-largo-y-aleatorio" | gcloud secrets create JWT_ACCESS_SECRET --data-file=-
printf '%s' "otro-secreto-largo-y-aleatorio" | gcloud secrets create JWT_REFRESH_SECRET --data-file=-
printf '%s' "stream-app-secret" | gcloud secrets create STREAM_APP_SECRET --data-file=-

# La clave privada de Firebase debe llevar \n literales (no saltos de línea reales)
printf '%s' "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" | \
  gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
```

La cuenta de servicio que ejecuta el servicio de Cloud Run necesita el rol `roles/secretmanager.secretAccessor` sobre estos secretos.

## 3. Cloud SQL: connection string para Cloud Run

En local se usa TCP a través de Cloud SQL Auth Proxy (`127.0.0.1:5433`), eso **no cambia** — `.env` local se queda igual.

En Cloud Run, la conexión es por socket Unix, montado automáticamente al usar `--add-cloudsql-instances`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost/undrgradz?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
```

Prisma lee `DATABASE_URL` igual en ambos casos — no requiere cambios de código, solo el valor correcto en cada entorno.

## 4. Memorystore (Redis) + conector VPC Serverless

Socket.io usa un adaptador Redis para sincronizar presencia/eventos entre instancias de Cloud Run. Memorystore solo expone IP privada, así que Cloud Run necesita un conector VPC Serverless para alcanzarlo.

```bash
# Crear la instancia de Redis (tier Basic para empezar; Standard HA para producción crítica)
gcloud redis instances create undrgradz-redis \
  --size=1 \
  --region=REGION \
  --redis-version=redis_7_0 \
  --tier=basic

# Anotar la IP privada asignada
gcloud redis instances describe undrgradz-redis --region=REGION --format='value(host)'

# Crear el conector VPC Serverless (misma región/VPC que la instancia de Redis)
gcloud compute networks vpc-access connectors create undrgradz-connector \
  --region=REGION \
  --network=default \
  --range=10.8.0.0/28
```

`REDIS_URL` a usar en el deploy: `redis://REDIS_HOST:6379` (sin autenticación por defecto en Memorystore Basic; si se habilita AUTH, incluir el token en la URL).

**Nota:** si `REDIS_URL` no se configura, el backend arranca igual, pero cae al adaptador en memoria de Socket.io — funciona con una sola instancia, pero la presencia/eventos en tiempo real quedarán inconsistentes si Cloud Run escala a más de una instancia. Configurar Redis es un requisito, no opcional, si el servicio va a correr con más de 1 instancia.

## 5. WebSockets / Socket.io en Cloud Run — configuración específica

Cloud Run tiene varias particularidades que afectan a conexiones persistentes como Socket.io. Estas son las flags relevantes de `gcloud run deploy`:

- **`--timeout=3600`** — Cloud Run corta cualquier conexión (incluidos WebSockets) a los 300s por defecto. Para sockets persistentes se sube al máximo permitido, 3600s (1 hora). Una conexión que dura más de eso se corta igual y el cliente de Socket.io reconecta automáticamente (ya trae reconexión incorporada).

- **`--min-instances`** — trade-off a decidir:
  - Con `0` (default), Cloud Run puede escalar a cero tras un período de inactividad, lo que **desconecta de golpe a todos los usuarios con socket abierto** en ese momento.
  - Con `1`, siempre hay una instancia "caliente" atendiendo sockets, sin cortes por escalado a cero, pero implica costo fijo 24/7.
  - Con el adaptador Redis ya configurado, **no hace falta fijar `--max-instances=1`** — el servicio puede escalar hacia arriba libremente bajo carga; la recomendación es solo sobre el mínimo.
  - **Costo aproximado** (tier 1, on-demand — cifras de referencia, confirmar en https://cloud.google.com/run/pricing antes de comprometer presupuesto): con **1 vCPU / 2 GiB** asignados 24/7 (~730h/mes), descontando el free tier mensual (180.000 vCPU-s y 360.000 GiB-s gratis), el costo de CPU+memoria ronda **~US$70/mes**. Con **2 vCPU / 4 GiB** ronda **~US$145/mes**. Sumando el conector VPC Serverless (~US$8-10/mes con el tamaño mínimo) y Memorystore Basic 1GB (~US$35-50/mes), el total aproximado con `min-instances=1` queda en **~US$115-160/mes** según el tamaño de CPU/memoria elegido.

- **`--no-cpu-throttling`** ("CPU siempre asignada") — necesario para que los timers/heartbeat de Socket.io y el cliente Redis sigan funcionando aunque no haya requests HTTP entrando en ese instante. Sin esto, Cloud Run puede pausar la CPU entre requests y los sockets pueden comportarse de forma errática (ping/pong perdidos, desconexiones falsas).

- **`--concurrency`** — cada conexión WebSocket persistente cuenta como una "request" en curso durante toda su vida. El valor de concurrency limita cuántos sockets simultáneos soporta una sola instancia antes de que Cloud Run levante otra (default 80). Ajustar según la carga esperada por instancia (ej. `--concurrency=250`) y validar bajo carga real antes de fijar un valor definitivo.

- **Rolling updates y conexiones activas.** Cloud Run no corta las conexiones existentes solo por desplegar una revisión nueva: las instancias de la revisión anterior siguen sirviendo sus conexiones en curso (incluidos WebSockets) hasta que el cliente las cierra o se alcanza el `--timeout` configurado, mientras el tráfico *nuevo* ya se enruta a la revisión nueva. No requiere nada adicional en el código — en el peor caso, un usuario con un socket muy longevo tarda hasta el timeout configurado en migrar a la revisión nueva, o antes si su conexión se cae por cualquier otro motivo (Socket.io reconecta solo).

## 6. Desplegar

`ALLOWED_ORIGINS` (ver sección 10) contiene comas dentro del valor, lo cual choca con el delimitador `,` por defecto de `--set-env-vars`. Se usa el delimitador alternativo `^##^` para evitar el conflicto:

```bash
gcloud run deploy undrgradz-backend \
  --image=REGION-docker.pkg.dev/PROJECT_ID/undrgradz-repo/backend:latest \
  --region=REGION \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=PROJECT_ID:REGION:INSTANCE_NAME \
  --vpc-connector=undrgradz-connector \
  --vpc-egress=private-ranges-only \
  --timeout=3600 \
  --min-instances=1 \
  --no-cpu-throttling \
  --concurrency=250 \
  --cpu=1 --memory=2Gi \
  --set-env-vars="^##^NODE_ENV=production##GCS_BUCKET_NAME=your-bucket##FIREBASE_PROJECT_ID=your-project##FIREBASE_CLIENT_EMAIL=your-sa@your-project.iam.gserviceaccount.com##STREAM_APP_KEY=your-stream-key##REDIS_URL=redis://REDIS_HOST:6379##ALLOWED_ORIGINS=https://undrgradz.com,https://app.undrgradz.com,https://admin.undrgradz.com,https://api.undrgradz.com" \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,STREAM_APP_SECRET=STREAM_APP_SECRET:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest
```

La cuenta de servicio que ejecuta la revisión de Cloud Run necesita:
- `roles/cloudsql.client` (para conectar a Cloud SQL).
- Permiso de lectura/escritura sobre el bucket de GCS (`roles/storage.objectAdmin` en el bucket, o rol equivalente).
- `roles/secretmanager.secretAccessor` sobre cada secreto usado arriba.

No se necesita `GOOGLE_APPLICATION_CREDENTIALS` — Cloud Run inyecta automáticamente `K_SERVICE`, que el backend usa como señal de "modo producción" junto con `NODE_ENV=production`, y la librería de GCS se autentica sola vía la cuenta de servicio adjunta (ADC).

## 7. Migraciones de Prisma

Ejecutar contra Cloud SQL vía Auth Proxy desde una máquina de confianza o Cloud Shell (no desde dentro del contenedor de Cloud Run en cada arranque):

```bash
# Con el Auth Proxy corriendo en background en localhost:5433
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5433/undrgradz" npx prisma migrate deploy
```

## 8. Probar la API desplegada

```bash
SERVICE_URL=$(gcloud run services describe undrgradz-backend --region=REGION --format='value(status.url)')

# Ruta REST liviana
curl -i "$SERVICE_URL/api/v1/geo"

# Ruta inexistente -> debe dar 404 vía el fallback handler
curl -i "$SERVICE_URL/nonexistent"
```

Para Socket.io, conectar un cliente con un JWT válido contra `$SERVICE_URL` y confirmar que el handshake tiene éxito y que se reciben eventos (`messageReceived`, `newMatch`, etc.). Si se corre con más de una instancia, forzar tráfico a dos instancias distintas (ej. con `--min-instances=2` temporalmente) y verificar que un mensaje enviado desde un socket conectado a una instancia llega a un receptor conectado a otra — eso confirma que el adaptador Redis está sincronizando correctamente.

## 9. Dominio personalizado: api.undrgradz.com

```bash
gcloud beta run domain-mappings create \
  --service=undrgradz-backend \
  --domain=api.undrgradz.com \
  --region=REGION
```

El comando queda pendiente de verificación de propiedad del dominio (si `undrgradz.com` no está ya verificado en la cuenta de Google/Search Console asociada al proyecto) y luego imprime los registros DNS exactos (típicamente `CNAME` hacia `ghs.googlehosted.com`) que hay que dar de alta en el proveedor DNS. Para volver a consultarlos en cualquier momento:

```bash
gcloud beta run domain-mappings describe --domain=api.undrgradz.com --region=REGION
```

No agregar el registro DNS en el proveedor hasta tener la salida exacta de este comando — los valores no son genéricos, dependen del proyecto y la verificación de dominio.

## 10. Rollback

```bash
gcloud run services update-traffic undrgradz-backend --region=REGION --to-revisions=PREVIOUS_REVISION=100
```

## 11. Limitaciones conocidas / mejoras opcionales (no aplicadas en esta preparación)

- **CORS con allowlist explícito** (`src/config/cors.js`, usado por `src/app.js` y `src/socket.js`): en producción (`NODE_ENV=production` o Cloud Run vía `K_SERVICE`) solo se aceptan los orígenes listados en `ALLOWED_ORIGINS` (por defecto `undrgradz.com`, `app.undrgradz.com`, `admin.undrgradz.com`, `api.undrgradz.com`). Fuera de producción se sigue reflejando cualquier `Origin`, para no tener que listar cada host de desarrollo/LAN.
- **`morgan('dev')`** corre siempre, sin distinguir `NODE_ENV` — genera logs con colores ANSI en Cloud Logging (cosmético, no funcional).
- **Tamaño de Redis/Cloud Run**: los valores de CPU/memoria/tamaño de Redis en esta guía son un punto de partida; ajustar según el volumen real de usuarios concurrentes y monitorear en Cloud Monitoring antes de fijar un tamaño definitivo.
