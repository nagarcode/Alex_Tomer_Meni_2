function sleepSync(millis) {
  console.log("Sleeping for " + millis + " milliseconds");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
// Include Nodejs' net module.
const Net = require("net");
const a = require("./input_parser");
const index = process.argv[2];
var inputParser = new a.InputParser("input-file-" + index + ".txt");
const neighbors = inputParser.parse();
const myID = inputParser.id;
const myPort = inputParser.port;
const initialString = inputParser.initialString;
setupServer(myPort);
connectToPeers();

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
