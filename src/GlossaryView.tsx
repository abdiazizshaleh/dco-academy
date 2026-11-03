import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Search,
  X,
} from "lucide-react";
import { glossary, glossaryCategories, searchGlossary } from "./glossary";
import sources from "../research/sources.json";
export function Glossary({
  selectedId,
  onSelect,
  bookmarks,
  onBookmark,
  notes,
  onNote,
  onLesson,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  bookmarks: string[];
  onBookmark: (id: string) => void;
  notes: Record<string, string>;
  onNote: (id: string, text: string) => void;
  onLesson: (id: string) => void;
}) {
  const [query, Q] = useState("");
  const [category, C] = useState("All");
  const [letter, L] = useState("All");
  const [saved, SB] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const matches = searchGlossary(query, category, letter).filter(
    (e) => !saved || bookmarks.includes("term:" + e.id),
  );
  const selected = matches.find((e) => e.id === selectedId) || matches[0];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  useEffect(() => {
    if (selected && selected.id !== selectedId) onSelect(selected.id);
  }, [selected?.id, selectedId]);
  useEffect(() => {
    const box = list.current;
    const active = box?.querySelector<HTMLElement>("button.selected");
    if (box && active) {
      const item = active.getBoundingClientRect(),
        bounds = box.getBoundingClientRect();
      if (item.top < bounds.top || item.bottom > bounds.bottom)
        box.scrollTop += item.top - bounds.top;
    }
  }, [selected?.id]);
  function choose(id: string) {
    Q("");
    C("All");
    L("All");
    SB(false);
    onSelect(id);
    document.getElementById("term-detail-heading")?.focus();
  }
  return (
    <div className="glossary-workspace">
      <div className="glossary-summary">
        <span className="glossary-total">
          {glossary.length}
          <small>terms, explained</small>
        </span>
        <p>
          Definitions, examples, and the details that are easy to mix up. Save
          useful terms or add your own notes.
        </p>
      </div>
      <div className="glossary-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Search glossary"
            placeholder="Search a term or abbreviation, such as ECC or BMC"
            value={query}
            onChange={(e) => {
              Q(e.target.value);
              L("All");
            }}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear glossary search"
              onClick={() => Q("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <select
          aria-label="Glossary topic"
          value={category}
          onChange={(e) => {
            C(e.target.value);
            L("All");
          }}
        >
          <option value="All">All topics</option>
          {glossaryCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          className={"button secondary " + (saved ? "selected" : "")}
          aria-pressed={saved}
          onClick={() => SB(!saved)}
        >
          <Bookmark size={15} />
          Saved terms
        </button>
      </div>
      <div
        className="glossary-alphabet"
        aria-label="Filter glossary by first letter"
      >
        <button
          className={letter === "All" ? "selected" : ""}
          onClick={() => L("All")}
        >
          All
        </button>
        {alphabet.map((l) => (
          <button
            key={l}
            className={letter === l ? "selected" : ""}
            disabled={!glossary.some((e) => e.term.toUpperCase().startsWith(l))}
            aria-label={`Terms beginning with ${l}`}
            onClick={() => {
              L(l);
              Q("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="glossary-results-label" role="status">
        {matches.length === 0
          ? "No matching terms"
          : `${matches.length} ${matches.length === 1 ? "term" : "terms"}${query ? " matching “" + query + "”" : ""}`}
      </div>
      {matches.length > 0 && selected ? (
        <div className="glossary-layout">
          <div className="glossary-list" ref={list} aria-label="Glossary terms">
            {matches.map((e) => (
              <button
                key={e.id}
                aria-pressed={e.id === selected.id}
                className={e.id === selected.id ? "selected" : ""}
                onClick={() => {
                  onSelect(e.id);
                  if (window.innerWidth <= 700)
                    requestAnimationFrame(() =>
                      document
                        .getElementById("term-detail-heading")
                        ?.scrollIntoView({
                          block: "start",
                          behavior: "smooth",
                        }),
                    );
                }}
              >
                <div>
                  <b>{e.term}</b>
                  <span>{e.expanded || e.category}</span>
                </div>
                {bookmarks.includes("term:" + e.id) ? (
                  <Bookmark size={14} fill="currentColor" />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            ))}
          </div>
          <article className="panel glossary-detail">
            <div className="glossary-detail-top">
              <span className="pill">{selected.category}</span>
              <button
                className="button secondary"
                onClick={() => onBookmark("term:" + selected.id)}
                aria-label={`${bookmarks.includes("term:" + selected.id) ? "Remove bookmark for" : "Bookmark"} ${selected.term}`}
              >
                <Bookmark
                  size={15}
                  fill={
                    bookmarks.includes("term:" + selected.id)
                      ? "currentColor"
                      : "none"
                  }
                />
                {bookmarks.includes("term:" + selected.id)
                  ? "Saved"
                  : "Save term"}
              </button>
            </div>
            <h2 id="term-detail-heading" tabIndex={-1}>
              {selected.term}
            </h2>
            {selected.expanded && (
              <p className="glossary-expanded">{selected.expanded}</p>
            )}
            <p className="glossary-definition">{selected.definition}</p>
            <div className="glossary-example">
              <span>Example</span>
              <p>{selected.example}</p>
            </div>
            <div className="glossary-watch">
              <h3>Easy to mix up</h3>
              <p>{selected.watchFor}</p>
            </div>
            <div className="glossary-actions">
              <button
                className="button primary"
                onClick={() => onLesson(selected.lessonId)}
              >
                <BookOpen size={15} />
                Read the related lesson
                <ArrowRight size={15} />
              </button>
            </div>
            {selected.related.length > 0 && (
              <section className="glossary-related">
                <h3>Related terms</h3>
                <div className="chips">
                  {selected.related.map((id) => {
                    const e = glossary.find((t) => t.id === id)!;
                    return (
                      <button key={id} onClick={() => choose(id)}>
                        {e.term}
                        <ArrowRight size={12} />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            <label className="glossary-notes">
              Your notes
              <textarea
                aria-label={`Notes for ${selected.term}`}
                rows={3}
                value={notes["term:" + selected.id] || ""}
                onChange={(e) => onNote("term:" + selected.id, e.target.value)}
                placeholder="A useful check, an example from your lab, or a question to come back to."
              />
            </label>
            <p className="muted small-text">
              Notes and saved terms use the same storage as the rest of your
              learning progress.
            </p>
            <details className="glossary-sources">
              <summary>Related documentation</summary>
              <p>
                Definitions and examples are written for the academy. These
                references provide more detail; equipment procedures remain
                platform-specific.
              </p>
              {sources
                .filter((sc) => selected.sourceIds.includes(sc.id))
                .map((sc) => (
                  <a key={sc.id} href={sc.url} target="_blank" rel="noreferrer">
                    <span>
                      {sc.title}
                      <small>
                        {sc.publisher} · {sc.type}
                      </small>
                    </span>
                    <ArrowUpRight size={14} />
                  </a>
                ))}
            </details>
          </article>
        </div>
      ) : (
        <div className="panel glossary-empty">
          <Search size={27} />
          <h2>No terms found</h2>
          <p>
            {saved
              ? "Save a term with the bookmark button, or turn off the saved-only filter."
              : "Try a shorter term, a different topic, or clear the letter filter."}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              Q("");
              C("All");
              L("All");
              SB(false);
            }}
          >
            Show all terms
          </button>
        </div>
      )}
    </div>
  );
}
