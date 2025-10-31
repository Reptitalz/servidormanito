# WhatsApp Gateway para Despliegue en Cloud Run

Este es un servicio de Node.js diseñado para mantener una conexión persistente con WhatsApp usando Baileys. Está optimizado para ser desplegado como un contenedor en Google Cloud Run.

## Requisitos Previos

1.  **Google Cloud SDK (gcloud CLI)** instalado y configurado en tu máquina local.
2.  Un **Proyecto de Google Cloud** con la facturación habilitada.
3.  Las APIs de **Cloud Run** y **Artifact Registry** habilitadas en tu proyecto.

## Despliegue en Cloud Run

Sigue estos pasos desde tu terminal para desplegar el gateway:

### 1. Autenticación y Configuración del Proyecto

Asegúrate de estar autenticado y de haber configurado tu proyecto de Google Cloud:

```sh
gcloud auth login
gcloud config set project TU_PROJECT_ID
```
Reemplaza `TU_PROJECT_ID` con el ID de tu proyecto de Google Cloud.

### 2. Habilitar Servicios Necesarios

Si aún no lo has hecho, habilita las APIs requeridas:

```sh
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 3. Crear un Repositorio en Artifact Registry

Necesitas un lugar para almacenar tu imagen de contenedor.

```sh
gcloud artifacts repositories create whatsapp-gateway-repo --repository-format=docker --location=us-central1 --description="Repositorio para el gateway de WhatsApp"
```
*(Puedes cambiar `us-central1` por la región que prefieras)*

### 4. Construir y Subir la Imagen del Contenedor

Navega al directorio `whatsapp-gateway` en tu terminal y ejecuta el siguiente comando. Esto construirá la imagen Docker y la subirá a Artifact Registry.

```sh
gcloud builds submit --tag us-central1-docker.pkg.dev/TU_PROJECT_ID/whatsapp-gateway-repo/whatsapp-gateway:latest
```
*No olvides reemplazar `TU_PROJECT_ID` y la región si la cambiaste.*

### 5. Desplegar el Servicio en Cloud Run

Finalmente, despliega la imagen en Cloud Run.

```sh
gcloud run deploy whatsapp-gateway-service \
  --image us-central1-docker.pkg.dev/TU_PROJECT_ID/whatsapp-gateway-repo/whatsapp-gateway:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=1 \
  --port=8080 
```

**Notas Importantes:**

*   `--min-instances=1`: **CRÍTICO**. Esto mantiene el servicio siempre en ejecución para mantener la conexión con WhatsApp.
*   `--max-instances=1`: Esencial para que solo una instancia esté conectada a un número de WhatsApp a la vez.
*   Asegúrate de que la URL del webhook en `index.js` (`NEXTJS_WEBHOOK_URL`) apunte a tu aplicación Next.js desplegada, no a `localhost`.

Una vez desplegado, el servicio se ejecutará de forma continua y mantendrá la sesión de WhatsApp activa.
