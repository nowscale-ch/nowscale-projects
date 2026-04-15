import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { PLANNING_CATEGORIES, CATEGORY_COLORS } from '../lib/constants';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTH_FULL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getColorForEvent(ev) {
  if (ev.color && ev.color !== '#0EA5E9') return ev.color;
  return CATEGORY_COLORS[ev.category] || '#0EA5E9';
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonday(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDateShort(s) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

// ── Event Modal ──
function EventModal({ event, defaultDate, projectId, onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: defaultDate || dateStr(new Date()),
    end_date: '',
    category: 'kampagne',
    color: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        start_date: event.start_date || '',
        end_date: event.end_date || '',
        category: event.category || 'kampagne',
        color: event.color || '',
      });
    }
  }, [event]);

  const catColor = CATEGORY_COLORS[form.category] || '#6B7280';

  const handleSave = async () => {
    if (!form.title.trim()) { toast('Titel erforderlich', 'error'); return; }
    if (!form.start_date) { toast('Startdatum erforderlich', 'error'); return; }
    setSaving(true);
    const payload = {
      project_id: projectId,
      title: form.title.trim(),
      description: form.description,
      start_date: form.start_date,
      end_date: form.end_date || null,
      category: form.category,
      color: form.color || catColor,
    };
    if (event?.id) {
      const { error } = await supabase.from('np_planning_events').update(payload).eq('id', event.id);
      if (error) { toast(error.message, 'error'); setSaving(false); return; }
      toast('Event aktualisiert');
    } else {
      const { error } = await supabase.from('np_planning_events').insert(payload);
      if (error) { toast(error.message, 'error'); setSaving(false); return; }
      toast('Event erstellt');
    }
    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    if (!confirm('Event löschen?')) return;
    const { error } = await supabase.from('np_planning_events').delete().eq('id', event.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Event gelöscht');
    onDeleted();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{event?.id ? 'Event bearbeiten' : 'Neues Event'}</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Titel</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Social Media Kampagne" />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details zum Event..." rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Startdatum</label>
              <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Enddatum (optional)</label>
              <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategorie</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, color: '' }))}>
                {PLANNING_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Farbe (auto oder manuell)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.color || catColor} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.color || catColor}</span>
                {form.color && <button className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, color: '' }))}>Reset</button>}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {event?.id && <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginRight: 'auto' }}>Löschen</button>}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip ──
function EventTooltip({ ev, style }) {
  const color = getColorForEvent(ev);
  return (
    <div className="yp-tooltip" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <strong style={{ fontSize: 13 }}>{ev.title}</strong>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: ev.description ? 4 : 0 }}>
        {fmtDateShort(ev.start_date)}{ev.end_date && ev.end_date !== ev.start_date ? ` – ${fmtDateShort(ev.end_date)}` : ''}
      </div>
      {ev.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.description}</div>}
    </div>
  );
}

