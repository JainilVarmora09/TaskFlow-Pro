/*==================================================
  TaskFlow Pro
  script.js
  Part 1 - Core Setup
==================================================*/

"use strict";

/*=========================
  DOM ELEMENTS
=========================*/

const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const categoryInput = document.getElementById("category");
const priorityInput = document.getElementById("priority");

const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("searchInput");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const overdueTasks = document.getElementById("overdueTasks");

const toast = document.getElementById("toast");
const themeBtn = document.getElementById("themeBtn");

/*=========================
  APP STATE
=========================*/

let tasks = [];
let editingId = null;

let currentFilter = "all";
let currentSearch = "";

/*=========================
  STORAGE
=========================*/

const STORAGE_KEY = "taskflow_tasks";
const THEME_KEY = "taskflow_theme";

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );

}

function loadTasks() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {

        tasks = [];
        return;

    }

    try {

        tasks = JSON.parse(data);

    } catch {

        tasks = [];

    }

}

/*=========================
  ID GENERATOR
=========================*/

function createId() {

    return Date.now().toString(36) +
        Math.random().toString(36).substring(2,8);

}

/*=========================
  THEME
=========================*/

function loadTheme(){

    const theme =
        localStorage.getItem(THEME_KEY);

    if(theme==="dark"){

        document.body.classList.add("dark");

        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    }

}

function toggleTheme(){

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        THEME_KEY,
        dark ? "dark" : "light"
    );

    themeBtn.innerHTML =
        dark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';

}

themeBtn.addEventListener(
    "click",
    toggleTheme
);

/*=========================
  TOAST
=========================*/

function showToast(message){

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}

/*=========================
  DATE HELPERS
=========================*/

function isOverdue(task){

    if(!task.dueDate) return false;

    if(task.completed) return false;

    const today = new Date();

    today.setHours(0,0,0,0);

    const due = new Date(task.dueDate);

    due.setHours(0,0,0,0);

    return due < today;

}

function isToday(task){

    if(!task.dueDate) return false;

    const today = new Date();

    const due = new Date(task.dueDate);

    return today.toDateString() === due.toDateString();

}

/*=========================
  ESCAPE HTML
=========================*/

function escapeHTML(text){

    const div = document.createElement("div");

    div.innerText = text;

    return div.innerHTML;

}

/*=========================
  RENDER
=========================*/

function renderTasks(){

    taskList.innerHTML = "";

    const filtered =
        getFilteredTasks();

    if(filtered.length===0){

        emptyState.style.display="flex";

        return;

    }

    emptyState.style.display="none";

    filtered.forEach(task=>{

        const li =
            document.createElement("li");

        li.className = "task";

        if(task.completed){

            li.classList.add("completed");

        }

        if(isOverdue(task)){

            li.classList.add("overdue");

        }

        li.dataset.id = task.id;

        li.innerHTML = `
<div class="task-left">

<input
type="checkbox"
class="task-check"
${task.completed ? "checked" : ""}>

<div class="task-content">

<div class="task-title">
${escapeHTML(task.title)}
</div>

<div class="task-meta">

<span class="badge category-${task.category.toLowerCase()}">
${task.category}
</span>

<span class="badge priority-${task.priority.toLowerCase()}">
${task.priority}
</span>

${
task.dueDate
?
`<span class="badge due-date">
${formatDate(task.dueDate)}
</span>`
:
""
}

</div>

</div>

</div>

<div class="task-actions">

<button class="action-btn edit-btn">

<i class="fa-solid fa-pen"></i>

</button>

<button class="action-btn delete-btn">

<i class="fa-solid fa-trash"></i>

</button>

</div>
`;

        taskList.appendChild(li);

    });

}

/*=========================
  INIT
=========================*/

loadTheme();

loadTasks();

renderTasks();

/*==================================================
  PART 2
  ADD • EDIT • DELETE • COMPLETE
==================================================*/

/*=========================
  INPUT HELPERS
=========================*/

