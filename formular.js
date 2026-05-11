const APP_CONFIG = window.APP_CONFIG || { mode: 'admin' };
const MODE = APP_CONFIG.mode === 'public' ? 'public' : 'admin';
const IS_PUBLIC = MODE === 'public';
const TOKEN = APP_CONFIG.token || null;
const API_URL = window.location.origin;
let IS_FINALIZED = false;

function getFormularName() {
    if (IS_PUBLIC) return APP_CONFIG.formularName || '';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('formularName') || '';
}

function buildSaveUrl() {
    return IS_PUBLIC
        ? `${API_URL}/api/submit/${TOKEN}`
        : `${API_URL}/api/admin/save`;
}

function buildLoadUrl(formularName) {
    return IS_PUBLIC
        ? `${API_URL}/api/submit/${TOKEN}`
        : `${API_URL}/api/admin/load/${encodeURIComponent(formularName)}`;
}

function applyMode() {
    document.body.classList.add('mode-' + MODE);
    if (IS_PUBLIC) {
        document.querySelectorAll('.back-btn').forEach((el) => { el.style.display = 'none'; });
    }
    const formularName = getFormularName();
    const formNameEl = document.getElementById('displayFormName');
    const wrap = document.getElementById('formNameDisplay');
    if (formNameEl && wrap && formularName) {
        formNameEl.textContent = formularName;
        wrap.style.display = 'block';
    }
}

const SECTION_STATE_KEY = 'afaFormularSectionStates';

function loadSectionStates() {
    try {
        return JSON.parse(localStorage.getItem(SECTION_STATE_KEY) || '{}') || {};
    } catch (_e) {
        return {};
    }
}

// Wählt die im aktuellen Modus sichtbare Section-Überschrift.
// Manche Sections (z.B. Bauart) haben zwei <h2>: eine admin-only ("Bauart")
// und eine public-only ("Aufzug"). Toggle und Status-Badge müssen am
// sichtbaren hängen, sonst bleibt der collapsible-Header leer.
function pickActiveSectionHeading(section) {
    const headings = section.querySelectorAll(':scope > h2');
    for (const el of headings) {
        if (IS_PUBLIC && el.classList.contains('admin-only')) continue;
        if (!IS_PUBLIC && el.classList.contains('public-only')) continue;
        return el;
    }
    return headings[0] || null;
}

function saveSectionState(key, collapsed) {
    if (!key) return;
    const states = loadSectionStates();
    states[key] = !!collapsed;
    try {
        localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(states));
    } catch (_e) { /* ignore quota issues */ }
}

function setSectionCollapsed(section, collapsed) {
    section.classList.toggle('collapsed', collapsed);
    const h2 = pickActiveSectionHeading(section);
    if (h2) h2.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function initCollapsibleSections() {
    const states = loadSectionStates();
    document.querySelectorAll('#checklisteForm .section').forEach((section, index) => {
        const h2 = pickActiveSectionHeading(section);
        if (!h2) return;

        if (!section.dataset.sectionKey) {
            section.dataset.sectionKey = 'sec_' + index;
        }
        const key = section.dataset.sectionKey;

        section.classList.add('collapsible');

        const body = document.createElement('div');
        body.className = 'section-body';
        let node = h2.nextSibling;
        while (node) {
            const next = node.nextSibling;
            body.appendChild(node);
            node = next;
        }
        section.appendChild(body);

        const toggle = document.createElement('span');
        toggle.className = 'section-toggle';
        toggle.setAttribute('aria-hidden', 'true');
        toggle.textContent = '▾';
        h2.insertBefore(toggle, h2.firstChild);

        h2.setAttribute('role', 'button');
        h2.setAttribute('tabindex', '0');

        const initiallyCollapsed = states[key] === true;
        setSectionCollapsed(section, initiallyCollapsed);

        const toggleHandler = (event) => {
            if (event && event.target && event.target.closest('input, select, textarea, button, a')) return;
            const willCollapse = !section.classList.contains('collapsed');
            setSectionCollapsed(section, willCollapse);
            saveSectionState(key, willCollapse);
        };

        h2.addEventListener('click', toggleHandler);
        h2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleHandler(e);
            }
        });
    });
}

function toggleAllSections(action) {
    const collapse = action === 'collapse';
    document.querySelectorAll('#checklisteForm .section.collapsible').forEach(section => {
        setSectionCollapsed(section, collapse);
        if (section.dataset.sectionKey) {
            saveSectionState(section.dataset.sectionKey, collapse);
        }
    });
}

// liegenschaftskarte ist admin-only und im Public-Modus nicht aktiv (Card im DOM versteckt
// via .admin-only, zusätzlich aus IMAGE_TYPES rausgefiltert, damit kein Auto-Save / Load
// dafür stattfindet).
const ADMIN_ONLY_IMAGE_TYPES = new Set(['liegenschaftskarte']);
const IMAGE_TYPES = ['hausansicht', 'grundriss', 'liegenschaftskarte']
    .filter((t) => !IS_PUBLIC || !ADMIN_ONLY_IMAGE_TYPES.has(t));
const imageUploadState = {};

function buildImagePreviewUrl(type, version) {
    const formularName = getFormularName();
    if (!formularName) return null;
    const v = encodeURIComponent(version || Date.now());
    if (IS_PUBLIC) {
        return `${API_URL}/api/submit/${TOKEN}/image/${type}?v=${v}`;
    }
    return `${API_URL}/api/admin/image/${encodeURIComponent(formularName)}/${type}?v=${v}`;
}

function getImageCard(type) {
    return document.querySelector(`.image-upload-card[data-image-type="${type}"]`);
}

function getImageEls(type) {
    const card = getImageCard(type);
    if (!card) return null;
    return {
        card,
        preview: card.querySelector('[data-role="preview"]'),
        placeholder: card.querySelector('[data-role="placeholder"]'),
        image: card.querySelector('[data-role="image"]'),
        status: card.querySelector('[data-role="status"]'),
        input: card.querySelector('[data-role="file-input"]'),
        pickText: card.querySelector('[data-role="pick-text"]'),
        discardBtn: card.querySelector('[data-role="discard"]')
    };
}

