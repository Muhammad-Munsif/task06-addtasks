 
    // Task Manager
    class TaskManager {
      constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.selectedTasks = new Set();
        this.init();
      }

      init() {
        this.renderTasks();
        this.setupEventListeners();
        this.updateStats();
      }

      setupEventListeners() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.currentFilter = e.target.dataset.filter;
            this.renderTasks();
          });
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase();
          this.renderTasks();
        });

        // Select all checkbox
        document.getElementById('selectAll').addEventListener('change', (e) => {
          const checkboxes = document.querySelectorAll('.task-checkbox-select');
          checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            this.toggleTaskSelection(cb.dataset.id, e.target.checked);
          });
          this.updateBulkActions();
        });

        // Clear completed button
        document.getElementById('clearCompletedBtn')?.addEventListener('click', () => this.clearCompleted());
      }

      addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const text = input.value.trim();

        if (!text) {
          this.showToast('Please enter a task!', 'error');
          return;
        }

        const task = {
          id: Date.now(),
          text,
          done: false,
          important: false,
          priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task added successfully!', 'success');

        input.value = '';
        input.focus();
      }

      toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.done = !task.done;
          task.updatedAt = new Date().toISOString();
          this.saveTasks();
          this.renderTasks();
          this.updateStats();
          this.showToast(`Task marked as ${task.done ? 'completed' : 'pending'}!`, 'success');
        }
      }

      toggleImportant(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.important = !task.important;
          task.updatedAt = new Date().toISOString();
          this.saveTasks();
          this.renderTasks();
          this.updateStats();
          this.showToast(`Task marked as ${task.important ? 'important' : 'normal'}!`, 'success');
        }
      }

      deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
          const task = this.tasks.find(t => t.id === id);
          this.tasks = this.tasks.filter(t => t.id !== id);
          this.selectedTasks.delete(id);
          this.saveTasks();
          this.renderTasks();
          this.updateStats();
          this.updateBulkActions();
          this.showToast(`Task "${task.text}" deleted!`, 'success');
        }
      }

      editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText && newText.trim() !== '') {
          task.text = newText.trim();
          task.updatedAt = new Date().toISOString();
          this.saveTasks();
          this.renderTasks();
          this.showToast('Task updated successfully!', 'success');
        }
      }

      toggleTaskSelection(id, checked) {
        if (checked) {
          this.selectedTasks.add(id);
        } else {
          this.selectedTasks.delete(id);
        }
      }

      completeSelected() {
        this.selectedTasks.forEach(id => {
          const task = this.tasks.find(t => t.id === id);
          if (task) task.done = true;
        });
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.selectedTasks.clear();
        this.updateBulkActions();
        this.showToast('Selected tasks completed!', 'success');
      }

      deleteSelected() {
        if (this.selectedTasks.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${this.selectedTasks.size} task(s)?`)) return;

        this.tasks = this.tasks.filter(t => !this.selectedTasks.has(t.id));
        this.selectedTasks.clear();
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.updateBulkActions();
        this.showToast('Selected tasks deleted!', 'success');
      }

      updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        bulkActions.style.display = this.selectedTasks.size > 0 ? 'flex' : 'none';
        document.getElementById('selectAll').checked = this.selectedTasks.size === this.filteredTasks().length;
      }

      filteredTasks() {
        let filtered = this.tasks;

        // Apply search filter
        if (this.searchQuery) {
          filtered = filtered.filter(task =>
            task.text.toLowerCase().includes(this.searchQuery)
          );
        }

        // Apply status filter
        switch (this.currentFilter) {
          case 'pending':
            filtered = filtered.filter(task => !task.done);
            break;
          case 'completed':
            filtered = filtered.filter(task => task.done);
            break;
          case 'important':
            filtered = filtered.filter(task => task.important);
            break;
          case 'high':
            filtered = filtered.filter(task => task.priority === 'high');
            break;
          case 'all':
          default:
            break;
        }

        return filtered;
      }

      renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.filteredTasks();

        if (filteredTasks.length === 0) {
          taskList.innerHTML = '';
          taskList.appendChild(emptyState);
          emptyState.style.display = 'block';
          return;
        }

        emptyState.style.display = 'none';

        taskList.innerHTML = filteredTasks.map(task => `
          <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
            <div class="task-checkbox ${task.done ? 'checked' : ''}" 
                 onclick="taskManager.toggleTask(${task.id})"></div>
            
            <div class="task-content">
              <div class="task-text">${this.escapeHtml(task.text)}</div>
              <div class="task-meta">
                <span class="task-date">
                  <i class="far fa-calendar"></i> ${this.formatDate(task.updatedAt)}
                </span>
                <span class="task-priority priority-${task.priority}">
                  ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
              </div>
            </div>
            
            <div class="task-actions">
              <button class="star-btn ${task.important ? 'starred' : ''}" 
                      onclick="taskManager.toggleImportant(${task.id})">
                <i class="fas fa-star"></i>
              </button>
              <button class="action-btn edit-btn" onclick="taskManager.editTask(${task.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete-btn" onclick="taskManager.deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </li>
        `).join('');
      }

      updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.done).length;
        const pending = total - completed;
        const important = this.tasks.filter(t => t.important).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('importantTasks').textContent = important;
      }

      saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
      }

      formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
          return `${diffMins}m ago`;
        } else if (diffHours < 24) {
          return `${diffHours}h ago`;
        } else if (diffDays === 1) {
          return 'Yesterday';
        } else if (diffDays < 7) {
          return `${diffDays}d ago`;
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }
      }

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        const color = type === 'success' ? '#4361ee' : '#f72585';

        toast.innerHTML = `
          <i class="${icon}" style="color: ${color}"></i>
          <span>${message}</span>
        `;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
    }

    // Global functions
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        taskManager.addTask();
      }
    }

    // Initialize Task Manager
    const taskManager = new TaskManager();

    // Add sample tasks if empty
    if (taskManager.tasks.length === 0) {
      const sampleTasks = [
        { text: 'Complete project documentation', priority: 'high', important: true },
        { text: 'Buy groceries', priority: 'medium', done: true },
        { text: 'Call mom', priority: 'low' },
        { text: 'Schedule team meeting', priority: 'high', important: true },
        { text: 'Read a book', priority: 'low', done: true }
      ];

      sampleTasks.forEach((task, index) => {
        setTimeout(() => {
          const newTask = {
            id: Date.now() + index,
            text: task.text,
            done: task.done || false,
            important: task.important || false,
            priority: task.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          taskManager.tasks.push(newTask);
          taskManager.saveTasks();
          taskManager.renderTasks();
          taskManager.updateStats();
        }, index * 200);
      });
    }
  