// ── Year View (Gantt) ──
function YearView({ year, events, onEventClick }) {
  const [hover, setHover] = useState(null);

  // Group events into rows (avoid overlaps)
  const rows = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
    const lanes = [];
    for (const ev of sorted) {
      const s = new Date(ev.start_date + 'T00:00:00');
      const e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
      let placed = false;
      for (const lane of lanes) {
        const last = lane[lane.length - 1];
        const lastEnd = last.end_date ? new Date(last.end_date + 'T00:00:00') : new Date(last.start_date + 'T00:00:00');
        if (s > lastEnd) { lane.push(ev); placed = true; break; }
      }
      if (!placed) lanes.push([ev]);
    }
    return lanes;
  }, [events]);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = Math.round((yearEnd - yearStart) / 86400000) + 1;

  function getPosition(ev) {
    const s = new Date(Math.max(new Date(ev.start_date + 'T00:00:00'), yearStart));
    const e = ev.end_date ? new Date(Math.min(new Date(ev.end_date + 'T00:00:00'), yearEnd)) : s;
    const startDay = Math.round((s - yearStart) / 86400000);
    const span = Math.round((e - s) / 86400000) + 1;
    return { left: `${(startDay / totalDays) * 100}%`, width: `${Math.max((span / totalDays) * 100, 0.5)}%` };
  }

  // Month column positions
  const monthPositions = [];
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(year, m, 1);
    const mDays = daysInMonth(year, m);
    const offset = Math.round((mStart - yearStart) / 86400000);
    monthPositions.push({ left: `${(offset / totalDays) * 100}%`, width: `${(mDays / totalDays) * 100}%` });
  }

  return (
    <div className="yp-year-wrap">
      {/* Month headers */}
      <div className="yp-year-header">
        {MONTH_NAMES.map((m, i) => (
          <div key={i} className="yp-month-col" style={{ left: monthPositions[i].left, width: monthPositions[i].width }}>{m}</div>
        ))}
      </div>
      {/* Grid lines */}
      <div className="yp-year-grid" style={{ minHeight: Math.max(rows.length * 32 + 8, 80) }}>
        {monthPositions.map((pos, i) => (
          <div key={i} className="yp-grid-line" style={{ left: pos.left }} />
        ))}
        {/* Event rows */}
        {rows.map((lane, li) => (
          lane.map(ev => {
            const pos = getPosition(ev);
            const color = getColorForEvent(ev);
            const isSingle = !ev.end_date || ev.end_date === ev.start_date;
            return (
              <div
                key={ev.id}
                className={`yp-bar ${isSingle ? 'yp-bar-dot' : ''}`}
                style={{
                  left: pos.left,
                  width: isSingle ? '16px' : pos.width,
                  top: li * 32 + 4,
                  background: color,
                }}
                onClick={() => onEventClick(ev)}
                onMouseEnter={() => setHover(ev.id)}
                onMouseLeave={() => setHover(null)}
              >
                {!isSingle && <span className="yp-bar-label">{ev.title}</span>}
                {hover === ev.id && <EventTooltip ev={ev} style={{ top: '100%', left: 0, marginTop: 4 }} />}
              </div>
            );
          })
        ))}
        {rows.length === 0 && <div className="yp-empty">Keine Events in {year}</div>}
      </div>
    </div>
  );
}

