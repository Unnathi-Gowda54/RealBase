function projectName() {
  var modal = document.getElementById("myModal");
  var btn = document.getElementById("openModal");
  var span = document.getElementsByClassName("close")[0];

  btn.onclick = function() {
    modal.style.display = "block";
  }

  span.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

function tablesPage(){
  window.location.href = "/views";
}

const addButton = document.querySelector(".add");
const input = document.querySelector(".input-group");

function removeInput() {
  this.parentElement.remove();
}

function addInput() {

  const columnName = document.createElement("input");
  columnName.type = "text"; 
  columnName.placeholder = "Column Name";
  columnName.name = "CN";
  columnName.id = "CN";

  const type = document.createElement("select");
  type.placeholder = "type";
  type.name = "TP";
  type.id = "TP";

  const option1 = document.createElement("option");
  option1.text = "INT(10)";
  type.add(option1);
  option1.id = "O1";

  const option2 = document.createElement("option");
  option2.text = "VARCHAR(20)";
  type.add(option2);
  option2.id = "O2";

  const option3 = document.createElement("option");
  option3.text = "INT(50)";
  type.add(option3);
  option3.id = "O3";

  const option4 = document.createElement("option");
  option4.text = "VARCHAR(50)";
  type.add(option4);
  option4.id = "O4";

  const option5 = document.createElement("option");
  option5.text = "DATE";
  type.add(option5);
  option5.id = "O5";

  const option6 = document.createElement("option");
  option6.text = "DECIMAL";
  type.add(option6);
  option6.id = "O6";

  const option7 = document.createElement("option");
  option7.text = "FLOAT";
  type.add(option7);
  option7.id = "O7";

  const option8 = document.createElement("option");
  option8.text = "CHAR(40)";
  type.add(option8);
  option8.id = "O8";

  const deleteButton  = document.createElement("a");
  deleteButton.className = "delete"; 
  deleteButton.innerHTML = "&times";

  deleteButton.addEventListener("click", removeInput);

  const flex = document.createElement("div")
  flex.className = "flex";
  flex.name = "flexName";

  input.appendChild(flex);
  flex.appendChild(columnName);
  flex.appendChild(type);
  flex.appendChild(deleteButton);
}

addButton.addEventListener("click", addInput);
