function sleepSync(millis) {
  console.log("Sleeping for " + millis + " milliseconds");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
// Include Nodejs' net module.
var split = require("split");
const Net = require("net");
const a = require("./input_parser");
const index = process.argv[2];
var inputParser = new a.InputParser("input-file-" + index + ".txt");
const neighbors = inputParser.parse();
const myID = inputParser.id;
const myPort = inputParser.port;
const initialString = inputParser.initialString;
var otherClients = [];/////
var numberOfOtherClients = 0;/////
//var vectorTimeStamp = InitialiseVectorTimeStamp();
var timeStamp = 0;

setTimeout(function(){
  connectToPeers();
}, 0); 

setTimeout(function(){
  setupServer(myPort);
} , 0);
//connectToPeers();

setTimeout(function() {
  InitialiseTimeStamp();
}, 0);

setTimeout(function(){
  RunLoop();
}, 0);

function connectToPeer(peer) {
  // Create a new TCP client.
  const client = new Net.Socket();

  otherClients[numberOfOtherClients] = client;/////
  numberOfOtherClients += 1;/////
  // Send a connection request to the server.
  client.connect({ port: peer.port, host: peer.host }),
    function () {
      // If there is no error, the server has accepted the request and created a new
      // socket dedicated to us.
      console.log("TCP connection established with the server.");

      // The client can now send data to the server by writing to its socket.
      //client.write("Hello, server.");
    };

  // The client can also receive data from the server by reading from its socket.
  var stream = client.pipe(split());

  stream.on("data", function (message) {
      console.log(`Message received from server: ${message.toString()}`);

      const update = ParseUpdateFromReceivedMessage(message.toString());
      const sendersTimeStamp = ParseTimeStampFromReceivedMessage(message.toString());
      const sendersID = ParseSendersIDFromReceivedMessage(message.toString());

      timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

      //TODO: Apply the merge algorithm.
  });

   // Request an end to the connection after the data has been received.
   /* client.end();
  });

  client.on("end", function () {
    console.log("Requested an end to the TCP connection");
  });*/
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
    //sleepSync(5000);
  });

  // When a client requests a connection with the server, the server creates a new
  // socket dedicated to that client.
  server.on("connection", function (socket) {
    console.log("A new connection has been established.");

    otherClients[numberOfOtherClients] = socket;
    numberOfOtherClients += 1;

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    //socket.write("Hello, client.\n");
    for(const operation of inputParser.actions){
      const updatedString = operation.apply(initialString);
      var message = updatedString + "*" + timeStamp.toString() + "*" + myID + "\n";
      socket.write(message);
      timeStamp += 1;

    }  


  var stream = socket.pipe(split());

  stream.on("data", message => {
    console.log(`Message received from client: ${message.toString()}`);

      //timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

      const update = ParseUpdateFromReceivedMessage(message.toString());
      const sendersTimeStamp = ParseTimeStampFromReceivedMessage(message.toString());
      const sendersID = ParseSendersIDFromReceivedMessage(message.toString());

      timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

      //TODO: Apply the merge algorithm.
  });
    // The server can also receive data from the client by reading from its socket.
    //stream.write("Hello there client!");
   /* socket.on("data", function (message) {
      console.log(`Message received from client: ${message.toString()}`);

      //timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

      const update = ParseUpdateFromReceivedMessage(message.toString());
      const sendersTimeStamp = ParseTimeStampFromReceivedMessage(message.toString());
      const sendersID = ParseSendersIDFromReceivedMessage(message.toString());

      timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;
    socket.write
      //socket.end();

      //TODO: Apply the merge algorithm.
    });*/

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
   // socket.on("end", function () {
      //console.log("Closing connection with the client");
    //});
    //socket.on("error", function (err) {
     // console.log(`Error: ${err}`);
   // });
  });
  return server;
}

//sleepSync(10000);

//console.log((inputParser.actions).length);

function ParseUpdateFromReceivedMessage(message){

  const messageTokens = message.split("*");

  return messageTokens[0];

}

function ParseTimeStampFromReceivedMessage(message){

  const messageTokens = message.split("*");

  return messageTokens[1];

}

function ParseSendersIDFromReceivedMessage(message){

  const messageTokens = message.split("*");

  return messageTokens[2];

}

function InitialiseTimeStamp(){
  timeStamp = 0;
}

function RunLoop(){

  for(const operation of inputParser.actions){
  const updatedString = operation.apply(initialString);
  var message = updatedString + "*" + timeStamp.toString() + "*" + myID + "\n";

  //console.log(otherClients.length);

  for(const client of otherClients){
    //setTimeout(function(){
      //client.write(message);
      //timeStamp += 1;
    //}, 1000);
    client.write(message);
    timeStamp += 1;
  }

  setTimeout(function(){}, 5000);
  }


}