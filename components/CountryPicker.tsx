"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./CountryPicker.module.css";

type Country = { code: string; name: string };
export function CountryPicker({ countries, defaultCountry = "" }: { countries: Country[]; defaultCountry?: string }) {
  const initial = countries.find(country => country.code === defaultCountry);
  const [selected, setSelected] = useState(initial?.code ?? "");
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) { setOpen(false); setActive(-1); } }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selectedName = countries.find(country => country.code === selected)?.name;
  const results = countries.filter(country => !query || query === selectedName || country.name.toLowerCase().includes(query.toLowerCase()) || country.code.toLowerCase() === query.toLowerCase());
  useEffect(() => { input.current?.setCustomValidity(selected ? "" : "Choose a country from the list."); }, [selected]);
  useEffect(() => { if (open && active >= 0) list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [active, open]);
  function choose(country: Country) {
    setSelected(country.code); setQuery(country.name); setOpen(false); setActive(-1);
    input.current?.setCustomValidity(""); input.current?.focus();
  }
  return <div ref={root} className={styles.picker} onKeyDown={event => { if (event.key === "Tab") { setOpen(false); setActive(-1); } }}>
    <label htmlFor={id}>Country of residence</label>
    <div className={styles.control}>
      <input ref={input} id={id} name="countrySearch" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id + "-list"} aria-activedescendant={open && active >= 0 && results[active] ? id + "-" + results[active].code : undefined} autoComplete="off" required placeholder="Search or select your country" value={query}
        onClick={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setSelected(""); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            setActive(index => event.key === "ArrowDown" ? Math.min(index + 1, results.length - 1) : Math.max(0, index - 1));
          } else if (event.key === "Enter" && open) {
            event.preventDefault(); if (results[active]) choose(results[active]);
          } else if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
        }}/>
      <button type="button" aria-label={open ? "Close country list" : "Open country list"} aria-expanded={open} aria-controls={id + "-list"} onClick={() => { setOpen(!open); input.current?.focus(); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <input type="hidden" name="country" value={selected}/>
    <div className={styles.popup} hidden={!open}>
      <div className={styles.caption}>COUNTRY OF RESIDENCE <span>{results.length} available</span></div>
      <ul ref={list} id={id + "-list"} role="listbox" aria-label="Countries" className={styles.list}>
        {results.map((country, index) => <li key={country.code} id={id + "-" + country.code} role="option" aria-selected={selected === country.code} className={index === active ? styles.active : undefined} onMouseDown={event => event.preventDefault()} onClick={() => choose(country)}><span>{country.name}</span><small>{selected === country.code ? "✓" : country.code}</small></li>)}
      </ul>
      {!results.length && <p className={styles.empty} role="status">No countries found. Try another name.</p>}
    </div>
  </div>;
}
