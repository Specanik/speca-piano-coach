/**
 * Router — mini SPA router.
 * Manages 4 views: home | learn | practice | profile
 * Each view is a <div class="view" data-view="..."> inside #view-container.
 *
 * API:
 *   Router.go(viewId)              navigate to a view
 *   Router.current()               current view id
 *   Router.onNavigate(cb)          cb(newViewId, prevViewId)
 *   Router.registerView(id, init)  register init callback for lazy views
 */
const Router = (() => {
    let _current   = null;
    let _onChange  = null;
    const _inits   = {};     // viewId → init function (called once on first visit)
    const _visited = new Set();

    function go(viewId) {
        if (_current === viewId) return;
        const prev = _current;

        // Hide all views
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('view-active');
        });

        // Show target view
        const target = document.querySelector(`[data-view="${viewId}"]`);
        if (!target) { console.warn('[Router] view not found:', viewId); return; }
        target.classList.add('view-active');

        // Update bottom nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        // Lazy init
        if (!_visited.has(viewId) && _inits[viewId]) {
            _visited.add(viewId);
            _inits[viewId]();
        }

        _current = viewId;
        _onChange && _onChange(viewId, prev);

        // Persist last view (except 'learn' mid-lesson)
        if (viewId !== 'learn') {
            localStorage.setItem('piano-last-view', viewId);
        }
    }

    function current() { return _current; }

    function registerView(id, initFn) {
        _inits[id] = initFn;
    }

    function restore() {
        const saved = localStorage.getItem('piano-last-view') || 'home';
        go(saved);
    }

    return {
        go,
        current,
        registerView,
        restore,
        onNavigate: cb => { _onChange = cb; }
    };
})();