function formatBytes(size) {
    if (!size && size !== 0) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderImageCard(type) {
    const els = getImageEls(type);
    if (!els) return;
    const state = imageUploadState[type];
    const { pendingFile, pendingPreviewUrl, savedMeta, hasError } = state;

    let previewSrc = null;
    if (pendingFile && pendingPreviewUrl) {
        previewSrc = pendingPreviewUrl;
    } else if (savedMeta && savedMeta.original_name) {
        previewSrc = buildImagePreviewUrl(type, savedMeta.created_at || savedMeta.size || '1');
    }

    if (previewSrc) {
        els.image.onerror = () => {
            els.image.hidden = true;
            els.placeholder.hidden = false;
        };
        els.image.onload = () => {
            els.image.hidden = false;
            els.placeholder.hidden = true;
        };
        els.image.src = previewSrc;
    } else {
        els.image.removeAttribute('src');
        els.image.hidden = true;
        els.placeholder.hidden = false;
    }

    els.status.classList.remove('is-saved', 'is-pending', 'is-error');
    if (hasError) {
        els.status.classList.add('is-error');
        els.status.textContent = '⚠ ' + hasError;
    } else if (pendingFile) {
        els.status.classList.add('is-pending');
        const size = formatBytes(pendingFile.size);
        els.status.textContent = '⏳ Neu ausgewählt: ' + pendingFile.name +
            (size ? ' (' + size + ')' : '') +
            ' — wird automatisch hochgeladen …';
    } else if (savedMeta && savedMeta.original_name) {
        els.status.classList.add('is-saved');
        const size = formatBytes(savedMeta.size);
        els.status.textContent = '✓ Aktuell hochgeladen: ' + savedMeta.original_name +
            (size ? ' (' + size + ')' : '');
    } else {
        els.status.textContent = 'Noch kein Bild hochgeladen';
    }

    const hasAny = !!(pendingFile || savedMeta);
    els.pickText.textContent = hasAny ? 'Bild ersetzen' : 'Datei auswählen';
    els.discardBtn.hidden = !pendingFile;
}

function clearPendingImage(type, options = {}) {
    const { skipAutoSave = false } = options;
    const state = imageUploadState[type];
    if (!state) return;
    const hadPending = !!state.pendingFile;
    if (state.pendingPreviewUrl) {
        URL.revokeObjectURL(state.pendingPreviewUrl);
    }
    state.pendingFile = null;
    state.pendingPreviewUrl = null;
    state.hasError = null;
    const els = getImageEls(type);
    if (els && els.input) els.input.value = '';
    renderImageCard(type);
    // Wenn ein bereits ausgewaehltes Bild verworfen wird, sofort speichern,
    // damit der Server-Stand mit der UI uebereinstimmt.
    if (hadPending && !skipAutoSave) {
        try { flushAutoSave(); } catch (_e) { /* autosave noch nicht initialisiert */ }
    }
}

function setSavedImageMeta(type, meta) {
    const state = imageUploadState[type] || (imageUploadState[type] = {});
    if (state.pendingPreviewUrl) {
        URL.revokeObjectURL(state.pendingPreviewUrl);
    }
    state.pendingFile = null;
    state.pendingPreviewUrl = null;
    state.hasError = null;
    state.savedMeta = meta || null;
    const els = getImageEls(type);
    if (els && els.input) els.input.value = '';
    renderImageCard(type);
}

function handleImageSelect(type, file) {
    const state = imageUploadState[type] || (imageUploadState[type] = {});
    if (state.pendingPreviewUrl) {
        URL.revokeObjectURL(state.pendingPreviewUrl);
        state.pendingPreviewUrl = null;
    }
    state.hasError = null;
    if (!file) {
        state.pendingFile = null;
        renderImageCard(type);
        return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
        state.pendingFile = null;
        state.hasError = 'Bitte eine Bilddatei auswählen.';
        const els = getImageEls(type);
        if (els && els.input) els.input.value = '';
        renderImageCard(type);
        return;
    }
    state.pendingFile = file;
    state.pendingPreviewUrl = URL.createObjectURL(file);
    renderImageCard(type);
    // Bild sofort hochladen — kein Debounce, damit das Bild auch
    // wirklich beim Server ankommt, bevor der User die Seite schliesst.
    try { flushAutoSave(); } catch (_e) { /* autosave noch nicht initialisiert */ }
}

function assignFileToInput(input, file) {
    try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        return true;
    } catch (_e) {
        return false;
    }
}

function initImageUploads() {
    IMAGE_TYPES.forEach((type) => {
        imageUploadState[type] = {
            pendingFile: null,
            pendingPreviewUrl: null,
            savedMeta: null,
            hasError: null
        };
        const els = getImageEls(type);
        if (!els) return;

        els.input.addEventListener('change', (e) => {
            const file = (e.target.files && e.target.files[0]) || null;
            handleImageSelect(type, file);
        });

        els.preview.addEventListener('click', (e) => {
            if (e.target.closest('button, a')) return;
            els.input.click();
        });

        els.discardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearPendingImage(type);
        });

        ['dragenter', 'dragover'].forEach((evt) => {
            els.preview.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                els.card.classList.add('is-dragover');
            });
        });
        ['dragleave', 'drop'].forEach((evt) => {
            els.preview.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                els.card.classList.remove('is-dragover');
            });
        });
        els.preview.addEventListener('drop', (e) => {
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (!file) return;
            if (assignFileToInput(els.input, file)) {
                handleImageSelect(type, file);
            }
        });

        renderImageCard(type);
    });
}

function applySavedImageMetaFromResponse(payload, sentImages) {
    const sent = sentImages || {};
    IMAGE_TYPES.forEach((type) => {
        if (!Object.prototype.hasOwnProperty.call(payload || {}, type)) return;
        const state = imageUploadState[type];
        // Falls in der Zwischenzeit ein NEUES Bild ausgewaehlt wurde
        // (anderes File-Object als beim Save-Start), nur savedMeta
        // aktualisieren und das pending-File stehen lassen — der naechste
        // Save laedt es hoch.
        const pendingChanged = state && state.pendingFile && state.pendingFile !== sent[type];
        if (pendingChanged) {
            state.savedMeta = payload[type] || null;
            renderImageCard(type);
        } else {
            setSavedImageMeta(type, payload[type]);
        }
    });
}

// ---------- Anlage-Bilder (admin-only) ----------
// Beliebig viele zusaetzliche Bilder der Ortsbegehung mit Bildunterschrift.
// State haelt die Anzeige-Reihenfolge — wird beim Auto-Save als
// formData.anlage_bilder = [{id, caption}, ...] persistiert. Backing-Files
// liegen in der files-Tabelle und werden ueber separate Endpunkte hoch-/
// gelaedt.
const anlageState = {
    items: [], // [{id, original_name, mime_type, size, created_at, caption}]
    initialized: false
};

function getAnlageBilderForFormData() {
    return anlageState.items.map((it) => ({ id: it.id, caption: it.caption || '' }));
}

function buildAnlageBaseUrl() {
    if (IS_PUBLIC) {
        if (!TOKEN) return null;
        return `${API_URL}/api/submit/${encodeURIComponent(TOKEN)}/anlage`;
    }
    const formularName = getFormularName();
    if (!formularName) return null;
    return `${API_URL}/api/admin/anlage/${encodeURIComponent(formularName)}`;
}

function buildAnlagePreviewUrl(id, version) {
    const base = buildAnlageBaseUrl();
    if (!base) return null;
    const v = encodeURIComponent(version || Date.now());
    return `${base}/${encodeURIComponent(id)}/preview?v=${v}`;
}

