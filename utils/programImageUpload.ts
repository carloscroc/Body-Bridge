// Upload a cover image to Convex storage using signed PUT URL pattern
// Returns a public URL to the uploaded image
export async function uploadCoverImage(file: File): Promise<string> {
  // 1) Acquire a signed upload URL and storageId from Convex via existing mutations
  let uploadUrl: string | undefined;
  let storageId: string | undefined;
  try {
    const apiAny: any = (typeof window !== "undefined" ? (window as any).api : undefined) || (globalThis as any).api;
    if (apiAny?.programs?.generateUploadUrl) {
      const resp = await apiAny.programs.generateUploadUrl();
      if (!resp || !resp.uploadUrl || !resp.storageId) throw new Error("Invalid response from generateUploadUrl");
      uploadUrl = resp.uploadUrl;
      storageId = resp.storageId;
    } else if (apiAny?.exercises?.generateUploadUrl) {
      const resp = await apiAny.exercises.generateUploadUrl();
      if (!resp || !resp.uploadUrl || !resp.storageId) throw new Error("Invalid response from generateUploadUrl");
      uploadUrl = resp.uploadUrl;
      storageId = resp.storageId;
    } else {
      throw new Error("Upload URL generator is not available in API");
    }
  } catch (err: any) {
    throw new Error(`Failed to obtain upload URL: ${err?.message ?? err}`);
  }
  // 2) Upload the file using a raw PUT (no FormData)
  try {
    const res = await fetch(uploadUrl!, {
      method: "PUT",
      body: file,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed with status ${res.status}: ${text || res.statusText}`);
    }
  } catch (err: any) {
    throw new Error(`File upload failed: ${err?.message ?? err}`);
  }
  // 3) Resolve public URL from storageId if possible
  try {
    const apiAny: any = (typeof window !== "undefined" ? (window as any).api : undefined) || (globalThis as any).api;
    if (storageId && apiAny?.exercises?.getUrl) {
      const urlResp = await apiAny.exercises.getUrl({ storageId: storageId as string });
      const url = (typeof urlResp === 'string' ? urlResp : (urlResp as any)?.url) ?? storageId;
      return url as string;
    }
    // Fallback to storageId as URL if getUrl is not available
    return storageId as string;
  } catch {
    // Best-effort: return storageId when URL resolution fails
    return storageId as string;
  }
}
