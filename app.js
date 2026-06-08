const STORAGE_KEY = 'gfrq_tasks';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let filter = 'all';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const filterBtns = document.querySelectorAll('.filter-btn');

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function render() {
  const visible = tasks.filter(t => filter === 'active' ? !t.done : filter === 'done' ? t.done : true);
  taskList.innerHTML = visible.length === 0
    ? '<li class="empty-hint">暂无任务</li>'
    : visible.map(t => `<li class="${t.done ? 'done' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <span class="task-text">${t.text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>
        <button class="delete-btn" title="删除">✕</button>
      </li>`).join('');
  taskCount.textContent = `${tasks.filter(t => !t.done).length} 项未完成`;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now(), text, done: false });
  taskInput.value = '';
  save(); render();
}

taskList.addEventListener('change', e => {
  if (e.target.type !== 'checkbox') return;
  const task = tasks.find(t => t.id === Number(e.target.closest('li').dataset.id));
  if (task) { task.done = e.target.checked; save(); render(); }
});
taskList.addEventListener('click', e => {
  if (!e.target.classList.contains('delete-btn')) return;
  tasks = tasks.filter(t => t.id !== Number(e.target.closest('li').dataset.id));
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
document.getElementById('clearDone').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done); save(); render();
});

render();
