"use client";

import { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ContractBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fileName = searchParams.get("file")?.trim() || "Contract.pdf";
  const pdfUrl = searchParams.get("url") ?? "";

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [boxes, setBoxes] = useState<
    Array<{ id: string; x: number; y: number; width: number; height: number }>
  >([]);
  const [drag, setDrag] = useState<
    | { mode: "none" }
    | { mode: "move"; id: string; offsetX: number; offsetY: number }
    | { mode: "resize"; id: string; startX: number; startY: number; startWidth: number; startHeight: number }
  >({ mode: "none" });

  const addBox = () => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const width = rect.width * 0.2;
    const height = rect.height * 0.08;
    const x = (rect.width - width) / 2;
    const y = (rect.height - height) / 2;

    setBoxes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
      },
    ]);
  };

  const startMove = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const box = boxes.find((item) => item.id === id);
    if (!box) return;

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setDrag({
      mode: "move",
      id,
      offsetX: pointerX - box.x,
      offsetY: pointerY - box.y,
    });
  };

  const startResize = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const box = boxes.find((item) => item.id === id);
    if (!box) return;

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setDrag({
      mode: "resize",
      id,
      startX: pointerX,
      startY: pointerY,
      startWidth: box.width,
      startHeight: box.height,
    });
  };

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drag.mode === "none") return;

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setBoxes((current) =>
      current.map((box) => {
        if (box.id !== drag.id) return box;

        if (drag.mode === "move") {
          const nextX = Math.min(Math.max(0, pointerX - drag.offsetX), rect.width - box.width);
          const nextY = Math.min(Math.max(0, pointerY - drag.offsetY), rect.height - box.height);
          return { ...box, x: nextX, y: nextY };
        }

        const deltaX = pointerX - drag.startX;
        const deltaY = pointerY - drag.startY;
        const nextWidth = Math.max(80, drag.startWidth + deltaX);
        const nextHeight = Math.max(40, drag.startHeight + deltaY);
        return { ...box, width: nextWidth, height: nextHeight };
      }),
    );
  };

  const stopDrag = () => {
    setDrag({ mode: "none" });
  };

  const serialized = boxes.map((box) => ({
    id: box.id,
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }));

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
        <div className="text-[0.9rem] text-[#6b7280]">Upload PDF Document</div>
      </div>

      <div className="flex flex-1 gap-5 pb-4">
        <section className="flex-1 rounded-[18px] border border-[#e5e7eb] bg-white shadow-sm">
          <div
            ref={surfaceRef}
            className="relative flex h-full items-center justify-center overflow-hidden bg-[#f9fafb]"
            onMouseMove={handleMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            {pdfUrl ? (
              <iframe
                title={fileName}
                src={pdfUrl}
                className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-[12px] border border-[#e5e7eb] bg-white"
              />
            ) : null}

            {boxes.map((box) => (
              <div
                key={box.id}
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.width,
                  height: box.height,
                }}
                className="absolute cursor-move rounded-[8px] border-2 border-[#2563eb] bg-[#eff6ff]/80 shadow-sm"
                onMouseDown={(event) => startMove(event, box.id)}
              >
                <div className="flex h-full w-full items-center justify-center text-[0.8rem] font-medium text-[#1d4ed8]">
                  Signature
                </div>
                <div
                  className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-[4px] bg-[#2563eb]"
                  onMouseDown={(event) => startResize(event, box.id)}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addBox}
              className="relative z-10 rounded-[999px] bg-[#2563eb] px-6 py-3 text-[0.96rem] font-medium text-white shadow-md hover:bg-[#1d4ed8]"
            >
              Click to add signature field
            </button>
          </div>
        </section>

        <aside className="w-full max-w-xs rounded-[18px] border border-[#e5e7eb] bg-white px-5 py-5 text-[0.9rem]">
          <h2 className="text-[0.95rem] font-semibold text-[#111827]">
            Signature fields
          </h2>
          <p className="mt-2 text-[0.85rem] text-[#6b7280]">
            Positions are stored as x / y / width / height in pixels relative to the PDF frame.
          </p>

          <pre className="mt-4 max-h-64 overflow-auto rounded-[10px] bg-[#f9fafb] p-3 text-[0.7rem] text-[#4b5563]">
            {JSON.stringify(serialized, null, 2)}
          </pre>
        </aside>
      </div>
    </div>
  );
}

