"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

const PADDING = 60;
const MIN_SIZE = 320;
const ZOOM_STEP = 1.4;
const MIN_WIDTH = 120;
const MAX_WIDTH = 6000;
const LABEL_LENGTH = 20;

/// Het kleinste kader om alle knopen heen, met wat ruimte. Dat wordt de
/// viewBox van de SVG: het stuk van het web dat je ziet.
function fitView(nodes) {
  if (nodes.length === 0) return { x: -MIN_SIZE / 2, y: -MIN_SIZE / 2, w: MIN_SIZE, h: MIN_SIZE };

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const w = Math.max(Math.max(...xs) + PADDING - minX, MIN_SIZE);
  const h = Math.max(Math.max(...ys) + PADDING - minY, MIN_SIZE);
  return { x: minX, y: minY, w, h };
}

function radius(node) {
  // Wortel: tien verbindingen maakt een knoop groter, maar niet tien keer.
  return 5 + Math.sqrt(node.degree) * 2.5;
}

function shortLabel(title) {
  return title.length > LABEL_LENGTH ? `${title.slice(0, LABEL_LENGTH - 1)}…` : title;
}

/// Het web als SVG. De plekken komen van de server; hier tekenen we, en
/// reageren we op de muis: aanwijzen, slepen, verschuiven en zoomen.
export default function Graph({ nodes: initialNodes, links, legend }) {
  const svgRef = useRef(null);
  // Wat er gesleept wordt, en of de muis echt bewoog. Een ref: het hoeft niet
  // op het scherm, en moet ook tussen twee renders blijven bestaan.
  const dragRef = useRef(null);
  const draggedRef = useRef(false);

  const [nodes, setNodes] = useState(initialNodes);
  const [view, setView] = useState(() => fitView(initialNodes));
  const [hovered, setHovered] = useState(null);
  const [showLonely, setShowLonely] = useState(false);

  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  // Per knoop: met wie is hij verbonden? Voor het oplichten van de buren.
  const neighbours = useMemo(() => {
    const map = new Map();
    for (const { source, target } of links) {
      if (!map.has(source)) map.set(source, new Set());
      if (!map.has(target)) map.set(target, new Set());
      map.get(source).add(target);
      map.get(target).add(source);
    }
    return map;
  }, [links]);

  // Losse stukken zonder verbinding zijn standaard verborgen: anders wordt
  // het web een wolk van stippen.
  const visible = showLonely ? nodes : nodes.filter((node) => node.degree > 0);
  const lonelyCount = nodes.length - nodes.filter((node) => node.degree > 0).length;

  function isLit(id) {
    return hovered === null || id === hovered || neighbours.get(hovered)?.has(id);
  }

  /// Muispositie op het scherm omrekenen naar een plek in het web.
  function toGraph(event) {
    const matrix = svgRef.current.getScreenCTM().inverse();
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
  }

  function startNodeDrag(event, id) {
    event.stopPropagation();
    dragRef.current = { kind: "node", id };
    draggedRef.current = false;
  }

  function startPan(event) {
    dragRef.current = {
      kind: "pan",
      clientX: event.clientX,
      clientY: event.clientY,
      viewX: view.x,
      viewY: view.y,
    };
    draggedRef.current = false;
  }

  function move(event) {
    const drag = dragRef.current;
    if (!drag) return;
    draggedRef.current = true;

    if (drag.kind === "node") {
      const point = toGraph(event);
      setNodes((current) =>
        current.map((node) => (node.id === drag.id ? { ...node, x: point.x, y: point.y } : node)),
      );
    } else {
      // Verschuiven: hoeveel pixels de muis bewoog, omgerekend naar het web.
      const scale = view.w / svgRef.current.clientWidth;
      setView((current) => ({
        ...current,
        x: drag.viewX - (event.clientX - drag.clientX) * scale,
        y: drag.viewY - (event.clientY - drag.clientY) * scale,
      }));
    }
  }

  function endDrag() {
    dragRef.current = null;
  }

  /// In- of uitzoomen rond het midden van wat je nu ziet.
  function zoom(factor) {
    setView((current) => {
      const w = Math.min(Math.max(current.w * factor, MIN_WIDTH), MAX_WIDTH);
      const h = (current.h / current.w) * w;
      return {
        x: current.x + (current.w - w) / 2,
        y: current.y + (current.h - h) / 2,
        w,
        h,
      };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2" aria-label="Legenda">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ink-3" aria-hidden="true" />
            notitie
          </li>
          {legend.map((type) => (
            <li key={type.id} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: type.color }}
                aria-hidden="true"
              />
              {type.name}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          {lonelyCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={showLonely}
                onChange={(event) => setShowLonely(event.target.checked)}
              />
              Ook losse stukken ({lonelyCount})
            </label>
          )}
          <button type="button" className="btn btn-sm" onClick={() => zoom(1 / ZOOM_STEP)} aria-label="Inzoomen">
            +
          </button>
          <button type="button" className="btn btn-sm" onClick={() => zoom(ZOOM_STEP)} aria-label="Uitzoomen">
            −
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setView(fitView(visible))}>
            Passend
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        aria-label="Het web van je notities en items"
        // touch-none: op een telefoon schuift je vinger het web, niet de pagina.
        className="h-[70vh] w-full cursor-grab touch-none select-none rounded-[14px] bg-card active:cursor-grabbing"
        onPointerDown={startPan}
        onPointerMove={move}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {links.map(({ source, target }) => {
          const from = byId.get(source);
          const to = byId.get(target);
          if (!from || !to) return null;
          const lit = hovered !== null && (source === hovered || target === hovered);

          return (
            <line
              key={`${source}-${target}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={lit ? "var(--ink-3)" : "var(--line-2)"}
              strokeWidth={lit ? 2 : 1.2}
              // Even dik op elk zoomniveau.
              vectorEffect="non-scaling-stroke"
              opacity={hovered === null || lit ? 1 : 0.3}
            />
          );
        })}

        {visible.map((node) => {
          const lit = isLit(node.id);
          // Items (mensen, boeken) altijd met naam; notities alleen als je ze
          // aanwijst. Anders wordt het een muur van tekst.
          const showLabel = !node.isNote || node.id === hovered || (hovered !== null && lit);

          return (
            <Link
              key={node.id}
              href={node.href}
              onClick={(event) => {
                // Was het slepen? Dan niet openen.
                if (draggedRef.current) event.preventDefault();
              }}
              onPointerDown={(event) => startNodeDrag(event, node.id)}
              onPointerEnter={() => setHovered(node.id)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(node.id)}
              onBlur={() => setHovered(null)}
              aria-label={`${node.title}, ${node.typeName}, ${node.degree} verbindingen`}
              opacity={lit ? 1 : 0.25}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={radius(node)}
                fill={node.color ?? "var(--ink-3)"}
                stroke="var(--card)"
                strokeWidth="2"
              />
              {showLabel && (
                <text
                  x={node.x}
                  y={node.y + radius(node) + 13}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--ink-2)"
                >
                  {node.id === hovered ? node.title : shortLabel(node.title)}
                </text>
              )}
            </Link>
          );
        })}
      </svg>

      {/* Voor schermlezers: hetzelfde web als lijst, want een tekening kun je
          niet voorlezen. */}
      <ul className="sr-only">
        {links.map(({ source, target }) => (
          <li key={`${source}-${target}`}>
            {byId.get(source)?.title} noemt {byId.get(target)?.title}
          </li>
        ))}
      </ul>
    </div>
  );
}