"use client";

import { useState, useRef, useEffect } from "react";

export default function VesselSelector({
  folios,
  activeFolioId,
  loading,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  maxFolios = 10,
}) {
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const dropdownRef = useRef(null);
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);

  const activeFolio = folios.find((f) => f.id === activeFolioId);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setAddMode(false);
        setEditingId(null);
        setConfirmDeleteId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus add input when entering add mode
  useEffect(() => {
    if (addMode && addInputRef.current) addInputRef.current.focus();
  }, [addMode]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  function handleSelect(id) {
    if (id !== activeFolioId) onSwitch(id);
    setOpen(false);
    setEditingId(null);
    setConfirmDeleteId(null);
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
    setAddMode(false);
    setOpen(false);
  }

  function handleRenameSubmit(e, id) {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    onRename(id, trimmed);
    setEditingId(null);
  }

  function handleDelete(id) {
    onDelete(id);
    setConfirmDeleteId(null);
  }

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active vessel display */}
      <button
        onClick={() => setOpen(!open)}
        className="card w-full text-left px-5 py-4 flex items-center justify-between hover:shadow-card-hover transition-shadow"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className="w-5 h-5 text-navy-700 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5h16.5m-16.5 0L5.25 18h13.5l1.5-4.5m-16.5 0L2.25 9l3-3h13.5l3 3-1.5 4.5M6.75 6v3m10.5-3v3"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {activeFolio?.vesselName || "Select Vessel"}
            </p>
            <p className="text-2xs text-slate-400 mt-0.5 tabular-nums">
              {activeFolio
                ? `${activeFolio.charts.length} chart${activeFolio.charts.length !== 1 ? "s" : ""} in folio`
                : "No folio selected"}
              {folios.length > 1 && (
                <span className="text-slate-300">
                  {" "}
                  &middot; {folios.length} vessels
                </span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 card shadow-elevated overflow-hidden animate-slide-down">
          <div className="max-h-72 overflow-y-auto">
            {folios.map((folio) => (
              <div key={folio.id}>
                {editingId === folio.id ? (
                  <form
                    onSubmit={(e) => handleRenameSubmit(e, folio.id)}
                    className="flex items-center gap-2 px-4 py-3 border-b border-slate-100"
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      className="input-field text-sm py-1.5 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      type="submit"
                      className="text-2xs font-medium text-navy-700 hover:text-navy-900 px-2 py-1"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-2xs text-slate-400 hover:text-slate-600 px-2 py-1"
                    >
                      Cancel
                    </button>
                  </form>
                ) : confirmDeleteId === folio.id ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-slate-100">
                    <span className="text-2xs text-red-700">
                      Delete {folio.vesselName}?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(folio.id)}
                        className="text-2xs font-medium text-red-700 hover:text-red-900 px-2 py-1"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-2xs text-slate-400 hover:text-slate-600 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center border-b border-slate-100 group">
                    <button
                      onClick={() => handleSelect(folio.id)}
                      className="flex-1 text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors min-w-0"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          folio.id === activeFolioId
                            ? "bg-navy-700"
                            : "bg-slate-200"
                        }`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm truncate ${
                            folio.id === activeFolioId
                              ? "font-semibold text-navy-900"
                              : "text-slate-700"
                          }`}
                        >
                          {folio.vesselName}
                        </p>
                        <p className="text-2xs text-slate-400 tabular-nums">
                          {folio.charts.length} chart
                          {folio.charts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 pr-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(folio.id);
                          setEditName(folio.vesselName);
                          setConfirmDeleteId(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Rename"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      {folios.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(folio.id);
                            setEditingId(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add vessel form / button */}
          {addMode ? (
            <form
              onSubmit={handleAddSubmit}
              className="flex items-center gap-2 px-4 py-3 bg-slate-50"
            >
              <input
                ref={addInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Vessel name..."
                maxLength={100}
                className="input-field text-sm py-1.5 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAddMode(false);
                    setNewName("");
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="text-2xs font-medium text-navy-700 hover:text-navy-900 px-2 py-1 disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode(false);
                  setNewName("");
                }}
                className="text-2xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Cancel
              </button>
            </form>
          ) : folios.length < maxFolios ? (
            <button
              onClick={() => {
                setAddMode(true);
                setEditingId(null);
                setConfirmDeleteId(null);
              }}
              className="w-full text-left px-4 py-3 flex items-center gap-2 text-sm text-navy-700 hover:bg-slate-50 transition-colors font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Vessel
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
