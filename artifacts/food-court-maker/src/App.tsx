import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Trash2, Move, Store, RotateCcw, Sparkles, Check, ChevronDown } from 'lucide-react';

type FoodStore = { id: string; name: string; color: string; x: number; y: number; width: number; height: number };
const SIZE = 10;
const STORAGE_KEY = 'risou-food-court-v1';
const palette = ['#E98268', '#E9B84E', '#79B79B', '#85AFC4', '#A995C8', '#E58FA6', '#9BAF67', '#CF9A62'];
const presets = [
  { name: 'らーめん', color: '#E98268' }, { name: 'おすし', color: '#85AFC4' },
  { name: 'ハンバーガー', color: '#E9B84E' }, { name: 'うどん', color: '#79B79B' },
  { name: 'カレー', color: '#CF9A62' }, { name: 'アイスクリーム', color: '#E58FA6' },
];

const fits = (store: FoodStore, stores: FoodStore[], omitId?: string) =>
  store.x >= 0 && store.y >= 0 && store.x + store.width <= SIZE && store.y + store.height <= SIZE &&
  !stores.some((other) => other.id !== (omitId ?? store.id) &&
    store.x < other.x + other.width && store.x + store.width > other.x &&
    store.y < other.y + other.height && store.y + store.height > other.y);

