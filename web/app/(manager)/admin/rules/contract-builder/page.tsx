"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/react";
import NextImage from "next/image";

export default function ContractBuilderPage() {
  const DEFAULT_BOX_WIDTH_PCT = 0.56;
  const DEFAULT_BOX_HEIGHT_PCT = 0.14;
  const [PdfComponents, setPdfComponents] = useState<{
    Document: ComponentType<Record<string, unknown>>;
    Page: ComponentType<Record<string, unknown>>;
  } | null>(null);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      setPdfComponents({
        Document: mod.Document as ComponentType<Record<string, unknown>>,
        Page: mod.Page as ComponentType<Record<string, unknown>>,
      });
    });
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const fileName = searchParams.get("file")?.trim() || "Contract.pdf";
  const pdfUrl = searchParams.get("url") ?? "";
  const benefitId = searchParams.get("benefitId") ?? "";
  const contractId = searchParams.get("contractId") ?? "";
  const [pdfError, setPdfError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    const base = `${fileName}|${pdfUrl}`;
    return `contract-builder:boxes:${base}`;
  }, [fileName, pdfUrl]);

  const pdfSource = useMemo(() => {
    if (!pdfUrl) return "";
    if (pdfUrl.startsWith("blob:") || pdfUrl.startsWith("data:")) return pdfUrl;
    // In local dev, prefer the local Worker preview for contract URLs.
    if (
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      pdfUrl.includes("my-first-worker.ebmsteam10.workers.dev")
    ) {
      try {
        const url = new URL(pdfUrl);
        url.protocol = "http:";
        url.host = "localhost:8787";
        return `/api/pdf?url=${encodeURIComponent(url.toString())}`;
      } catch {
        // ignore
      }
    }
    if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
      return `/api/pdf?url=${encodeURIComponent(pdfUrl)}`;
    }
    return pdfUrl;
  }, [pdfUrl]);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const getPageRect = (page: number) => pageRefs.current[page]?.getBoundingClientRect() ?? null;

  const [numPages, setNumPages] = useState<number>(0);
  type SignatureBox = {
    id: string;
    page: number;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
  };
  const [boxes, setBoxes] = useState<
    SignatureBox[]
  >([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [signaturePreviewByBoxId, setSignaturePreviewByBoxId] = useState<Record<string, string>>(
    {},
  );
  const [signatureUrlByBoxId, setSignatureUrlByBoxId] = useState<Record<string, string>>({});
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureContainerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef<{ isDrawing: boolean; lastX: number; lastY: number }>({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
  });
  const [signatureUploadStatus, setSignatureUploadStatus] = useState<
    | { state: "idle" }
    | { state: "uploading" }
    | { state: "uploaded"; key: string; url: string }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [drag, setDrag] = useState<
    | { mode: "none" }
    | { mode: "move"; id: string; page: number; offsetXPx: number; offsetYPx: number }
    | {
      mode: "resize";
      id: string;
      page: number;
      startXPx: number;
      startYPx: number;
      startWidthPct: number;
      startHeightPct: number;
    }
  >({ mode: "none" });

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const serviceOrigin = useMemo(() => {
    try {
      const value = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "";
      return new URL(value).origin;
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const next: SignatureBox[] = parsed.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const obj = item as Record<string, unknown>;
        return [
          {
            id: typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
            page: typeof obj.page === "number" && Number.isFinite(obj.page) ? obj.page : 1,
            xPct: typeof obj.xPct === "number" && Number.isFinite(obj.xPct) ? obj.xPct : 0.4,
            yPct: typeof obj.yPct === "number" && Number.isFinite(obj.yPct) ? obj.yPct : 0.46,
            widthPct:
              typeof obj.widthPct === "number" && Number.isFinite(obj.widthPct)
                ? obj.widthPct
                : DEFAULT_BOX_WIDTH_PCT,
            heightPct:
              typeof obj.heightPct === "number" && Number.isFinite(obj.heightPct)
                ? obj.heightPct
                : DEFAULT_BOX_HEIGHT_PCT,
          },
        ];
      });
      setBoxes(next);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(boxes));
    } catch {
      // ignore
    }
  }, [boxes, storageKey]);

  const syncSignatureCanvasSize = () => {
    const container = signatureContainerRef.current;
    const canvas = signatureCanvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;

    const ctx = canvas.getContext("2d");
    const previous = ctx ? canvas.toDataURL("image/png") : null;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#111827";
      if (previous) {
        const img = new globalThis.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = previous;
      }
    }
  };

  useEffect(() => {
    if (!activeBoxId) return;
    syncSignatureCanvasSize();
    const container = signatureContainerRef.current;
    if (!container) return;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => syncSignatureCanvasSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeBoxId]);

  const clearActiveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (activeBoxId) {
      setSignaturePreviewByBoxId((current) => {
        const next = { ...current };
        delete next[activeBoxId];
        return next;
      });
    }
    setSignatureUploadStatus({ state: "idle" });
  };

  const saveActiveSignaturePreview = () => {
    if (!activeBoxId) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignaturePreviewByBoxId((current) => ({ ...current, [activeBoxId]: dataUrl }));
  };

  const uploadActiveSignatureToR2 = async () => {
    if (!activeBoxId) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (!serviceOrigin) {
      setSignatureUploadStatus({
        state: "error",
        message: "Missing NEXT_PUBLIC_GRAPHQL_URL (cannot derive service origin).",
      });
      return;
    }

    setSignatureUploadStatus({ state: "uploading" });
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/png"),
      );
      if (!blob) throw new Error("Failed to encode PNG");

      const token = await getToken();

      // Step 1: Get presigned URL from the worker
      const presignResponse = await fetch(
        `${serviceOrigin}/signatures/presign?contentType=${encodeURIComponent("image/png")}`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        },
      );
      if (!presignResponse.ok) {
        const text = await presignResponse.text().catch(() => "");
        throw new Error(`Presign failed (${presignResponse.status}): ${text || presignResponse.statusText}`);
      }
      const result = (await presignResponse.json()) as {
        presignedUrl?: string;
        key?: string;
        url?: string;
      };
      if (!result.presignedUrl || !result.key || !result.url) {
        throw new Error("Presign response missing fields");
      }

      // Step 2: Upload directly to R2 using the presigned URL
      const uploadResponse = await fetch(result.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => "");
        throw new Error(`Direct upload failed (${uploadResponse.status}): ${text || uploadResponse.statusText}`);
      }

      saveActiveSignaturePreview();
      setSignatureUrlByBoxId((current) => ({ ...current, [activeBoxId]: result.url! }));
      setSignatureUploadStatus({ state: "uploaded", key: result.key, url: result.url });
    } catch (error) {
      setSignatureUploadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const saveSignaturesToContract = async () => {
    if (!contractId) {
      setSignatureUploadStatus({
        state: "error",
        message: "Missing contractId in URL (cannot save signatures to contract).",
      });
      return;
    }
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "";
    if (!graphqlUrl) {
      setSignatureUploadStatus({
        state: "error",
        message: "Missing NEXT_PUBLIC_GRAPHQL_URL (cannot save signatures).",
      });
      return;
    }

    const signatures = boxes.flatMap((box) => {
      const url = signatureUrlByBoxId[box.id];
      if (!url) return [];
      return [
        {
          id: box.id,
          page: box.page,
          xPct: box.xPct,
          yPct: box.yPct,
          widthPct: box.widthPct,
          heightPct: box.heightPct,
          r2ObjectKey: url,
        },
      ];
    });

    try {
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `mutation UpdateContractSignatures($contractId: ID!, $signatures: [ContractSignatureInput!]!) {
            updateContractSignatures(contractId: $contractId, signatures: $signatures) {
              id
            }
          }`,
          variables: { contractId, signatures },
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Save failed (${response.status}): ${text || response.statusText}`);
      }
      const json = (await response.json()) as { errors?: Array<{ message?: string }> };
      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).filter(Boolean).join("\n") || "Save failed");
      }
    } catch (error) {
      setSignatureUploadStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const addBoxAtClientPoint = (page: number, clientX: number, clientY: number) => {
    const rect = getPageRect(page);
    if (!rect) return;

    const defaultWidthPct = DEFAULT_BOX_WIDTH_PCT;
    const defaultHeightPct = DEFAULT_BOX_HEIGHT_PCT;

    const pointerXPx = clientX - rect.left;
    const pointerYPx = clientY - rect.top;

    const xPctCentered = pointerXPx / rect.width - defaultWidthPct / 2;
    const yPctCentered = pointerYPx / rect.height - defaultHeightPct / 2;

    const xPct = clamp(xPctCentered, 0, 1 - defaultWidthPct);
    const yPct = clamp(yPctCentered, 0, 1 - defaultHeightPct);

    setBoxes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        page,
        xPct,
        yPct,
        widthPct: defaultWidthPct,
        heightPct: defaultHeightPct,
      },
    ]);
  };

  const startMove = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    const box = boxes.find((item) => item.id === id);
    if (!box) return;

    const rect = getPageRect(box.page);
    if (!rect) return;

    const pointerXPx = event.clientX - rect.left;
    const pointerYPx = event.clientY - rect.top;

    const boxXPx = box.xPct * rect.width;
    const boxYPx = box.yPct * rect.height;

    setDrag({
      mode: "move",
      id,
      page: box.page,
      offsetXPx: pointerXPx - boxXPx,
      offsetYPx: pointerYPx - boxYPx,
    });
  };

  const startResize = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    const box = boxes.find((item) => item.id === id);
    if (!box) return;

    const rect = getPageRect(box.page);
    if (!rect) return;

    const pointerXPx = event.clientX - rect.left;
    const pointerYPx = event.clientY - rect.top;

    setDrag({
      mode: "resize",
      id,
      page: box.page,
      startXPx: pointerXPx,
      startYPx: pointerYPx,
      startWidthPct: box.widthPct,
      startHeightPct: box.heightPct,
    });
  };

  const stopDrag = () => {
    setDrag({ mode: "none" });
  };

  useEffect(() => {
    if (drag.mode === "none") return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = getPageRect(drag.page);
      if (!rect) return;

      const pointerXPx = event.clientX - rect.left;
      const pointerYPx = event.clientY - rect.top;

      setBoxes((current) =>
        current.map((box) => {
          if (box.id !== drag.id) return box;

          if (drag.mode === "move") {
            const widthPct = box.widthPct;
            const heightPct = box.heightPct;

            const nextXPx = clamp(pointerXPx - drag.offsetXPx, 0, rect.width - widthPct * rect.width);
            const nextYPx = clamp(pointerYPx - drag.offsetYPx, 0, rect.height - heightPct * rect.height);

            return {
              ...box,
              xPct: clamp01(nextXPx / rect.width),
              yPct: clamp01(nextYPx / rect.height),
            };
          }

          const deltaXPx = pointerXPx - drag.startXPx;
          const deltaYPx = pointerYPx - drag.startYPx;

          const minWidthPct = Math.max(80 / rect.width, 0.05);
          const minHeightPct = Math.max(40 / rect.height, 0.04);

          const nextWidthPct = Math.max(minWidthPct, drag.startWidthPct + deltaXPx / rect.width);
          const nextHeightPct = Math.max(minHeightPct, drag.startHeightPct + deltaYPx / rect.height);

          const maxWidthPct = 1 - box.xPct;
          const maxHeightPct = 1 - box.yPct;

          return {
            ...box,
            widthPct: clamp(nextWidthPct, minWidthPct, maxWidthPct),
            heightPct: clamp(nextHeightPct, minHeightPct, maxHeightPct),
          };
        }),
      );
    };

    const handlePointerUp = () => stopDrag();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag]);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col gap-4 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/admin/rules")}
          className="text-[0.9rem] text-[#4b5563] transition hover:text-[#111827]"
        >
          &#8592; Back to {fileName}
        </button>
        <div className="flex items-center gap-3">
          <div className="text-[0.9rem] text-[#6b7280]">
            {benefitId ? `Benefit: ${benefitId}` : "Upload PDF Document"}
          </div>
          <button
            type="button"
            onClick={() => void saveSignaturesToContract()}
            disabled={!contractId}
            className="rounded-[12px] bg-[#2563eb] px-4 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            title={contractId ? "Save signature placements to contract" : "Missing contractId"}
          >
            Save signatures
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-5 pb-4">
        <section className="flex-1 rounded-[18px] border border-[#e5e7eb] bg-white shadow-sm">
          <div
            className="relative h-full overflow-auto bg-[#f9fafb] p-3"
          >
            {pdfUrl && PdfComponents ? (
              <PdfComponents.Document
                file={pdfSource}
                loading={
                  <div className="flex items-center justify-center py-10 text-[0.9rem] text-[#6b7280]">
                    Loading PDF…
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-[0.9rem] text-[#6b7280]">
                    <div>Failed to load PDF.</div>
                    {pdfError ? (
                      <div className="max-w-176 rounded-[10px] bg-white p-3 text-[0.8rem] text-[#111827] shadow-sm">
                        {pdfError}
                      </div>
                    ) : null}
                  </div>
                }
                onLoadError={(error: { message?: string }) => setPdfError(error?.message ?? String(error))}
                onSourceError={(error: { message?: string }) => setPdfError(error?.message ?? String(error))}
                onLoadSuccess={({ numPages: nextNumPages }: { numPages: number }) => {
                  setPdfError(null);
                  setNumPages(nextNumPages);
                  setBoxes((current) =>
                    current.length
                      ? current
                      : [
                        {
                          id: crypto.randomUUID(),
                          page: 1,
                          xPct: 0.2,
                          yPct: 0.39,
                          widthPct: DEFAULT_BOX_WIDTH_PCT,
                          heightPct: DEFAULT_BOX_HEIGHT_PCT,
                        },
                      ],
                  );
                }}
              >
                {Array.from({ length: numPages }, (_, idx) => {
                  const page = idx + 1;
                  return (
                    <div
                      key={page}
                      ref={(node) => {
                        pageRefs.current[page] = node;
                      }}
                      className="relative mx-auto mb-4 w-fit rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm"
                      onMouseDown={(event) => {
                        if (event.button !== 0) return;
                        addBoxAtClientPoint(page, event.clientX, event.clientY);
                      }}
                    >
                      <PdfComponents.Page pageNumber={page} renderTextLayer={false} renderAnnotationLayer={false} />

                      {boxes
                        .filter((box) => box.page === page)
                        .map((box) => (
                          <div
                            key={box.id}
                            style={{
                              left: `${box.xPct * 100}%`,
                              top: `${box.yPct * 100}%`,
                              width: `${box.widthPct * 100}%`,
                              height: `${box.heightPct * 100}%`,
                            }}
                            className="absolute cursor-move rounded-[8px] border-2 border-[#2563eb] bg-[#eff6ff]/80 shadow-sm"
                            onMouseDown={(event) => startMove(event, box.id)}
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setActiveBoxId(box.id);
                              setSignatureUploadStatus({ state: "idle" });
                            }}
                          >
                            {signaturePreviewByBoxId[box.id] ? (
                              <div className="relative h-full w-full">
                                <NextImage
                                  alt="Signature"
                                  src={signaturePreviewByBoxId[box.id]}
                                  fill
                                  className="rounded-[6px] object-contain p-1"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[0.8rem] font-medium text-[#1d4ed8]">
                                Signature
                              </div>
                            )}
                            <div
                              className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-[4px] bg-[#2563eb]"
                              onMouseDown={(event) => startResize(event, box.id)}
                            />

                            {activeBoxId === box.id ? (
                              <div
                                className="absolute inset-0 overflow-hidden rounded-[10px] border border-[#bfdbfe] bg-white/95 shadow-[0_18px_36px_rgba(37,99,235,0.22)] backdrop-blur-sm"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <div className="border-b border-[#dbeafe] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_100%)] px-3 py-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                                        Signature Editor
                                      </div>
                                      <div className="mt-1 text-[0.8rem] font-semibold text-[#0f172a]">
                                        Draw signature for this field
                                      </div>
                                    </div>
                                    <div className="rounded-full border border-[#bfdbfe] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#1d4ed8] shadow-sm">
                                      Double-click to reopen
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="rounded-[10px] border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#334155] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clearActiveSignature();
                                      }}
                                    >
                                      Clear
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-[10px] border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#334155] transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveBoxId(null);
                                      }}
                                    >
                                      Done
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 px-3 pb-3 pt-2">
                                  <div className="flex items-center justify-between text-[0.68rem] font-medium text-[#64748b]">
                                    <span>Use mouse or touch to sign inside the canvas.</span>
                                    <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[#2563eb]">
                                      Drag box to reposition
                                    </span>
                                  </div>

                                  <div
                                    ref={signatureContainerRef}
                                    className="relative h-[calc(100%-7.1rem)] min-h-[128px] w-full overflow-hidden rounded-[12px] border border-[#dbeafe] bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.38),_rgba(255,255,255,0.98)_42%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
                                  >
                                    <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:20px_20px]" />
                                    <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#dbeafe]/50 to-transparent" />
                                    <canvas
                                      ref={signatureCanvasRef}
                                      className="relative z-10 h-full w-full touch-none"
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const canvas = e.currentTarget;
                                        canvas.setPointerCapture(e.pointerId);
                                        const rect = canvas.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        drawingRef.current = { isDrawing: true, lastX: x, lastY: y };
                                      }}
                                      onPointerMove={(e) => {
                                        if (!drawingRef.current.isDrawing) return;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const canvas = e.currentTarget;
                                        const rect = canvas.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        const ctx = canvas.getContext("2d");
                                        if (!ctx) return;
                                        ctx.beginPath();
                                        ctx.moveTo(drawingRef.current.lastX, drawingRef.current.lastY);
                                        ctx.lineTo(x, y);
                                        ctx.stroke();
                                        drawingRef.current.lastX = x;
                                        drawingRef.current.lastY = y;
                                      }}
                                      onPointerUp={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        drawingRef.current.isDrawing = false;
                                        saveActiveSignaturePreview();
                                      }}
                                      onPointerCancel={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        drawingRef.current.isDrawing = false;
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 border-t border-[#dbeafe] bg-white px-3 py-2.5">
                                  <div className="min-w-0">
                                    {signatureUploadStatus.state === "uploaded" ? (
                                      <div className="truncate text-[0.72rem] font-semibold text-[#166534]">
                                        Signature uploaded to storage
                                      </div>
                                    ) : signatureUploadStatus.state === "error" ? (
                                      <div className="truncate text-[0.72rem] font-semibold text-[#b91c1c]">
                                        {signatureUploadStatus.message}
                                      </div>
                                    ) : (
                                      <div className="text-[0.72rem] text-[#64748b]">
                                        Draw first, then save this signature to storage.
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="shrink-0 rounded-[10px] bg-[#2563eb] px-3 py-2 text-[0.72rem] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)] transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void uploadActiveSignatureToR2();
                                    }}
                                    disabled={signatureUploadStatus.state === "uploading"}
                                  >
                                    {signatureUploadStatus.state === "uploading"
                                      ? "Uploading..."
                                      : "Save to R2"}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </PdfComponents.Document>
            ) : pdfUrl && !PdfComponents ? (
              <div className="flex items-center justify-center py-10 text-[0.9rem] text-[#6b7280]">
                Loading PDF viewer…
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[0.9rem] text-[#6b7280]">
                No PDF URL provided.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