function clearInputs(){

    taskInput.value = "";
    dueDateInput.value = "";
    categoryInput.selectedIndex = 0;
    priorityInput.value = "Medium";

}

function resetEditing(){

    editingId = null;

    addBtn.innerHTML =
        '<i class="fa-solid fa-plus"></i>';

}

/*=========================
  ADD BUTTON
=========================*/

addBtn.addEventListener("click",handleSubmit);

taskInput.addEventListener("keydown",e=>{

    if(e.key==="Enter"){

        handleSubmit();

    }

});

function handleSubmit(){

    const title = taskInput.value.trim();

    if(title===""){

        showToast("Please enter a task.");

        return;

    }

    if(editingId){

        updateTask();

        return;

    }

    const task={

        id:createId(),

        title:title,

        category:categoryInput.value,

        priority:priorityInput.value,

        dueDate:dueDateInput.value,

        completed:false,

        createdAt:new Date().toISOString()

    };

    tasks.unshift(task);

    saveTasks();

    clearInputs();

    renderTasks();

    updateDashboard();

    showToast("Task added.");

}

/*=========================
  UPDATE TASK
=========================*/

function updateTask(){

    const task =
        tasks.find(
            t=>t.id===editingId
        );

    if(!task) return;

    task.title =
        taskInput.value.trim();

    task.category =
        categoryInput.value;

    task.priority =
        priorityInput.value;

    task.dueDate =
        dueDateInput.value;

    saveTasks();

    renderTasks();

    updateDashboard();

    clearInputs();

    resetEditing();

    showToast("Task updated.");

}

/*=========================
  EVENTS
=========================*/

taskList.addEventListener("click",e=>{

    const item =
        e.target.closest(".task");

    if(!item) return;

    const id = item.dataset.id;

    if(

        e.target.closest(".edit-btn")

    ){

        editTask(id);

        return;

    }

    if(

        e.target.closest(".delete-btn")

    ){

        deleteTask(id);

        return;

    }

});

taskList.addEventListener("change",e=>{

    if(

        !e.target.classList.contains("task-check")

    ) return;

    const item =
        e.target.closest(".task");

    toggleComplete(item.dataset.id);

});

/*=========================
  EDIT
=========================*/

function editTask(id){

    const task =
        tasks.find(
            t=>t.id===id
        );

    if(!task) return;

    editingId=id;

    taskInput.value=
        task.title;

    dueDateInput.value=
        task.dueDate;

    categoryInput.value=
        task.category;

    priorityInput.value=
        task.priority;

    addBtn.innerHTML=
        '<i class="fa-solid fa-floppy-disk"></i>';

    taskInput.focus();

}

/*=========================
  DELETE
=========================*/

function deleteTask(id){

    if(

        !confirm(
            "Delete this task?"
        )

    ) return;

    tasks = tasks.filter(

        task=>task.id!==id

    );

    saveTasks();

    renderTasks();

    updateDashboard();

    showToast("Task deleted.");

}

/*=========================
  COMPLETE
=========================*/

function toggleComplete(id){

    const task =
        tasks.find(
            t=>t.id===id
        );

    if(!task) return;

    task.completed =
        !task.completed;

    saveTasks();

    renderTasks();

    updateDashboard();

    if(task.completed){

        showToast("Task completed.");

    }else{

        showToast("Task reopened.");

    }

}

/*=========================
  DASHBOARD
=========================*/

function updateDashboard(){

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            t=>t.completed
        ).length;

    const pending =
        total-completed;

    const overdue =
        tasks.filter(
            isOverdue
        ).length;

    totalTasks.textContent =
        total;

    completedTasks.textContent =
        completed;

    pendingTasks.textContent =
        pending;

    overdueTasks.textContent =
        overdue;

    const percent =

        total===0

        ?0

        :Math.round(

            completed/total*100

        );

    progressFill.style.width =
        percent+"%";

    progressText.textContent =
        percent+"%";

}

