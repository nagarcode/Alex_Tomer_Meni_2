function sleepSync(millis) {
  console.log("Sleeping for " + millis + " milliseconds");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
// Include Nodejs' net module.
const Net = require("net");
const a = require("./input_parser");
const ts = require("./timestamp");
const index = process.argv[2];
var inputParser = new a.InputParser("input-file-" + index + ".txt");
const neighbors = inputParser.parse();
const myID = inputParser.id;
const myPort = inputParser.port;
const initialString = inputParser.initialString;
// setupServer(myPort);
// connectToPeers();
const act = require("./action");
const updates = [
  {
    action: new act.InsertAction(-1, "2"),
    timestamp: new ts.Timestamp(2, -1),
    updatedString: initialString,
    previousString: initialString,
  },
];
var lastUpdatedOperaion = {
  action: new act.InsertAction(-1, "2"),
  timestamp: new ts.Timestamp(2, -1),
  updatedString: initialString,
  previousString: initialString,
};
testAll();

function connectToPeer(peer) {
  // Create a new TCP client.
  const client = new Net.Socket();
  // Send a connection request to the server.
  client.connect({ port: peer.port, host: peer.host }),
    function () {
      // If there is no error, the server has accepted the request and created a new
      // socket dedicated to us.
      console.log("TCP connection established with the server.");

      // The client can now send data to the server by writing to its socket.
      client.write("Hello, server.");
    };

  // The client can also receive data from the server by reading from its socket.
  client.on("data", function (chunk) {
    console.log(`Data received from the server: ${chunk.toString()}.`);

    // Request an end to the connection after the data has been received.
    client.end();
  });

  client.on("end", function () {
    console.log("Requested an end to the TCP connection");
  });
}

function connectToPeers() {
  neighbors.forEach((neighbor) => {
    if (neighbor.id > myID) connectToPeer(neighbor);
  });
}

function setupServer(port) {
  const server = Net.createServer();
  server.listen(port, function () {
    console.log(
      `Server listening for connection requests on socket localhost:${port}`
    );
    sleepSync(5000);
  });

  // When a client requests a connection with the server, the server creates a new
  // socket dedicated to that client.
  server.on("connection", function (socket) {
    console.log("A new connection has been established.");

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    socket.write("Hello, client.");

    // The server can also receive data from the client by reading from its socket.
    socket.on("data", function (chunk) {
      console.log(`Data received from client: ${chunk.toString()}`);
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on("end", function () {
      console.log("Closing connection with the client");
    });
    socket.on("error", function (err) {
      console.log(`Error: ${err}`);
    });
  });
  return server;
}
function applyMergeAlgorithm(action, timestamp) {
  if (lastUpdatedOperaion.timestamp.greaterThan(timestamp)) {
    applyLaterOperations(action, timestamp);
  } else {
    performActionAndLog(timestamp, lastUpdatedOperaion.updatedString, action);
  }
}
function applyLaterOperations(action, timestamp) {
  const laterActions = updates.filter((update) =>
    update.timestamp.greaterThan(timestamp)
  );
  laterActions.sort((a, b) => {
    if (a.timestamp.greaterThan(b.timestamp)) return 1;
    else return -1;
  });
  applyOperationsAndLog(laterActions, action, timestamp);
}
function applyOperationsAndLog(laterActions, action, timestamp) {
  var workingString = laterActions[0].previousString;
  workingString = performActionAndLog(timestamp, workingString, action);
  // console.log(laterActions);
  laterActions.forEach((updt) => {
    workingString = updt.action.apply(workingString);
    console.log(
      "operation: " + updt.action.str() + ", updated string: " + workingString
    );
  });
  console.log(
    "client " +
      myID +
      " ended merging with string " +
      workingString +
      ", on timestamp " +
      lastUpdatedOperaion.timestamp.str()
  );
}
function performActionAndLog(timestamp, workingString, action) {
  console.log(
    "client " +
      myID +
      " started merging, from " +
      timestamp.index +
      ", on " +
      workingString
  );
  var prevString = workingString;
  workingString = action.apply(workingString);
  console.log(
    "operation: " + action.str() + ", updated string: " + workingString
  );
  updates.push({
    action: action,
    timestamp: timestamp,
    updatedString: workingString,
  });
  lastUpdatedOperaion = {
    action: action,
    timestamp: timestamp,
    updatedString: workingString,
    previousString: prevString,
  };
  return workingString;
}

function testAll() {
  applyMergeAlgorithm(new act.InsertAction(-1, "1"), new ts.Timestamp(1, 2));
  applyMergeAlgorithm(new act.InsertAction(-1, "2"), new ts.Timestamp(2, 2));
  applyMergeAlgorithm(new act.InsertAction(-1, "3"), new ts.Timestamp(3, 2));
  applyMergeAlgorithm(new act.InsertAction(-1, "0"), new ts.Timestamp(0, 2));
}
