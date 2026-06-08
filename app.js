const STORAGE_KEY = 'gfrq_tasks';

const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' };
const CATEGORY_LABELS = { work: '工作', life: '生活', study: '学习', other: '其他' };
const PRIORITY_ORDER = ['low', 'medium', 'high'];

let tasks = loadTasks();
let filter = 'all';
let categoryFilter = 'all';
let dragSrcId = null;

const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const categoryInput = document.getElementById('categoryInput');
const dueDateInput = document.getElementById('dueDateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const catBtns = document.querySelectorAll('.cat-btn');

function loadTasks() {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return raw.map(t => ({
    id: t.id,
    text: t.text,
    done: !!t.done,
    priority: t.priority || 'medium',
    category: t.category || 'other',
    dueDate: t.dueDate || '',
  }));
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function dateStatus(dateStr, done) {
  if (!dateStr || done) return '';
  const due = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diff = due - now;
  if (diff < 0) return 'overdue';
  if (diff < 24 * 60 * 60 * 1000) return 'soon';
  return '';
}

function render() {
  const visible = tasks.filter(t => {
    if (filter === 'active' && t.done) return false;
    if (filter === 'done' && !t.done) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  if (visible.length === 0) {
    taskList.innerHTML = '<li class="empty-hint">暂无任务</li>';
  } else {
    taskList.innerHTML = visible.map(t => {
      const status = dateStatus(t.dueDate, t.done);
      let dateHtml = '';
      if (t.dueDate) {
        let label = t.dueDate;
        if (status === 'overdue') label += ' · 已过期';
        else if (status === 'soon') label += ' · 即将到期';
        dateHtml = `<span class="tag tag-date ${status}">${escapeHtml(label)}</span>`;
      }
      return `<li class="${t.done ? 'done' : ''} priority-${t.priority}" data-id="${t.id}" draggable="true">
        <span class="drag-handle" title="拖拽排序">⋮⋮</span>
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <div class="task-body">
          <span class="task-text" title="双击编辑">${escapeHtml(t.text)}</span>
          <div class="task-meta">
            <span class="tag tag-priority-${t.priority}" data-action="priority" title="点击切换优先级">${PRIORITY_LABELS[t.priority]}</span>
            <span class="tag tag-cat-${t.category}" data-action="category" title="点击切换分类">${CATEGORY_LABELS[t.category]}</span>
            ${dateHtml}
          </div>
        </div>
        <button class="delete-btn" title="删除">✕</button>
      </li>`;
    }).join('');
  }
  taskCount.textContent = `${tasks.filter(t => !t.done).length} 项未完成`;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({
    id: Date.now(),
    text,
    done: false,
    priority: priorityInput.value,
    category: categoryInput.value,
    dueDate: dueDateInput.value || '',
  });
  taskInput.value = '';
  dueDateInput.value = '';
  save(); render();
}

function cycleNext(arr, current) {
  const i = arr.indexOf(current);
  return arr[(i + 1) % arr.length];
}

function startEdit(li, task) {
  const textEl = li.querySelector('.task-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = task.text;
  input.maxLength = 100;
  textEl.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const finish = (commit) => {
    if (commit) {
      const v = input.value.trim();
      if (v) task.text = v;
    }
    save(); render();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

taskList.addEventListener('change', e => {
  if (e.target.type !== 'checkbox') return;
  const task = tasks.find(t => t.id === Number(e.target.closest('li').dataset.id));
  if (task) { task.done = e.target.checked; save(); render(); }
});

taskList.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.id) return;
  const task = tasks.find(t => t.id === Number(li.dataset.id));
  if (!task) return;

  if (e.target.classList.contains('delete-btn')) {
    tasks = tasks.filter(t => t.id !== task.id);
    save(); render();
    return;
  }
  const action = e.target.dataset.action;
  if (action === 'priority') {
    task.priority = cycleNext(PRIORITY_ORDER, task.priority);
    save(); render();
  } else if (action === 'category') {
    task.category = cycleNext(Object.keys(CATEGORY_LABELS), task.category);
    save(); render();
  }
});

taskList.addEventListener('dblclick', e => {
  if (!e.target.classList.contains('task-text')) return;
  const li = e.target.closest('li');
  const task = tasks.find(t => t.id === Number(li.dataset.id));
  if (task) startEdit(li, task);
});

taskList.addEventListener('dragstart', e => {
  const li = e.target.closest('li');
  if (!li || !li.dataset.id) return;
  dragSrcId = Number(li.dataset.id);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
taskList.addEventListener('dragend', e => {
  const li = e.target.closest('li');
  if (li) li.classList.remove('dragging');
  document.querySelectorAll('#taskList li.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSrcId = null;
});
taskList.addEventListener('dragover', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  if (!li || !li.dataset.id) return;
  document.querySelectorAll('#taskList li.drag-over').forEach(el => el.classList.remove('drag-over'));
  li.classList.add('drag-over');
});
taskList.addEventListener('drop', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  if (!li || !li.dataset.id || dragSrcId == null) return;
  const targetId = Number(li.dataset.id);
  if (targetId === dragSrcId) return;
  const srcIdx = tasks.findIndex(t => t.id === dragSrcId);
  const targetIdx = tasks.findIndex(t => t.id === targetId);
  if (srcIdx < 0 || targetIdx < 0) return;
  const [moved] = tasks.splice(srcIdx, 1);
  tasks.splice(targetIdx, 0, moved);
  save(); render();
});

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filter = btn.dataset.filter;
  filterBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}));
catBtns.forEach(btn => btn.addEventListener('click', () => {
  categoryFilter = btn.dataset.cat;
  catBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}));
document.getElementById('clearDone').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done); save(); render();
});

render();