// ── Quarter View ──
function QuarterView({ year, quarter, events, onEventClick, onDayClick }) {
  const [hover, setHover] = useState(null);
  const startMonth = (quarter - 1) * 3;
  const months = [startMonth, startMonth + 1, startMonth + 2];

  return (
    <div className="yp-quarter-wrap">
      {months.map(m => {
        const days = daysInMonth(year, m);
        const monthEvents = events.filter(ev => {
          const s = new Date(ev.start_date + 'T00:00:00');
          const e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
          const mStart = new Date(year, m, 1);
          const mEnd = new Date(year, m, days);
          return s <= mEnd && e >= mStart;
        });

        return (
          <div key={m} className="yp-q-month">
            <div className="yp-q-month-header">{MONTH_FULL[m]}</div>
            <div className="yp-q-days">
              {Array.from({ length: days }, (_, d) => {
                const date = new Date(year, m, d + 1);
                const ds = dateStr(date);
                const dayEvents = monthEvents.filter(ev => {
                  const s = ev.start_date;
                  const e = ev.end_date || ev.start_date;
                  return ds >= s && ds <= e;
                });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = ds === dateStr(new Date());
                return (
                  <div
                    key={d}
                    className={`yp-q-day ${isWeekend ? 'yp-q-weekend' : ''} ${isToday ? 'yp-q-today' : ''}`}
                    onClick={() => dayEvents.length === 0 ? onDayClick(ds) : null}
                  >
                    <span className="yp-q-day-num">{d + 1}</span>
                    <div className="yp-q-day-events">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          className="yp-q-event-block"
                          style={{ background: getColorForEvent(ev) }}
                          onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                          onMouseEnter={() => setHover(ev.id)}
                          onMouseLeave={() => setHover(null)}
                        >
                          {hover === ev.id && <EventTooltip ev={ev} style={{ bottom: '100%', left: 0, marginBottom: 4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Month View (Calendar Grid) ──
function MonthView({ year, month, events, onEventClick, onDayClick }) {
  const [hover, setHover] = useState(null);
  const days = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1);
  // Monday=0, Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];
  // Padding before
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  // Padding after
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = dateStr(new Date());

  return (
    <div className="yp-month-grid">
      <div className="yp-month-header-row">
        {DAY_NAMES.map(d => <div key={d} className="yp-month-day-header">{d}</div>)}
      </div>
      <div className="yp-month-body">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="yp-month-cell yp-month-empty" />;
          const ds = dateStr(new Date(year, month, d));
          const dayEvents = events.filter(ev => {
            const s = ev.start_date;
            const e = ev.end_date || ev.start_date;
            return ds >= s && ds <= e;
          });
          const isToday = ds === todayStr;
          return (
            <div key={i} className={`yp-month-cell ${isToday ? 'yp-month-today' : ''}`} onClick={() => onDayClick(ds)}>
              <span className="yp-month-cell-num">{d}</span>
              <div className="yp-month-cell-events">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="yp-month-event"
                    style={{ background: getColorForEvent(ev) }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    onMouseEnter={() => setHover(ev.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span className="yp-month-event-label">{ev.title}</span>
                    {hover === ev.id && <EventTooltip ev={ev} style={{ bottom: '100%', left: 0, marginBottom: 4 }} />}
                  </div>
                ))}
                {dayEvents.length > 3 && <span className="yp-month-more">+{dayEvents.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ──
export default function YearPlanning({ projectId }) {
  const toast = useToast();
  const now = new Date();
  const [view, setView] = useState('year'); // year, quarter, month
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null=closed, {event?, defaultDate?}

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('np_planning_events')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date');
    if (error) { toast(error.message, 'error'); return; }
    setEvents(data || []);
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Filter events for current view
  const filteredEvents = useMemo(() => {
    if (view === 'year') {
      return events.filter(ev => {
        const s = new Date(ev.start_date + 'T00:00:00');
        const e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
        return s.getFullYear() <= year && e.getFullYear() >= year;
      });
    }
    if (view === 'quarter') {
      const sm = (quarter - 1) * 3;
      const qStart = new Date(year, sm, 1);
      const qEnd = new Date(year, sm + 3, 0);
      return events.filter(ev => {
        const s = new Date(ev.start_date + 'T00:00:00');
        const e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
        return s <= qEnd && e >= qStart;
      });
    }
    // month
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    return events.filter(ev => {
      const s = new Date(ev.start_date + 'T00:00:00');
      const e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
      return s <= mEnd && e >= mStart;
    });
  }, [events, view, year, quarter, month]);

  const nav = (dir) => {
    if (view === 'year') setYear(y => y + dir);
    else if (view === 'quarter') {
      let q = quarter + dir;
      let y = year;
      if (q < 1) { q = 4; y--; }
      if (q > 4) { q = 1; y++; }
      setQuarter(q);
      setYear(y);
    } else {
      let m = month + dir;
      let y = year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setMonth(m);
      setYear(y);
    }
  };

  const periodLabel = view === 'year' ? `${year}` : view === 'quarter' ? `Q${quarter} ${year}` : `${MONTH_FULL[month]} ${year}`;

  const handleEventClick = (ev) => setModal({ event: ev });
  const handleDayClick = (dateStr) => setModal({ defaultDate: dateStr });
  const closeModal = () => setModal(null);
  const onSaved = () => { setModal(null); loadEvents(); };

  // Category legend
  const legend = PLANNING_CATEGORIES;

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;

  return (
    <div className="yp-container">
      {/* Toolbar */}
      <div className="yp-toolbar">
        <div className="yp-view-switcher">
          <button className={`yp-view-btn ${view === 'year' ? 'active' : ''}`} onClick={() => setView('year')}>Jahr</button>
          <button className={`yp-view-btn ${view === 'quarter' ? 'active' : ''}`} onClick={() => setView('quarter')}>Quartal</button>
          <button className={`yp-view-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Monat</button>
        </div>
        <div className="yp-nav">
          <button className="yp-nav-btn" onClick={() => nav(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="yp-period">{periodLabel}</span>
          <button className="yp-nav-btn" onClick={() => nav(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ defaultDate: dateStr(new Date()) })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Neues Event
        </button>
      </div>

      {/* Legend */}
      <div className="yp-legend">
        {legend.map(c => (
          <span key={c.value} className="yp-legend-item">
            <span className="yp-legend-dot" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>

      {/* Views */}
      {view === 'year' && <YearView year={year} events={filteredEvents} onEventClick={handleEventClick} />}
      {view === 'quarter' && <QuarterView year={year} quarter={quarter} events={filteredEvents} onEventClick={handleEventClick} onDayClick={handleDayClick} />}
      {view === 'month' && <MonthView year={year} month={month} events={filteredEvents} onEventClick={handleEventClick} onDayClick={handleDayClick} />}

      {/* Modal */}
      {modal && (
        <EventModal
          event={modal.event || null}
          defaultDate={modal.defaultDate}
          projectId={projectId}
          onClose={closeModal}
          onSaved={onSaved}
          onDeleted={onSaved}
        />
      )}
    </div>
  );
}
