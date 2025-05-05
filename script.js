const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// Load tasks on page load
document.addEventListener("DOMContentLoaded", loadTasksFromStorage);

// Add Task
addTaskBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    alert("Please enter a task");
    return;
  }

  addTaskToList(taskText, false);
  saveTask(taskText, false);
  taskInput.value = "";
});

// Event Delegation: Delete or Mark as Done
taskList.addEventListener("click", function (e) {
  const target = e.target;
  const li = target.closest("li");
  const taskText = li.firstChild.textContent.trim();

  if (target.classList.contains("delete-btn")) {
    li.remove();
    removeTaskFromStorage(taskText);
  } else {
    // Toggle done
    li.classList.toggle("done");
    toggleTaskDoneInStorage(taskText);
  }
});

// Helpers
function addTaskToList(taskText, done) {
  const li = document.createElement("li");
  if (done) li.classList.add("done");

  li.innerHTML = `
      ${taskText}
      <button class="delete-btn">Delete</button>
    `;
  taskList.appendChild(li);
}

function saveTask(taskText, done) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push({ text: taskText, done });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasksFromStorage() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach((task) => addTaskToList(task.text, task.done));
}

function removeTaskFromStorage(taskText) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter((task) => task.text !== taskText);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function toggleTaskDoneInStorage(taskText) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.map((task) =>
    task.text === taskText ? { ...task, done: !task.done } : task
  );
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
