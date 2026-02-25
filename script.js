// =================== ELEMENTS ===================
const search = document.getElementById("search");
const studentTable = document.getElementById("studentTable");
const historyLog = document.getElementById("historyLog");
const historySearch = document.getElementById("historySearch");
const username = document.getElementById("username");
const password = document.getElementById("password");
const loginBox = document.getElementById("loginBox");
const system = document.getElementById("system");
const loginMsg = document.getElementById("loginMsg");
const addBtn = document.getElementById("addBtn");

// =================== DATA & STORAGE ===================
let students = JSON.parse(localStorage.getItem("students")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let role = "";
let lastId = parseInt(localStorage.getItem("lastId")) || 0;

// =================== LOGIN ===================
function login() {
    const u = username.value.trim();
    const p = password.value.trim();
    const remember = document.getElementById("rememberMe").checked;

    if(u==="admin" && p==="admin123") role="admin";
    else if(u==="teacher" && p==="teacher123") role="teacher";
    else if(u==="student" && p==="student123") role="student";
    else { loginMsg.innerText="Invalid login!"; return; }

    if(remember) localStorage.setItem("rememberUser", JSON.stringify({user:u, pass:p, role:role}));

    loginBox.style.display="none";
    system.style.display="block";

    // Show Add Student button only for Admin/Teacher
    if(role==="admin" || role==="teacher"){
        addBtn.style.display = "inline-block";
    }

    displayStudents();
    displayHistory();
}

// Remember Me
window.onload = function() {
    const rem = JSON.parse(localStorage.getItem("rememberUser"));
    if(rem){ username.value=rem.user; password.value=rem.pass; role=rem.role; login(); }
}

// =================== LOGOUT ===================
function logout() {
    if(confirm("Logout?")) {
        system.style.display="none";
        loginBox.style.display="block";
        username.value = password.value = "";
        loginMsg.innerText="";
        addBtn.style.display="none";
    }
}

// =================== DARK MODE ===================
function toggleDarkMode() { document.body.classList.toggle("dark-mode"); }

// =================== SAVE DATA ===================
function saveData(){
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("lastId", lastId);
}

// =================== TOAST ===================
function showToast(msg){
    const toast=document.getElementById("toast");
    toast.innerText=msg;
    toast.className="show";
    setTimeout(()=>{ toast.className=""; },3000);
}

// =================== TIME ===================
function timeNow(){ return new Date().toLocaleString(); }

// =================== ADD / EDIT STUDENT ===================
function addStudent(){
    if(role==="student") return alert("No permission!");
    
    const studentIdPrompt = prompt("Enter Student ID (leave blank for auto):") || "";
    const nameVal = prompt("Enter Name:");
    const courseVal = prompt("Enter Course:");
    const ageVal = prompt("Enter Age:");

    if(!nameVal || !courseVal || !ageVal) return alert("All fields are required!");

    let id = studentIdPrompt.trim();
    if(!id){ lastId++; id="S-"+String(lastId).padStart(3,"0"); }

    let student = students.find(s=>s.studentId===id);
    if(student){
        // Edit existing
        student.name = nameVal;
        student.course = courseVal;
        student.age = ageVal;
        history.push({text:`[${timeNow()}] Edited ${id}`, type:"edit"});
        showToast("Student Edited");
    } else {
        // Add new
        students.push({studentId:id, name:nameVal, course:courseVal, age:ageVal});
        history.push({text:`[${timeNow()}] Added ${id}`, type:"add"});
        showToast("Student Added");
    }

    saveData(); displayStudents(); displayHistory();
}

// =================== DELETE ===================
function deleteStudent(id){
    if(role!=="admin") return alert("Admin only!");
    students = students.filter(s=>s.studentId!==id);
    history.push({text:`[${timeNow()}] Deleted ${id}`, type:"delete"});
    saveData(); displayStudents(); displayHistory();
    showToast("Student Deleted");
}

// =================== DISPLAY STUDENTS ===================
function displayStudents(list=students){
    studentTable.innerHTML="";
    list.forEach(s=>{
        studentTable.innerHTML+=`<tr>
            <td>${s.studentId}</td>
            <td>${s.name}</td>
            <td>${s.course}</td>
            <td>${s.age}</td>
            <td>${
                role!=="student" ? 
                `<button onclick="editStudent('${s.studentId}')">Edit</button> ${role==="admin"?`<button class="danger" onclick="deleteStudent('${s.studentId}')">Delete</button>`:""}` 
                : ""
            }</td>
        </tr>`;
    });
}

// =================== EDIT STUDENT ===================
function editStudent(id){
    if(role==="student") return alert("No permission!");
    const s = students.find(x=>x.studentId===id);
    if(!s) return alert("Student not found!");

    const newName = prompt("Enter Name:", s.name);
    const newCourse = prompt("Enter Course:", s.course);
    const newAge = prompt("Enter Age:", s.age);

    if(!newName || !newCourse || !newAge) return alert("All fields are required!");

    s.name = newName;
    s.course = newCourse;
    s.age = newAge;

    history.push({text:`[${timeNow()}] Edited ${id}`, type:"edit"});
    saveData(); displayStudents(); displayHistory();
    showToast("Student Edited");
}

// =================== SEARCH STUDENT ===================
function searchStudent(){
    const q = search.value.toLowerCase();
    displayStudents(students.filter(s=>s.studentId.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)));
}

// =================== HISTORY ===================
function displayHistory(){
    historyLog.innerHTML="";
    history.forEach(h=>historyLog.innerHTML+=`<li class="${h.type}">${h.text}</li>`);
}

function toggleHistory(){ historyLog.style.display = historyLog.style.display==="none"?"block":"none"; }
function clearHistory(){ if(confirm("Clear history?")){ history=[]; saveData(); displayHistory(); } }

function searchHistory(){
    const q = historySearch.value.toLowerCase();
    historyLog.innerHTML="";
    history.filter(h=>h.text.toLowerCase().includes(q)).forEach(h=>{
        historyLog.innerHTML+=`<li class="${h.type}">${h.text}</li>`;
    });
}

// =================== CSV EXPORT / IMPORT ===================
function exportCSV(){
    let csv = "StudentID,Name,Course,Age\n";
    students.forEach(s=>{ csv+=`${s.studentId},${s.name},${s.course},${s.age}\n`; });
    const blob=new Blob([csv],{type:"text/csv"}); 
    const a=document.createElement("a"); 
    a.href=URL.createObjectURL(blob); 
    a.download="students.csv"; 
    a.click();
}

function importCSV(event){
    if(role==="student") return alert("No permission!");
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload=function(e){
        const data = e.target.result.split("\n").slice(1);
        data.forEach(row=>{
            const [id,nameVal,courseVal,ageVal] = row.split(",");
            if(nameVal) addImportedStudent(id,nameVal,courseVal,ageVal);
        });
        showToast("CSV Imported");
        displayStudents(); displayHistory();
    }
    reader.readAsText(file);
}

function addImportedStudent(id,nameVal,courseVal,ageVal){
    if(!id){ lastId++; id="S-"+String(lastId).padStart(3,"0"); }
    let student = students.find(s=>s.studentId===id);
    if(!student) students.push({studentId:id,name:nameVal,course:courseVal,age:ageVal});
}

// =================== INITIAL LOAD ===================
displayStudents();
displayHistory();