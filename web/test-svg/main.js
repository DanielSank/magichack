function go() {
  svg = document.getElementById("mySVG");
  var img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttribute("x", "0");
  img.setAttribute("y", "0");
  img.setAttribute("width", "750");
  img.setAttribute("height", "1050");
  img.setAttribute("href", "./ucard.jpg");


  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "10");
  rect.setAttribute("y", "10");
  rect.setAttribute("width", "100");
  rect.setAttribute("height", "100");
  rect.setAttribute("fill", "red");
  // Add the shape to the SVG element
  document.getElementById("mySVG").appendChild(img);
  document.getElementById("mySVG").appendChild(rect);
}
