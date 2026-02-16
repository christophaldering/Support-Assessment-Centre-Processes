import { randomUUID } from "crypto";

const SIDECAR = "http://127.0.0.1:1106";

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) path = "/" + path;
  const parts = path.split("/");
  if (parts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  return { bucketName: parts[1]!, objectName: parts.slice(2).join("/") };
}

async function signUrl(
  bucketName: string,
  objectName: string,
  method: "GET" | "PUT",
  ttlSec: number
): Promise<string> {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to sign URL, status: ${res.status}. Make sure you're running on Replit.`
    );
  }
  const { signed_url } = await res.json();
  return signed_url;
}

function getPrivateObjectDir(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!dir) {
    throw new Error(
      "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
    );
  }
  return dir;
}

export async function getUploadUrl(): Promise<{ uploadURL: string; objectPath: string }> {
  const privateDir = getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateDir}/uploads/${objectId}`;
  const normalizedObjectPath = `/objects/uploads/${objectId}`;

  const { bucketName, objectName } = parseObjectPath(fullPath);
  const uploadURL = await signUrl(bucketName, objectName, "PUT", 900);

  return { uploadURL, objectPath: normalizedObjectPath };
}

export async function getSignedDownloadUrl(objectPath: string): Promise<string> {
  if (!objectPath.startsWith("/objects/")) {
    throw new Error("Invalid object path");
  }

  const entityId = objectPath.slice("/objects/".length);
  let entityDir = getPrivateObjectDir();
  if (!entityDir.endsWith("/")) {
    entityDir = `${entityDir}/`;
  }
  const fullPath = `${entityDir}${entityId}`;

  const { bucketName, objectName } = parseObjectPath(fullPath);
  return signUrl(bucketName, objectName, "GET", 3600);
}
