import React, { useRef, useEffect, useState, useMemo } from 'react';

const ROW_HEIGHT = 32;
const ROW_GAP = 8;
const LABEL_WIDTH = 160;

const GanttChart = ({ scheduledTasks }) => {
  const trackContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure the track container width for SVG overlay sizing
  useEffect(() => {
    if (!trackContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(trackContainerRef.current);
    return () => observer.disconnect();
  }, [scheduledTasks]);

  // Build a row-index lookup: taskId -> row index
  const rowIndexMap = useMemo(() => {
    const map = {};
    if (scheduledTasks) {
      scheduledTasks.forEach((task, idx) => { map[task.id] = idx; });
    }
    return map;
  }, [scheduledTasks]);

  if (!scheduledTasks || scheduledTasks.length === 0) {
    return <div className="text-gray-400 italic">No schedule to display. Try running the optimizer.</div>;
  }

  // Find the total time range
  const maxTime = Math.max(...scheduledTasks.map(t => t.endTime), 24);
  const timeUnits = Array.from({ length: maxTime + 1 }, (_, i) => i);

  // Calculate SVG arrow coordinates for each dependency link
  const buildArrowLines = () => {
    if (!containerWidth) return [];
    const lines = [];

    scheduledTasks.forEach(task => {
      if (!task.links || task.links.length === 0) return;
      const toRowIdx = rowIndexMap[task.id];
      if (toRowIdx === undefined) return;

      task.links.forEach(depId => {
        const fromRowIdx = rowIndexMap[depId];
        if (fromRowIdx === undefined) return;

        const depTask = scheduledTasks.find(t => t.id === depId);
        if (!depTask) return;

        // x coords are percentages of containerWidth
        const fromX = (depTask.endTime / maxTime) * containerWidth;
        const toX = (task.startTime / maxTime) * containerWidth;

        // y coords: center of each row
        const fromY = fromRowIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;
        const toY = toRowIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;

        lines.push({ key: `${depId}-${task.id}`, fromX, fromY, toX, toY });
      });
    });

    return lines;
  };

  const arrowLines = buildArrowLines();
  const svgHeight = scheduledTasks.length * (ROW_HEIGHT + ROW_GAP);

  return (
    <div className="w-full overflow-x-auto bg-gray-900 p-4 rounded-lg border border-gray-700 mt-6">
      <div className="min-w-[800px]">
        {/* Time Header */}
        <div className="flex mb-2">
          <div className="w-40 flex-shrink-0"></div>
          <div className="flex flex-1 border-b border-gray-700">
            {timeUnits.map(unit => (
              <div key={unit} className="flex-1 text-center text-xs text-gray-500 border-l border-gray-800">
                {unit}h
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows + SVG overlay for dependency arrows */}
        <div className="relative">
          <div ref={trackContainerRef} className="space-y-2">
            {scheduledTasks.map((task) => (
              <div key={task.id} className="flex items-center group" style={{ height: ROW_HEIGHT }}>
                {/* Task Label */}
                <div className="w-40 flex-shrink-0 pr-4 text-sm font-medium text-gray-300 truncate" title={task.text}>
                  {task.text}
                  {task.links && task.links.length > 0 && (
                    <span className="ml-1.5 text-[9px] text-amber-500 font-black">⛓</span>
                  )}
                </div>

                {/* Timeline Track */}
                <div className="relative flex-1 h-8 bg-gray-800/50 rounded overflow-hidden border border-gray-800">
                  {/* Task Bar */}
                  <div
                    className="absolute h-full flex items-center justify-center text-[10px] font-bold text-gray-900 transition-all duration-500 rounded-sm shadow-lg"
                    style={{
                      left: `${(task.startTime / maxTime) * 100}%`,
                      width: `${((task.endTime - task.startTime) / maxTime) * 100}%`,
                      backgroundColor: task.color || '#3db9d3'
                    }}
                  >
                    <span className="truncate px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.startTime}-{task.endTime}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SVG Dependency Arrows Overlay */}
          {arrowLines.length > 0 && containerWidth > 0 && (
            <svg
              className="absolute top-0 pointer-events-none"
              style={{ left: LABEL_WIDTH, width: containerWidth, height: svgHeight }}
            >
              <defs>
                <marker id="dep-arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                </marker>
              </defs>
              {arrowLines.map(({ key, fromX, fromY, toX, toY }) => {
                // Draw a curved path from end of dependency to start of dependent
                const midX = (fromX + toX) / 2;
                return (
                  <path
                    key={key}
                    d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.7"
                    markerEnd="url(#dep-arrowhead)"
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ff4d4d] rounded-sm"></div> Crucial</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ffa64d] rounded-sm"></div> High</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ffff4d] rounded-sm"></div> Medium</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#4dff4d] rounded-sm"></div> Low</div>
        {scheduledTasks.some(t => t.links && t.links.length > 0) && (
          <div className="flex items-center gap-1">
            <svg width="16" height="12"><line x1="0" y1="6" x2="16" y2="6" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            <span className="text-amber-500">Dependency Link</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