export default function App() {
  const [stores, setStores] = useState<FoodStore[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const selected = stores.find((store) => store.id === selectedId) ?? null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { stores?: FoodStore[] };
        if (Array.isArray(parsed.stores)) setStores(parsed.stores);
      }
    } catch { setNotice('保存した内容を読み込めませんでした。'); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ stores })); }, [stores, loaded]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addStore = (preset?: typeof presets[number]) => {
    const name = (preset?.name ?? storeName).trim();
    if (!name) { setNotice('お店の名前を入力してください。'); return; }
    const color = preset?.color ?? palette[stores.length % palette.length];
    let spot: { x: number; y: number } | null = null;
    for (let y = 0; y < SIZE && !spot; y++) for (let x = 0; x < SIZE && !spot; x++) {
      const candidate: FoodStore = { id: '', name, color, x, y, width: 2, height: 2 };
      if (fits(candidate, stores)) spot = { x, y };
    }
    if (!spot) { setNotice('空きスペースがありません。お店を移動するか削除してください。'); return; }
    const next = { id: crypto.randomUUID(), name, color, ...spot, width: 2, height: 2 };
    setStores((current) => [...current, next]);
    setSelectedId(next.id);
    setStoreName('');
    setNotice(`${name}を追加しました。`);
  };

  const updateSelected = (changes: Partial<FoodStore>) => {
    if (!selected) return;
    const next = { ...selected, ...changes };
    if (!fits(next, stores, selected.id)) { setNotice('ほかのお店と重なるか、区画からはみ出します。'); return; }
    setStores((current) => current.map((store) => store.id === selected.id ? next : store));
  };

  const moveToCell = (x: number, y: number) => {
    if (!selected) { setNotice('移動したいお店を先に選んでください。'); return; }
    const next = { ...selected, x, y };
    if (!fits(next, stores, selected.id)) { setNotice('その場所には置けません。別のマスを選んでください。'); return; }
    setStores((current) => current.map((store) => store.id === selected.id ? next : store));
    setNotice(`${selected.name}を移動しました。`);
  };

  const exportPng = () => {
    const cell = 96, padding = 28, canvas = document.createElement('canvas');
    canvas.width = SIZE * cell + padding * 2; canvas.height = SIZE * cell + padding * 2 + 68;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setNotice('画像を作成できませんでした。'); return; }
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#294840'; ctx.font = '700 27px "Zen Maru Gothic", sans-serif';
    ctx.fillText('わたしのフードコート', padding, 45);
    ctx.fillStyle = '#858b78'; ctx.font = '14px "Zen Maru Gothic", sans-serif';
    ctx.fillText(`お店 ${stores.length} 店 ｜ ${SIZE} × ${SIZE} マス`, padding, 70);
    const top = 92;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = '#fffdf7'; ctx.fillRect(padding + x * cell, top + y * cell, cell, cell);
      ctx.strokeStyle = '#e9e2d3'; ctx.lineWidth = 1; ctx.strokeRect(padding + x * cell, top + y * cell, cell, cell);
    }
    stores.forEach((store) => {
      const x = padding + store.x * cell + 4, y = top + store.y * cell + 4;
      const w = store.width * cell - 8, h = store.height * cell - 8;
      ctx.fillStyle = store.color; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
      ctx.fillStyle = '#fffdf7'; ctx.font = '700 19px "Zen Maru Gothic", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lines = store.name.length > 8 ? [store.name.slice(0, 8), store.name.slice(8)] : [store.name];
      lines.forEach((line, index) => ctx.fillText(line, x + w / 2, y + h / 2 + (index - (lines.length - 1) / 2) * 24, w - 16));
    });
    const link = document.createElement('a');
    link.download = 'わたしのフードコート.png'; link.href = canvas.toDataURL('image/png'); link.click();
    setNotice('フードコートの画像を保存しました。');
  };

  const countLabel = useMemo(() => `${stores.length}店`, [stores.length]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="フードコートメーカー ホーム" data-testid="link-home">
          <span className="brand-mark"><Store size={20} strokeWidth={2.5} /></span>
          <span><strong>フードコート</strong><small>メーカー</small></span>
        </a>
        <div className="topbar-note"><span className="live-dot" />あなたの「好き」を並べよう</div>
        <button className="export-button" type="button" onClick={exportPng} data-testid="button-export-png">
          <Download size={17} /><span>画像で保存</span>
        </button>
      </header>

      <section className="intro">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> はじめてでも、かんたん</div>
          <h1>理想のフードコート<br className="mobile-break" />をつくろう。</h1>
          <p>お店をえらんで、マスに置くだけ。あなただけのフードコートができあがります。</p>
        </div>
        <div className="intro-stats" aria-label={`お店${stores.length}店、10列10行`} data-testid="display-plan-summary">
          <span className="stat-number">{countLabel}</span><span className="stat-divider" />
          <span className="stat-number">10<span className="stat-unit">×</span>10</span>
          <span className="stat-caption">のお店スペース</span>
        </div>
      </section>

      <div className="workspace">
        <section className="board-card" aria-label="フードコートの配置図">
          <div className="board-heading">
            <div><span className="section-kicker">わたしのお店づくり</span><h2>お店の配置図</h2></div>
            <div className="board-legend"><span className="legend-dot" />空きマス <span className="legend-store" />お店</div>
          </div>
          <p className="board-instruction" data-testid="text-board-instruction">
            {selected ? <><b>{selected.name}</b>を移動する場所をタップ</> : 'お店を選ぶと、ここに配置できます'}
          </p>
          <div className="board-frame">
            <div className="axis-top" aria-hidden="true">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
            <div className="axis-left" aria-hidden="true">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{String.fromCharCode(65 + i)}</span>)}</div>
            <div className="board-grid" ref={boardRef} role="grid" aria-label="10列10行のお店配置マス">
              {Array.from({ length: SIZE * SIZE }, (_, index) => {
                const x = index % SIZE, y = Math.floor(index / SIZE);
                return <button key={index} type="button" className="grid-cell" aria-label={`${String.fromCharCode(65 + y)}${x + 1}に移動`}
                  onClick={() => moveToCell(x, y)} data-testid={`button-grid-cell-${x}-${y}`} role="gridcell" />;
              })}
              {stores.map((store) => <button type="button" key={store.id}
                className={`store-block ${selectedId === store.id ? 'is-selected' : ''}`}
                style={{ '--store-color': store.color, '--store-x': store.x, '--store-y': store.y, '--store-w': store.width, '--store-h': store.height } as CSSProperties}
                onClick={(event) => { event.stopPropagation(); setSelectedId(store.id); }}
                aria-label={`${store.name}、${store.width}列×${store.height}行${selectedId === store.id ? '、選択中' : ''}`}
                aria-pressed={selectedId === store.id} data-testid={`button-store-block-${store.id}`}>
                <span className="store-name">{store.name}</span><span className="store-size">{store.width} × {store.height}</span>
              </button>)}
              {!stores.length && <div className="board-empty" data-testid="display-empty-plan"><span className="empty-sun">＋</span><strong>最初のお店を置いてみよう</strong><small>左からお店を追加できます</small></div>}
            </div>
          </div>
          <div className="board-foot"><span><Move size={14} />お店を選んでから、置きたいマスをタップ</span><button type="button" onClick={() => { setSelectedId(null); setNotice('選択を解除しました。'); }} data-testid="button-deselect">選択を解除</button></div>
        </section>

        <aside className="tool-panel">
          <section className="panel-section add-section">
            <div className="panel-title-row"><div><span className="section-kicker">まずはここから</span><h2>お店を追加</h2></div><span className="step-number">01</span></div>
            <label className="field-label" htmlFor="store-name">お店の名前</label>
            <form className="add-form" onSubmit={(event) => { event.preventDefault(); addStore(); }}>
              <input id="store-name" value={storeName} onChange={(event) => setStoreName(event.target.value)}
                placeholder="例：まいにち食堂" maxLength={20} data-testid="input-store-name" />
              <button type="submit" aria-label="入力した名前のお店を追加" data-testid="button-add-store"><Plus size={19} /></button>
            </form>
            <div className="preset-heading"><span>人気のお店から選ぶ</span><span className="preset-hint">タップして追加</span></div>
            <div className="preset-list">
              {presets.map((preset) => <button key={preset.name} type="button" className="preset-chip"
                onClick={() => addStore(preset)} data-testid={`button-preset-${preset.name}`}>
                <span className="preset-swatch" style={{ backgroundColor: preset.color }} />{preset.name}<Plus size={14} className="preset-plus" />
              </button>)}
            </div>
          </section>

          <section className={`panel-section edit-section ${selected ? 'has-selection' : ''}`}>
            <div className="panel-title-row"><div><span className="section-kicker">選んだお店を編集</span><h2>お店をととのえる</h2></div><span className="step-number">02</span></div>
            {selected ? <>
              <div className="editing-tag"><span style={{ backgroundColor: selected.color }} />編集中</div>
              <label className="field-label" htmlFor="edit-name">お店の名前</label>
              <input id="edit-name" className="full-input" value={selected.name} maxLength={20}
                onChange={(event) => updateSelected({ name: event.target.value })} data-testid="input-edit-store-name" />
              <div className="field-label color-label">お店の色</div>
              <div className="color-picker" role="group" aria-label="お店の色を選ぶ">
                {palette.map((color, index) => <button type="button" key={color} aria-label={`色 ${index + 1}`}
                  className={`color-option ${selected.color === color ? 'color-active' : ''}`} style={{ backgroundColor: color }}
                  onClick={() => updateSelected({ color })} data-testid={`button-store-color-${index}`}>
                  {selected.color === color && <Check size={14} />}
                </button>)}
              </div>
              <div className="size-fields">
                <label><span>横幅</span><span className="select-wrap"><select value={selected.width}
                  onChange={(event) => updateSelected({ width: Number(event.target.value) })} aria-label="お店の横幅"
                  data-testid="select-store-width">{Array.from({ length: SIZE }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} マス</option>)}</select><ChevronDown size={14} /></span></label>
                <label><span>高さ</span><span className="select-wrap"><select value={selected.height}
                  onChange={(event) => updateSelected({ height: Number(event.target.value) })} aria-label="お店の高さ"
                  data-testid="select-store-height">{Array.from({ length: SIZE }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} マス</option>)}</select><ChevronDown size={14} /></span></label>
              </div>
              <div className="position-display" data-testid="display-store-position"><span>いまの場所</span><strong>{String.fromCharCode(65 + selected.y)}{selected.x + 1}</strong><small>{selected.width} × {selected.height} マス</small></div>
              <button type="button" className="delete-button" onClick={() => {
                setStores((current) => current.filter((store) => store.id !== selected.id)); setSelectedId(null); setNotice(`${selected.name}を削除しました。`);
              }} data-testid="button-delete-store"><Trash2 size={16} />このお店を削除</button>
            </> : <div className="edit-empty" data-testid="display-no-selection"><span className="edit-empty-icon"><Store size={21} /></span><span>配置図のお店をタップすると<br />名前や大きさを変更できます</span></div>}
          </section>
          <div className="panel-tip"><span className="tip-mark">!</span><p>お店はマス目に合わせて配置されます。<br />重なったり、はみ出したりはしません。</p></div>
        </aside>
      </div>
      <footer className="page-footer"><span>あなただけの、おいしい景色。</span><span>つくった配置図はこの端末に自動保存されます</span><button type="button" className="reset-button" onClick={() => {
        if (window.confirm('すべてのお店を削除して、最初からやり直しますか？')) { setStores([]); setSelectedId(null); setNotice('配置図をリセットしました。'); }
      }} data-testid="button-reset-plan"><RotateCcw size={13} />最初からやり直す</button></footer>
      {notice && <div className="toast-message" role="status" aria-live="polite" data-testid="status-notice">{notice}</div>}
    </main>
  );
}