function setAnlageStatus(text, isError) {
    const el = document.getElementById('anlageStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
}

function renderAnlageList() {
    const container = document.getElementById('anlageList');
    if (!container) return;
    container.innerHTML = '';
    anlageState.items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'anlage-item';
        row.dataset.anlageId = item.id;

        const thumb = document.createElement('div');
        thumb.className = 'anlage-thumb';
        const img = document.createElement('img');
        img.alt = 'Anlage-Bild ' + (idx + 1);
        img.src = buildAnlagePreviewUrl(item.id, item.created_at || item.size || idx);
        img.onerror = () => {
            img.remove();
            const fb = document.createElement('div');
            fb.className = 'anlage-thumb-fallback';
            fb.textContent = 'Vorschau nicht verfügbar';
            thumb.appendChild(fb);
        };
        thumb.appendChild(img);

        const meta = document.createElement('div');
        meta.className = 'anlage-meta';

        if (item.original_name) {
            const name = document.createElement('div');
            name.className = 'anlage-name';
            name.textContent = `Bild ${idx + 1}: ${item.original_name}`;
            meta.appendChild(name);
        }

        const captionEl = document.createElement('textarea');
        captionEl.className = 'anlage-caption';
        captionEl.rows = 2;
        captionEl.placeholder = 'Bildunterschrift (z.B. „Frontansicht von Norden")';
        captionEl.value = item.caption || '';
        captionEl.addEventListener('input', () => {
            item.caption = captionEl.value;
            scheduleAutoSave();
        });
        meta.appendChild(captionEl);

        const actions = document.createElement('div');
        actions.className = 'anlage-actions';

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.textContent = '↑ Hoch';
        upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', () => moveAnlage(idx, -1));
        actions.appendChild(upBtn);

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.textContent = '↓ Runter';
        downBtn.disabled = idx === anlageState.items.length - 1;
        downBtn.addEventListener('click', () => moveAnlage(idx, +1));
        actions.appendChild(downBtn);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'anlage-remove';
        removeBtn.textContent = 'Entfernen';
        removeBtn.addEventListener('click', () => removeAnlage(item.id));
        actions.appendChild(removeBtn);

        meta.appendChild(actions);

        row.appendChild(thumb);
        row.appendChild(meta);
        container.appendChild(row);
    });
}

function moveAnlage(idx, delta) {
    const target = idx + delta;
    if (target < 0 || target >= anlageState.items.length) return;
    const [moved] = anlageState.items.splice(idx, 1);
    anlageState.items.splice(target, 0, moved);
    renderAnlageList();
    scheduleAutoSave();
}

async function uploadAnlage(file) {
    const base = buildAnlageBaseUrl();
    if (!base) {
        setAnlageStatus(IS_PUBLIC ? 'Link ist ungültig — Upload nicht möglich.' : 'Kein Formularname — Upload nicht möglich.', true);
        return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
        setAnlageStatus('Bitte eine Bilddatei auswählen.', true);
        return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setAnlageStatus(`Lade „${file.name}" hoch …`);
    try {
        const resp = await fetch(base, {
            method: 'POST',
            body: fd
        });
        const result = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            setAnlageStatus('Fehler: ' + (result.error || resp.statusText), true);
            return;
        }
        anlageState.items.push({
            id: result.id,
            original_name: result.original_name,
            mime_type: result.mime_type,
            size: result.size,
            created_at: result.created_at,
            caption: ''
        });
        renderAnlageList();
        setAnlageStatus(`„${file.name}" hochgeladen.`);
        // Reihenfolge sofort persistieren, damit Anlage-Liste in formData synchron bleibt
        flushAutoSave();
    } catch (error) {
        console.error('Anlage upload error:', error);
        setAnlageStatus('Upload fehlgeschlagen: ' + error.message, true);
    }
}

