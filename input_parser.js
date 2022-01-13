const { throws } = require("assert");
var fs = require("fs");
const a = require("./client");
const act = require("./action");
class InputParser {
  constructor(path) {
    this.path = path;
    this.actions = [];
  }
  parse() {
    var data = fs.readFileSync(this.path, "utf8");
    const lines = data.split("\n");
    removeWhitespaces(lines);
    // console.log(lines);
    this.id = parseInt(lines[0]);
    this.port = parseInt(lines[1]);
    this.initialString = lines[2];
    var index = 4;
    index = this.parseNeighbors(index, lines);
    index = this.parseActions(index, lines);
    console.log(this.actions);
    this.actions.forEach(a => {
      console.log(a.apply('abcde'))
    });
    return this.neighbors;
  }

  parseActions(index, lines) {
    while (index < lines.length) {
      if (lines[index] == "") {
        index++;
        break;
      }
      var splitted = lines[index].split(" ");
      switch (splitted[0]) {
        case "insert":
          var cmd = act.InsertAction.fromArr(splitted);
          this.actions.push(cmd);
          break;
        case "delete":
          var cmd = act.DeleteAction.fromArr(splitted);
          this.actions.push(cmd);
        default:
          break;
      }
      index++;
    }
    return index;
  }


  parseNeighbors(index, lines) {
    this.neighbors = new Array();
    while (index < lines.length) {
      if (lines[index] == "") {
        index++;
        break;
      }
      var splitted = lines[index].split(" ");
      this.neighbors.push(
        new a.Client(parseInt(splitted[0]), splitted[1], parseInt(splitted[2]))
      );
      index++;
    }
    return index;
  }
}

function removeWhitespaces(lines) {
  var index = 0;
  lines.forEach((line) => {
    lines[index] = line.replaceAll("\r", "");
    index++;
  });
}

module.exports.InputParser = InputParser;