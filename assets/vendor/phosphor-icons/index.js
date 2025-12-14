var head = document.getElementsByTagName("head")[0];

// Only load Bold weight as analyzed
var link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = `./assets/vendor/phosphor-icons/src/bold/style.css`;
head.appendChild(link);