function removeAnlage(id) {
    const base = buildAnlageBaseUrl();
    if (!base) return;
    confirmAction('Dieses Anlage-Bild wirklich entfernen?', async () => {
        setAnlageStatus('Anlage-Bild wird gelöscht …');
        try {
            const resp = await fetch(`${base}/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            const result = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                setAnlageStatus('Fehler: ' + (result.error || resp.statusText), true);
                return;
            }
            anlageState.items = anlageState.items.filter((it) => it.id !== id);
            renderAnlageList();
            setAnlageStatus('Anlage-Bild entfernt.');
            flushAutoSave();
        } catch (error) {
            console.error('Anlage delete error:', error);
            setAnlageStatus('Löschen fehlgeschlagen: ' + error.message, true);
        }
    });
}

function applyAnlageMeta(serverList, formDataAnlageBilder) {
    // Server liefert die existierenden Files (id, original_name, ...).
    // formData.anlage_bilder bestimmt die Reihenfolge + Captions.
    const byId = new Map();
    (serverList || []).forEach((m) => { if (m && m.id) byId.set(m.id, m); });
    const orderedIds = new Set();
    const next = [];
    (formDataAnlageBilder || []).forEach((entry) => {
        if (!entry || typeof entry.id !== 'string') return;
        const meta = byId.get(entry.id);
        if (!meta) return; // Datei wurde geloescht — Caption-Eintrag fallen lassen
        next.push(Object.assign({}, meta, { caption: entry.caption || '' }));
        orderedIds.add(entry.id);
    });
    // Files, die hochgeladen aber noch nicht in formData.anlage_bilder gelistet sind
    // (z.B. nach einem Upload-Crash), als Tail anhaengen mit leerer Caption.
    (serverList || []).forEach((m) => {
        if (!m || !m.id || orderedIds.has(m.id)) return;
        next.push(Object.assign({}, m, { caption: '' }));
    });
    anlageState.items = next;
    renderAnlageList();
}

function initAnlageUI() {
    const addInput = document.getElementById('anlageAddInput');
    if (!addInput) return;
    addInput.addEventListener('change', async (e) => {
        const file = (e.target.files && e.target.files[0]) || null;
        if (!file) return;
        await uploadAnlage(file);
        addInput.value = '';
    });
    anlageState.initialized = true;
}

function collectFormData() {
    const form = document.getElementById('checklisteForm');
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        if (key === 'files' || key === 'file' || value instanceof File) {
            continue;
        }
        if (data[key]) {
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }

    // Anlage-Bilder werden in beiden Modi aus dem JS-State persistiert
    // (Reihenfolge + Captions). Files selbst liegen in der files-Tabelle
    // und werden ueber separate Upload-/Delete-Endpunkte verwaltet.
    data.anlage_bilder = getAnlageBilderForFormData();

    return data;
}

// ---------- Auto-Save ----------
// Jede Aenderung im Formular wird automatisch gespeichert. Es gibt keinen
// manuellen Speichern-Button mehr. Form-Inputs werden debounced (kurze
// Tipp-Pause), Bilder und Geocoding-Uebernahme werden sofort geflusht.
const AUTOSAVE_DEBOUNCE_MS = 800;
let autoSaveTimer = null;
let autoSaveInFlight = false;
let autoSaveResaveQueued = false;

function setAutoSaveStatus(state, text) {
    const el = document.getElementById('autoSaveStatus');
    if (!el) return;
    el.dataset.state = state;
    const iconEl = el.querySelector('.auto-save-icon');
    const textEl = el.querySelector('.auto-save-text');
    const icons = { saved: '✓', saving: '💾', error: '⚠' };
    if (iconEl) iconEl.textContent = icons[state] || '';
    if (textEl) textEl.textContent = text;
}

function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    setAutoSaveStatus('saving', 'Änderungen werden gespeichert …');
    autoSaveTimer = setTimeout(triggerAutoSave, AUTOSAVE_DEBOUNCE_MS);
}

function flushAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    triggerAutoSave();
}

async function triggerAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (autoSaveInFlight) {
        autoSaveResaveQueued = true;
        return;
    }
    autoSaveInFlight = true;
    try {
        await saveData();
    } finally {
        autoSaveInFlight = false;
        if (autoSaveResaveQueued) {
            autoSaveResaveQueued = false;
            triggerAutoSave();
        }
    }
}

async function saveData() {
    const form = document.getElementById('checklisteForm');
    if (!form) return;
    // Nach Finalisierung darf der Klient nichts mehr senden.
    if (IS_PUBLIC && IS_FINALIZED) return;
    const formularName = getFormularName();
    if (!formularName) {
        setAutoSaveStatus('error', IS_PUBLIC ? 'Link ist ungültig — Speichern nicht möglich.' : 'Kein Formularname — Speichern nicht möglich.');
        return;
    }

    const fields = collectFormData();
    fields.formularName = formularName;

    const formData = new FormData(form);
    formData.delete('id');
    formData.delete('fields');
    if (!IS_PUBLIC) formData.set('id', formularName);
    formData.set('fields', JSON.stringify(fields));

    // Snapshot der pending-Bilder beim Save-Start, damit wir nach
    // Server-Antwort entscheiden koennen, ob in der Zwischenzeit ein
    // NEUES Bild ausgewaehlt wurde (das dann nicht verloren gehen darf).
    const sentImages = {};
    IMAGE_TYPES.forEach((type) => {
        const state = imageUploadState[type];
        if (state && state.pendingFile) sentImages[type] = state.pendingFile;
    });

    setAutoSaveStatus('saving', 'Wird gespeichert …');
    try {
        const response = await fetch(buildSaveUrl(), {
            method: 'POST',
            body: formData
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok) {
            applySavedImageMetaFromResponse(result, sentImages);
            setAutoSaveStatus('saved', 'Alle Änderungen automatisch gespeichert.');
            try { updateProgressBar(); } catch (_e) { /* widget noch nicht initialisiert */ }
        } else if (response.status === 403 && result && result.finalized) {
            applyFinalizedState(true);
            setAutoSaveStatus('error', 'Das Formular wurde final abgeschickt. Änderungen sind nicht mehr möglich.');
        } else {
            setAutoSaveStatus('error', 'Fehler beim Speichern: ' + (result.error || response.statusText));
        }
    } catch (error) {
        console.error('Save error:', error);
        setAutoSaveStatus('error', 'Fehler beim Speichern: ' + error.message);
    }
}

async function loadCurrentForm(options = {}) {
    const { silentNotFound = false } = options;
    const formularName = getFormularName();
    if (!formularName) return;
    try {
        const response = await fetch(buildLoadUrl(formularName));
        if (!response.ok) {
            if (response.status === 404 && silentNotFound) return;
            const data = await response.json().catch(() => ({}));
            showToast(`Fehler: ${data.error || response.statusText}`, 'error');
            return;
        }
        const data = await response.json();
        const form = document.getElementById('checklisteForm');
        const formData = data.data || {};
        form.reset();

        // Migration alter Checkbox-Werte auf neue ja/nein-Radios.
        // Why: Vorhandene Submissions speicherten z.B. bauart_dach='zusaetzlich_gedaemmt';
        // ohne Mapping würde der Wert nach UI-Umstellung nicht mehr matchen und still verloren gehen.
        const fassadeAlt = formData.bauart_fassade;
        if (fassadeAlt !== undefined) {
            const arr = Array.isArray(fassadeAlt) ? fassadeAlt : [fassadeAlt];
            if (arr.includes('zusaetzliche_daemmung')) formData.bauart_fassade_daemmung = 'ja';
            if (arr.includes('putz')) formData.bauart_fassade_putz = 'ja';
            if (arr.includes('verkleidung')) formData.bauart_fassade_verkleidung = 'ja';
            delete formData.bauart_fassade;
        }
        if (formData.bauart_kellerdecke === 'gedaemmt') formData.bauart_kellerdecke = 'ja';
        if (formData.bauart_dach === 'zusaetzlich_gedaemmt') formData.bauart_dach = 'ja';
        if (formData.bauart_fenster_verglasung === '2fach') formData.bauart_fenster_verglasung = 'ja';

        Object.keys(formData).forEach(key => {
            const elements = form.querySelectorAll(`[name="${CSS.escape(key)}"]`);
            if (formData[key] instanceof Array) {
                formData[key].forEach(value => {
                    elements.forEach(el => {
                        if ((el.type === 'checkbox' || el.type === 'radio') && el.value === value) {
                            el.checked = true;
                        }
                    });
                });
            } else {
                elements.forEach(el => {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        if (el.value === formData[key]) el.checked = true;
                    } else {
                        el.value = formData[key];
                    }
                });
            }
        });

        ['solar_bj_1', 'pv_bj', 'aufzug_baujahr', 'stellplaetze_anzahl'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
                field.disabled = false;
            }
        });

        applySavedImageMetaFromResponse(data);
        if (Array.isArray(data.anlage)) {
            applyAnlageMeta(data.anlage, formData.anlage_bilder);
        }
        toggleVornameByAnrede();
        setAutoSaveStatus('saved', 'Alle Änderungen werden automatisch gespeichert.');
        try { updateProgressBar(); } catch (_e) { /* widget noch nicht initialisiert */ }
        if (!IS_PUBLIC) {
            try { refreshToolDeeplinks(); } catch (_e) { /* tools nicht initialisiert */ }
        }
        if (IS_PUBLIC) {
            applyFinalizedState(!!data.finalized);
        }
    } catch (error) {
        console.error('Load error:', error);
        showToast('Fehler beim Laden: ' + error.message, 'error');
    }
}

function resetData() {
    confirmAction('Alle Felder zurücksetzen?', () => {
        document.getElementById('checklisteForm').reset();
        IMAGE_TYPES.forEach((type) => clearPendingImage(type, { skipAutoSave: true }));
        toggleVornameByAnrede();
        try { updateProgressBar(); } catch (_e) { /* widget noch nicht initialisiert */ }
        flushAutoSave();
    });
}

function toggleBjField(fieldId, isActive) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.disabled = !isActive;
    if (!isActive) {
        field.value = '';
    }
}

// Vorname-Feld: bei Anrede "Firma" ausgrauen + nicht beschreibbar.
function toggleVornameByAnrede() {
    const anrede = document.getElementById('auftraggeber_anrede');
    const vorname = document.getElementById('vorname');
    if (!anrede || !vorname) return;
    const isFirma = anrede.value === 'firma';
    vorname.disabled = isFirma;
    if (isFirma) vorname.value = '';
}

// ---------- Pflichtfelder & Fortschrittsanzeige ----------
// Quelle der Wahrheit: gemeinsames Modul `required-fields.js` (siehe window.RequiredFields).

// Aktuelle Form-Werte als flaches {name: string|array}-Objekt.
function getCurrentFormDataObject() {
    const form = document.getElementById('checklisteForm');
    if (!form) return {};
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        if (data[k] !== undefined) {
            if (!Array.isArray(data[k])) data[k] = [data[k]];
            data[k].push(v);
        } else {
            data[k] = v;
        }
    }
    return data;
}

// Aktueller Bilder-Status: pending = "ausgewaehlt aber nicht gespeichert" zaehlt
// im Frontend als ausgefuellt (UX), serverseitig zaehlt nur die persistierte Datei.
function getCurrentImagesObject() {
    const out = {};
    IMAGE_TYPES.forEach((type) => { out[type] = null; });
    IMAGE_TYPES.forEach((type) => {
        const state = imageUploadState[type];
        if (!state) return;
        if (state.pendingFile) {
            out[type] = { original_name: state.pendingFile.name, size: state.pendingFile.size };
        } else if (state.savedMeta && state.savedMeta.original_name) {
            out[type] = state.savedMeta;
        }
    });
    return out;
}

// Visuellen Container fuer rote Markierung finden
function getFieldVisualContainer(field) {
    if (field.type === 'image') {
        return document.querySelector(`.image-upload-card[data-image-type="${field.name}"]`);
    }
    const form = document.getElementById('checklisteForm');
    const els = form.querySelectorAll(`[name="${CSS.escape(field.name)}"]`);
    if (!els.length) return null;
    const firstEl = els[0];

    if (field.type === 'radio') {
        return firstEl.closest('.bauart-row')
            || firstEl.closest('.subcard')
            || firstEl.closest('.form-group')
            || firstEl.closest('.radio-group')
            || firstEl;
    }
    // Text/Date/Number/Select/Textarea: das Element selbst
    return firstEl;
}

function clearAllFieldHighlights() {
    document.querySelectorAll('.required-empty').forEach((el) => el.classList.remove('required-empty'));
    document.querySelectorAll('.required-empty-group').forEach((el) => el.classList.remove('required-empty-group'));
    document.querySelectorAll('.required-empty-image').forEach((el) => el.classList.remove('required-empty-image'));
}

function updateFieldHighlights(missingList) {
    clearAllFieldHighlights();
    (missingList || []).forEach((field) => {
        const container = getFieldVisualContainer(field);
        if (!container) return;
        if (field.type === 'image') {
            container.classList.add('required-empty-image');
        } else if (field.type === 'radio') {
            container.classList.add('required-empty-group');
        } else {
            container.classList.add('required-empty');
        }
    });
}

// Status-Badge je Sektion (rechts im h2). Nur sichtbar wenn die Sektion
// zugeklappt ist (CSS) und nur fuer Sektionen mit mindestens einem Pflichtfeld.
function updateSectionStatuses(allRequired, missingList) {
    const sections = document.querySelectorAll('#checklisteForm .section[data-section-key]');
    sections.forEach((section) => {
        const key = section.dataset.sectionKey;
        const h2 = pickActiveSectionHeading(section);
        if (!h2) return;

        const sectionRequiredCount = allRequired.filter((f) => f.section === key).length;
        const sectionMissingCount = (missingList || []).filter((f) => f.section === key).length;

        let badge = h2.querySelector(':scope > .section-status');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'section-status';
            h2.appendChild(badge);
        }

        const isOptional = sectionRequiredCount === 0;
        const isComplete = !isOptional && sectionMissingCount === 0;
        badge.classList.toggle('is-optional', isOptional);
        badge.classList.toggle('is-complete', isComplete);
        badge.classList.toggle('is-incomplete', !isOptional && !isComplete);

        if (isOptional) {
            badge.innerHTML = 'optional';
        } else if (isComplete) {
            badge.innerHTML = '<span class="section-status-icon" aria-hidden="true">✓</span> vollständig';
        } else {
            const verb = sectionMissingCount === 1 ? 'fehlt' : 'fehlen';
            badge.innerHTML = '<span class="section-status-icon" aria-hidden="true">⚠</span> ' + sectionMissingCount + ' ' + verb;
        }
    });
}

function expandSectionByKey(sectionKey) {
    const sectionEl = document.querySelector(`#checklisteForm [data-section-key="${sectionKey}"]`);
    if (!sectionEl) return null;
    if (sectionEl.classList.contains('collapsed')) {
        setSectionCollapsed(sectionEl, false);
        if (sectionEl.dataset.sectionKey) {
            saveSectionState(sectionEl.dataset.sectionKey, false);
        }
    }
    return sectionEl;
}

function jumpToField(sectionKey, fieldName, isImage) {
    const sectionEl = expandSectionByKey(sectionKey);
    if (!sectionEl) return;

    let target = null;
    if (isImage) {
        target = document.querySelector(`.image-upload-card[data-image-type="${fieldName}"]`);
    } else {
        target = sectionEl.querySelector(`[name="${CSS.escape(fieldName)}"]`);
    }

    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const highlightEl = target.closest('.form-group') || target.closest('.bauart-row') || target.closest('.image-upload-card') || target;
        highlightEl.classList.remove('field-highlight');
        // Force reflow, damit Animation neu startet
        void highlightEl.offsetWidth;
        highlightEl.classList.add('field-highlight');
        if (typeof target.focus === 'function' && !isImage) {
            setTimeout(() => { try { target.focus({ preventScroll: true }); } catch (_e) { /* ignore focus errors */ } }, 350);
        }
    } else {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Befüllt einen einzelnen Fortschritts-Balken (Kunde oder Gutachter).
// ids: { fill, percent, status, statusText, missingWrap, missingList, bar }
// labels: { kindSingular, kindPlural } — z.B. "Pflichtangabe" / "Pflichtangaben"
function renderProgressWidget(progress, ids, labels) {
    const { total, filled, missing, percent, isComplete } = progress;
    const fillEl = document.getElementById(ids.fill);
    const percentEl = document.getElementById(ids.percent);
    const statusEl = document.getElementById(ids.status);
    const statusText = document.getElementById(ids.statusText);
    const missingEl = document.getElementById(ids.missingWrap);
    const missingList = document.getElementById(ids.missingList);
    const bar = fillEl ? fillEl.parentElement : null;

    if (fillEl) {
        fillEl.style.width = percent + '%';
        fillEl.classList.toggle('is-complete', isComplete);
    }
    if (percentEl) percentEl.textContent = percent + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(percent));

    if (statusEl) {
        statusEl.classList.toggle('is-complete', isComplete);
        statusEl.classList.toggle('is-incomplete', !isComplete);
        const icon = statusEl.querySelector('.progress-status-icon');
        if (icon) icon.textContent = isComplete ? '✓' : '⚠';
    }
    if (statusText) {
        if (isComplete) {
            statusText.innerHTML = `Alle <strong>${total}</strong> ${labels.kindPlural} sind ausgefüllt.`;
        } else {
            const ein = missing.length === 1 ? '' : 'n';
            statusText.innerHTML = `<strong>${filled}</strong> von <strong>${total}</strong> ${labels.kindPlural} ausgefüllt &middot; es fehlen noch <strong>${missing.length}</strong> Angabe${ein}.`;
        }
    }

    if (missingEl && missingList) {
        if (missing.length === 0) {
            missingEl.hidden = true;
            missingList.innerHTML = '';
        } else {
            missingEl.hidden = false;
            const max = 12;
            const items = missing.slice(0, max).map((f) => {
                const isImg = f.type === 'image' ? 'true' : 'false';
                const safeLabel = (f.label || f.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<a class="progress-missing-link" onclick="jumpToField('${f.section}','${f.name}',${isImg})">${safeLabel}</a>`;
            });
            const more = missing.length > max ? `<span class="progress-missing-more">+ ${missing.length - max} weitere</span>` : '';
            missingList.innerHTML = items.join(' &middot; ') + (more ? ' &middot; ' + more : '');
        }
    }
}

function updateProgressBar() {
    const data = getCurrentFormDataObject();
    const images = getCurrentImagesObject();

    // Kunden-Pflichtangaben (immer sichtbar, auch im Public-Link)
    const progress = window.RequiredFields.computeProgress(data, images);
    renderProgressWidget(progress, {
        fill: 'progressBarFill',
        percent: 'progressPercent',
        status: 'progressStatus',
        statusText: 'progressStatusText',
        missingWrap: 'progressMissing',
        missingList: 'progressMissingList'
    }, { kindSingular: 'Pflichtangabe', kindPlural: 'Pflichtangaben' });

    // Gutachter-Angaben (nur Admin-Modus); im Public-Mode ist das Widget per CSS versteckt
    let progressExpert = null;
    if (!IS_PUBLIC) {
        progressExpert = window.RequiredFields.computeExpertProgress(data, images);
        renderProgressWidget(progressExpert, {
            fill: 'progressBarFillExpert',
            percent: 'progressPercentExpert',
            status: 'progressStatusExpert',
            statusText: 'progressStatusTextExpert',
            missingWrap: 'progressMissingExpert',
            missingList: 'progressMissingListExpert'
        }, { kindSingular: 'Gutachter-Angabe', kindPlural: 'Gutachter-Angaben' });
        updateDownloadReadiness(progress, progressExpert);
    }

    // Rote Umrandung der noch leeren Felder (Kunde + Gutachter zusammen)
    const allMissing = progress.missing.concat(progressExpert ? progressExpert.missing : []);
    updateFieldHighlights(allMissing);

    // Status-Badge je Sektion: Kunden-Felder im Public-Mode,
    // beide Listen kombiniert im Admin-Mode (auf Section-Ebene zusammengeführt).
    const allRequired = window.RequiredFields.getAllRequiredFields(data);
    const allFieldsForBadges = IS_PUBLIC
        ? allRequired
        : allRequired.concat(window.RequiredFields.getAllExpertFields(data));
    updateSectionStatuses(allFieldsForBadges, allMissing);
}

// Gesamtstatus für Word-Download (nur Admin-Modus).
// Word-Dokument gilt erst als vollständig, wenn Kunden- UND Gutachter-Angaben komplett sind.
function updateDownloadReadiness(progress, progressExpert) {
    const wrap = document.getElementById('downloadReadiness');
    const text = document.getElementById('downloadReadinessText');
    if (!wrap || !text) return;
    const missingTotal = (progress ? progress.missing.length : 0) + (progressExpert ? progressExpert.missing.length : 0);
    const isReady = missingTotal === 0;
    wrap.classList.toggle('is-ready', isReady);
    wrap.classList.toggle('is-not-ready', !isReady);
    const icon = wrap.querySelector('.download-readiness-icon');
    if (icon) icon.textContent = isReady ? '✓' : '⚠';
    if (isReady) {
        text.innerHTML = 'Word-Download: <strong>Alle Angaben sind vollständig.</strong> Das Gutachten kann erstellt werden.';
    } else {
        const ein = missingTotal === 1 ? '' : 'n';
        text.innerHTML = `Word-Download: Es fehlen insgesamt noch <strong>${missingTotal}</strong> Angabe${ein} (Kunde + Gutachter).`;
    }
}

function attachProgressListeners() {
    const form = document.getElementById('checklisteForm');
    if (!form) return;
    ['input', 'change'].forEach((evt) => {
        form.addEventListener(evt, () => {
            updateProgressBar();
            scheduleAutoSave();
        });
    });
    const anrede = document.getElementById('auftraggeber_anrede');
    if (anrede) {
        anrede.addEventListener('change', toggleVornameByAnrede);
    }
}

// Bilder-Upload muss Progress nach Auswahl/Verwerfen/Speichern auch updaten:
// Wir wrappen die existierenden Helfer.
(function patchImageHooksForProgress() {
    const _renderImageCard = renderImageCard;
    // eslint-disable-next-line no-func-assign
    renderImageCard = function (_type) {
        const r = _renderImageCard.apply(this, arguments);
        try { updateProgressBar(); } catch (_e) { /* progress widget noch nicht da */ }
        return r;
    };
})();

// ==============================================================
// Sachverständigen-Tools (PLZ→Bundesland, Tool-Deeplinks,
// Geocoding via OSM Nominatim).
// Im Public-Modus komplett inaktiv (CSS blendet UI aus,
// initToolFeatures() bricht früh ab).
// ==============================================================

// PLZ-Präfix → Bundesland (zwei-stellig). Bei Grenz-PLZs gewinnt
// die häufigste Zuordnung; Sachverständige korrigiert manuell wenn nötig.
const PLZ_TO_BUNDESLAND = {
    '01':'SN','02':'SN','03':'BB','04':'SN','06':'ST','07':'TH','08':'SN','09':'SN',
    '10':'BE','11':'BE','12':'BE','13':'BE','14':'BB','15':'BB','16':'BB',
    '17':'MV','18':'MV','19':'MV',
    '20':'HH','21':'HH','22':'HH','23':'SH','24':'SH','25':'SH','26':'NI','27':'NI','28':'HB','29':'NI',
    '30':'NI','31':'NI','32':'NW','33':'NW','34':'HE','35':'HE','36':'HE','37':'NI','38':'NI','39':'ST',
    '40':'NW','41':'NW','42':'NW','43':'NW','44':'NW','45':'NW','46':'NW','47':'NW','48':'NW','49':'NI',
    '50':'NW','51':'NW','52':'NW','53':'NW','54':'RP','55':'RP','56':'RP','57':'NW','58':'NW','59':'NW',
    '60':'HE','61':'HE','62':'HE','63':'HE','64':'HE','65':'HE','66':'SL','67':'RP','68':'BW','69':'BW',
    '70':'BW','71':'BW','72':'BW','73':'BW','74':'BW','75':'BW','76':'BW','77':'BW','78':'BW','79':'BW',
    '80':'BY','81':'BY','82':'BY','83':'BY','84':'BY','85':'BY','86':'BY','87':'BY','88':'BW','89':'BY',
    '90':'BY','91':'BY','92':'BY','93':'BY','94':'BY','95':'BY','96':'BY','97':'BY','98':'TH','99':'TH'
};

function lookupBundeslandByPlz(plz) {
    const trimmed = (plz || '').toString().trim();
    if (!/^\d{2,5}/.test(trimmed)) return null;
    return PLZ_TO_BUNDESLAND[trimmed.slice(0, 2)] || null;
}

function getObjectAddressString({ withCountry = false } = {}) {
    const f = (n) => {
        const el = document.querySelector(`[name="${n}"]`);
        return el ? (el.value || '').trim() : '';
    };
    const street = [f('objekt_strasse'), f('objekt_hausnummer'), f('objekt_hausnummer_zusatz')].filter(Boolean).join(' ');
    const city = [f('objekt_plz'), f('objekt_ort')].filter(Boolean).join(' ');
    const parts = [street, city].filter(Boolean);
    if (withCountry && parts.length) parts.push('Deutschland');
    return parts.join(', ');
}

function getObjectCoordinates() {
    const lat = parseFloat(document.body.dataset.objektLat || '');
    const lon = parseFloat(document.body.dataset.objektLon || '');
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    return null;
}

function setObjectCoordinates(lat, lon) {
    if (lat == null || lon == null) {
        delete document.body.dataset.objektLat;
        delete document.body.dataset.objektLon;
        return;
    }
    document.body.dataset.objektLat = String(lat);
    document.body.dataset.objektLon = String(lon);
}

function buildToolUrl(toolKey) {
    const addr = getObjectAddressString();
    const addrEnc = encodeURIComponent(addr || '');
    const coords = getObjectCoordinates();
    switch (toolKey) {
        case 'google-maps':
            return addr ? `https://www.google.com/maps/search/?api=1&query=${addrEnc}` : 'https://www.google.com/maps/';
        case 'streetview':
            if (coords) {
                return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lon}`;
            }
            return addr
                ? `https://www.google.com/maps?q=${addrEnc}&layer=c&cbll=`
                : 'https://www.google.com/maps/';
        case 'geoindex':
            // geoindex.io unterstützt keinen Such-URL-Parameter — die App.js liest nur
            // Marketing-Tracking-Codes. Daher Seite ohne Parameter öffnen; die Adresse
            // landet beim Klick in der Zwischenablage (siehe attachToolListeners).
            return 'https://geoindex.io/';
        case 'boris-d':
            return 'https://www.bodenrichtwerte-boris.de/boris-d/?lang=de';
        case 'boris-bw':
            return 'https://www.gutachterausschuesse-bw.de/borisbw/?lang=de';
        case 'geoportal':
            return 'https://www.geoportal.de/Anwendungen/Geoportale%20der%20L%C3%A4nder.html';
        case 'udo':
            return 'https://udo.lubw.baden-wuerttemberg.de/public/';
        default:
            return '#';
    }
}

function refreshToolDeeplinks() {
    document.querySelectorAll('[data-tool-link]').forEach((a) => {
        const key = a.getAttribute('data-tool-link');
        a.href = buildToolUrl(key);
    });
}

function copyAddressToClipboard() {
    const addr = getObjectAddressString();
    if (!addr) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(addr).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
}

async function runGeocode() {
    const addr = getObjectAddressString({ withCountry: true });
    const box = document.getElementById('geocodeResultBox');
    if (!box) return;
    if (!addr) {
        box.hidden = false;
        box.className = 'geocode-result is-error';
        box.textContent = 'Bitte zuerst Straße, PLZ und Ort eintragen.';
        return;
    }
    box.hidden = false;
    box.className = 'geocode-result';
    box.textContent = 'Adresse wird geprüft …';
    const url = `${API_URL}/api/tools/geocode?q=${encodeURIComponent(addr)}` + (IS_PUBLIC && TOKEN ? `&token=${encodeURIComponent(TOKEN)}` : '');
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        renderGeocodeResults(data.results || [], addr);
    } catch (err) {
        box.className = 'geocode-result is-error';
        box.textContent = 'Geocoding fehlgeschlagen: ' + (err.message || err);
    }
}

function renderGeocodeResults(results, queryAddr) {
    const box = document.getElementById('geocodeResultBox');
    if (!box) return;
    if (!results.length) {
        box.className = 'geocode-result is-error';
        box.textContent = 'Keine Treffer für die Adresse gefunden.';
        return;
    }
    box.className = 'geocode-result';
    box.innerHTML = '';
    const intro = document.createElement('div');
    intro.style.fontWeight = '500';
    intro.textContent = 'Treffer für: ' + queryAddr;
    box.appendChild(intro);
    results.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'geocode-row';
        const span = document.createElement('span');
        span.className = 'geocode-display';
        span.textContent = `${idx + 1}. ${r.display_name} (${r.lat.toFixed(5)}, ${r.lon.toFixed(5)})`;
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'geocode-apply';
        apply.textContent = 'übernehmen';
        apply.addEventListener('click', () => applyGeocodeResult(r));
        row.appendChild(span);
        row.appendChild(apply);
        box.appendChild(row);
    });
    // Erste Antwort schon mal als Default-Koordinaten merken (für Streetview-Browser-Link)
    const first = results[0];
    setObjectCoordinates(first.lat, first.lon);
}

function applyGeocodeResult(r) {
    const a = r.address || {};
    const setVal = (name, val) => {
        if (!val) return;
        const el = document.querySelector(`[name="${name}"]`);
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const street = a.road || a.pedestrian || a.footway || '';
    const housenumber = a.house_number || '';
    const plz = a.postcode || '';
    const ort = a.city || a.town || a.village || a.municipality || a.suburb || '';
    if (street) setVal('objekt_strasse', street);
    if (housenumber) setVal('objekt_hausnummer', housenumber);
    if (plz) setVal('objekt_plz', plz);
    if (ort) setVal('objekt_ort', ort);
    setObjectCoordinates(r.lat, r.lon);
    refreshToolDeeplinks();
    const box = document.getElementById('geocodeResultBox');
    if (box) {
        box.className = 'geocode-result';
        box.textContent = '✓ Adresse übernommen (' + (r.display_name || '') + ').';
    }
    // Adresse direkt persistieren, damit nichts verloren geht.
    try { flushAutoSave(); } catch (_e) { /* autosave noch nicht initialisiert */ }
}

// PLZ→Bundesland läuft sowohl im Admin als auch im Public-Modus.
// Im Public-Modus ist das Bundesland-Feld zwar im Liegenschafts-Block
// versteckt, soll aber trotzdem aus der vom Kunden eingegebenen PLZ
// automatisch befüllt und beim Submit mitgesendet werden — der
// Sachverständige sieht den Wert dann nach dem Login.
function attachPlzBundeslandListener() {
    const plzEl = document.querySelector('[name="objekt_plz"]');
    const blEl = document.querySelector('[name="bundesland"]');
    if (!plzEl || !blEl) return;
    plzEl.addEventListener('input', () => {
        const code = lookupBundeslandByPlz(plzEl.value);
        if (code && !blEl.value) {
            blEl.value = code;
            blEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

function attachToolListeners() {
    ['objekt_strasse', 'objekt_hausnummer', 'objekt_hausnummer_zusatz', 'objekt_plz', 'objekt_ort'].forEach((n) => {
        const el = document.querySelector(`[name="${n}"]`);
        if (!el) return;
        el.addEventListener('input', () => {
            // Adresse hat sich geändert → Koordinaten verwerfen
            setObjectCoordinates(null, null);
            if (!IS_PUBLIC) refreshToolDeeplinks();
        });
    });

    // "Adresse prüfen"-Button — auch im Public-Modus aktiv (nutzt Submission-Token)
    const geocodeBtn = document.querySelector('[data-tool="geocode"]');
    if (geocodeBtn) geocodeBtn.addEventListener('click', runGeocode);

    if (IS_PUBLIC) return; // Recherche-Deeplinks sind reine Sachverständigen-Funktion

    // Tool-Deeplinks: vor Klick aktuelle Adresse setzen + ggf. in Clipboard
    const CLIPBOARD_TOOLS = {
        'geoindex': 'Geoindex',
        'boris-d': 'BORIS-D',
        'boris-bw': 'BORIS-BW',
        'geoportal': 'Geoportal',
        'udo': 'UDO'
    };
    document.querySelectorAll('[data-tool-link]').forEach((a) => {
        a.addEventListener('click', (_e) => {
            refreshToolDeeplinks();
            const key = a.getAttribute('data-tool-link');
            if (CLIPBOARD_TOOLS[key]) {
                const addr = getObjectAddressString();
                if (addr) {
                    copyAddressToClipboard().then((ok) => {
                        if (ok) showToast('Adresse kopiert — im ' + CLIPBOARD_TOOLS[key] + '-Suchfeld Strg+V einfügen.');
                    });
                }
            }
        });
    });
}

function initToolFeatures() {
    // PLZ→Bundesland läuft immer (auch im Public-Formular für den Kunden)
    attachPlzBundeslandListener();
    // Adresse-prüfen-Button + Adress-Listener laufen in beiden Modi.
    // attachToolListeners macht intern einen früh-return für die Admin-Deeplinks.
    attachToolListeners();
    if (!IS_PUBLIC) refreshToolDeeplinks();
}

// Geschossigkeit: 1,0 – 8,0 in 0,5er-Schritten. Eingabe mit Komma oder Punkt
// wird auf "X,Y" normalisiert; ungültige Werte triggern eine Validierungs-Meldung.
function normalizeGeschossigkeitValue(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (s === '') return '';
    const num = parseFloat(s.replace(',', '.'));
    if (isNaN(num)) return null;
    const stepped = Math.round(num * 2) / 2;
    if (stepped < 1 || stepped > 8) return null;
    return stepped.toFixed(1).replace('.', ',');
}

function initGeschossigkeitInput() {
    const input = document.getElementById('geschossigkeit_input');
    if (!input) return;
    const apply = () => {
        const raw = input.value.trim();
        if (!raw) { input.setCustomValidity(''); return; }
        const norm = normalizeGeschossigkeitValue(raw);
        if (norm === null) {
            input.setCustomValidity('Bitte einen Wert zwischen 1,0 und 8,0 in 0,5er-Schritten eingeben (z.B. 2,5).');
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        if (norm !== input.value) {
            input.value = norm;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
    input.addEventListener('blur', apply);
    input.addEventListener('change', apply);
}

// Setzt das Formular fuer den Klienten in einen Lese-Modus, sobald er
// seine Angaben final abgeschickt hat (oder der Admin das Formular
// gesperrt hat). Admin-Modus ist hiervon nicht betroffen — der Admin
// bearbeitet weiter wie gewohnt.
function applyFinalizedState(finalized) {
    IS_FINALIZED = !!finalized;
    document.body.classList.toggle('is-finalized', IS_FINALIZED);
    if (!IS_PUBLIC) return;
    const banner = document.getElementById('finalizedBanner');
    const section = document.getElementById('finalizeSection');
    if (banner) banner.style.display = IS_FINALIZED ? 'block' : 'none';
    if (section) section.style.display = IS_FINALIZED ? 'none' : '';

    if (IS_FINALIZED) {
        const form = document.getElementById('checklisteForm');
        if (form) {
            form.querySelectorAll('input, select, textarea, button').forEach((el) => {
                el.disabled = true;
            });
        }
        document.querySelectorAll('.controls .reset, .image-upload-card input[type="file"], .image-upload-card .image-upload-btn, .anlage-actions button').forEach((el) => {
            el.disabled = true;
        });
    }
}

async function finalizeSubmission() {
    if (!IS_PUBLIC || !TOKEN || IS_FINALIZED) return;
    confirmAction('Sind Sie sicher? Nach dem finalen Abschicken können Sie Ihre Angaben über diesen Link nicht mehr ändern.', async () => {
        try {
            await saveData();
        } catch (_e) { /* trotzdem versuchen zu finalisieren */ }
        try {
            const response = await fetch(`${API_URL}/api/submit/${TOKEN}/finalize`, {
                method: 'POST'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                showToast('Finalisierung fehlgeschlagen: ' + (data.error || response.statusText), 'error');
                return;
            }
            applyFinalizedState(true);
            showToast('Angaben wurden final abgeschickt. Vielen Dank!');
        } catch (error) {
            console.error('Finalize error:', error);
            showToast('Finalisierung fehlgeschlagen: ' + error.message, 'error');
        }
    });
}

window.addEventListener('load', () => {
    applyMode();
    initCollapsibleSections();
    initImageUploads();
    initAnlageUI();
    attachProgressListeners();
    toggleVornameByAnrede();
    updateProgressBar();
    initToolFeatures();
    initGeschossigkeitInput();
    const finalizeBtn = document.getElementById('finalizeBtn');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', finalizeSubmission);
    }
    loadCurrentForm({ silentNotFound: true });
});

// Explizit am window registrieren — diese Funktionen werden ausschließlich aus inline-onclick-Handlern
// im HTML aufgerufen. Ohne diese Zuweisung sieht ESLint sie als "ungenutzt".
window.toggleAllSections = toggleAllSections;
window.resetData = resetData;
window.toggleBjField = toggleBjField;
window.jumpToField = jumpToField;