/*=========================
  REFRESH
=========================*/

updateDashboard();

/*==================================================
  PART 3
  SEARCH • FILTERS
==================================================*/

/*=========================
  SEARCH
=========================*/

searchInput.addEventListener("input", function () {

    currentSearch = this.value.trim().toLowerCase();

    renderTasks();

});

/*=========================
  FILTER BUTTONS
=========================*/

const filterButtons =
    document.querySelectorAll(".filter");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn =>

            btn.classList.remove("active")

        );

        button.classList.add("active");

        currentFilter =
            button.dataset.filter;

        renderTasks();

    });

});

/*=========================
  FILTER LOGIC
=========================*/

function getFilteredTasks(){

    let filtered = [...tasks];

    /* Search */

    if(currentSearch!==""){

        filtered = filtered.filter(task =>

            task.title
                .toLowerCase()
                .includes(currentSearch)

            ||

            task.category
                .toLowerCase()
                .includes(currentSearch)

        );

    }

    /* Filters */

    switch(currentFilter){

        case "completed":

            filtered =
                filtered.filter(
                    task=>task.completed
                );

            break;

        case "pending":

            filtered =
                filtered.filter(
                    task=>!task.completed
                );

            break;

        case "high":

            filtered =
                filtered.filter(
                    task=>task.priority==="High"
                );

            break;

        case "today":

            filtered =
                filtered.filter(
                    task=>isToday(task)
                );

            break;

        case "overdue":

            filtered =
                filtered.filter(
                    task=>isOverdue(task)
                );

            break;

        default:

            break;

    }

    return filtered;

}

/*=========================
  AUTO REFRESH
=========================*/

renderTasks();

updateDashboard();

/*==================================================
  PART 4
  DRAG & DROP • CONFETTI • DATE FORMAT
  FINAL INITIALIZATION
==================================================*/

/*=========================
  DATE FORMAT
=========================*/

function formatDate(dateString){

    if(!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString(

        undefined,

        {

            day:"numeric",

            month:"short",

            year:"numeric"

        }

    );

}

/*=========================
  CONFETTI
=========================*/

function celebrateCompletion(){

    if(tasks.length===0) return;

    const allCompleted =

        tasks.every(

            task=>task.completed

        );

    if(!allCompleted) return;

    if(typeof confetti==="function"){

        confetti({

            particleCount:150,

            spread:90,

            origin:{y:0.6}

        });

    }

}

/*=========================
  SORTABLE
=========================*/

if(typeof Sortable!=="undefined"){

    new Sortable(taskList,{

        animation:200,

        ghostClass:"dragging",

        onEnd:function(){

            const ids =

                [...taskList.children]

                .map(

                    item=>item.dataset.id

                );

            tasks = ids.map(

                id=>

                tasks.find(

                    task=>task.id===id

                )

            );

            saveTasks();

        }

    });

}

/*=========================
  PATCH COMPLETE
=========================*/

const oldToggleComplete =

    toggleComplete;

toggleComplete = function(id){

    oldToggleComplete(id);

    celebrateCompletion();

};

/*=========================
  PATCH ADD
=========================*/

const oldHandleSubmit =

    handleSubmit;

handleSubmit = function(){

    oldHandleSubmit();

    taskInput.focus();

};

/*=========================
  PATCH UPDATE
=========================*/

const oldUpdateTask =

    updateTask;

updateTask = function(){

    oldUpdateTask();

    taskInput.focus();

};

/*=========================
  ESC SHORTCUT
=========================*/

document.addEventListener(

    "keydown",

    e=>{

        if(e.key==="Escape"){

            clearInputs();

            resetEditing();

        }

    }

);

/*=========================
  TODAY DEFAULT
=========================*/

const today = new Date()

    .toISOString()

    .split("T")[0];

dueDateInput.min = today;

/*=========================
  FIRST LOAD
=========================*/

updateDashboard();

renderTasks();
