function sleepSync(millis) {
  console.log("Sleeping for " + millis + " milliseconds");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, millis);
}
// Include Nodejs' net module.
var split = require("split");
const fs = require("fs");
const q = require("q");
var join = require("join").Join.create();
const Net = require("net");
const a = require("./input_parser");
const ts = require("./timestamp");
const action = require("./action");
const index = process.argv[2];
var inputParser = new a.InputParser("input-file-" + index + ".txt");
const neighbors = inputParser.parse();
const myID = inputParser.id;
const myPort = inputParser.port;
var initialString = inputParser.initialString;
var otherClients = []; /////
var numberOfOtherClients = 0; /////
var operations = ParseOperations();
//var vectorTimeStamp = InitialiseVectorTimeStamp();
var timeStamp = 0;
var otherClientsConnected = false;
var goodbyesCounter = 0;
var connectionsClosedCounter = 0;
var socketsToDestroy = [];
var areSocketsDestroyed = false;

//console.log(neighbors.length);

connectToPeers();

if(!otherClientsConnected && numberOfOtherClients == neighbors.length){
  otherClientsConnected = true;
  ClientLoop();
  //RunLoop();
}

setupServer(myPort);


InitialiseTimeStamp();

//InitialiseSystem();

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

  otherClients[numberOfOtherClients] = client; /////
  socketsToDestroy.push(client);
  numberOfOtherClients += 1; /////
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

    if(message.toString() == "goodbye"){
      goodbyesCounter += 1;
      if(goodbyesCounter == neighbors.length){
        for(const socketToDestroy of socketsToDestroy)
          socketToDestroy.destroy();
      }
    }
    else if(message.toString() != ""){
      const updateOperation = ParseUpdateOperationFromReceivedMessage(message.toString());
      const sendersTimeStamp = ParseTimeStampFromReceivedMessage(
        message.toString()
      );
      const sendersID = ParseSendersIDFromReceivedMessage(message.toString());

      timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

      var updateOperationTokens = updateOperation.split(" ");
      var actionToBeApplied = undefined;
      var timeStampForActionToBeApplied = new ts.Timestamp(timeStamp, parseInt(sendersID));

      if((updateOperation.split(" "))[0] == "insert")
        actionToBeApplied = (action.InsertAction).fromArr(updateOperation.split(" "));
      else
        actionToBeApplied = (action.DeleteAction).fromArr(updateOperation.split(" "));


      applyMergeAlgorithm(actionToBeApplied, timeStampForActionToBeApplied);
    } 
  });

  // Request an end to the connection after the data has been received.
  ///* client.end();
  //});
  client.on("close", () => {
    console.log("connection is now closed. Debug flag 1");
    connectionsClosedCounter += 1;
    if(connectionsClosedCounter == neighbors.length){
      console.log(`Client ${myID} replica is: ${initialString}`);
      console.log(`Client ${myID} is exiting`);
      process.exit();
    }
  });

  //client.on("end", function () {
    //console.log("Requested an end to the TCP connection");
  //});*/
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
    otherClients.push(socket);
    numberOfOtherClients += 1;

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    //socket.write("Hello, client.\n");
    /*for(const operation of ParseOperations()){
      var message = operation + "*" + timeStamp.toString() + "*" + myID + "\n";
      socket.write(message);
      timeStamp += 1;

    }*/

    var stream = socket.pipe(split());

    stream.on("data", (message) => {
      console.log(`Message received from client: ${message.toString()}`);

      if(message.toString() == "goodbye"){
        goodbyesCounter += 1;
        if(goodbyesCounter == neighbors.length){
          for(const socketToDestroy of socketsToDestroy)
            socketToDestroy.destroy();
        }
      }

      else if(message.toString() != ""){
        const updateOperation = ParseUpdateOperationFromReceivedMessage(message.toString());
        const sendersTimeStamp = ParseTimeStampFromReceivedMessage(message.toString());
        const sendersID = ParseSendersIDFromReceivedMessage(message.toString());

        timeStamp = Math.max(timeStamp, sendersTimeStamp) + 1;

        var updateOperationTokens = updateOperation.split(" ");
        var actionToBeApplied = undefined;
        var timeStampForActionToBeApplied = new ts.Timestamp(timeStamp, parseInt(sendersID));

        if((updateOperation.split(" "))[0] == "insert")
          actionToBeApplied = (action.InsertAction).fromArr(updateOperation.split(" "));
        else
          actionToBeApplied = (action.DeleteAction).fromArr(updateOperation.split(" "));


        applyMergeAlgorithm(actionToBeApplied, timeStampForActionToBeApplied);
      }  

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
    if(!otherClientsConnected && numberOfOtherClients == neighbors.length){
      otherClientsConnected = true;
      ClientLoop();
      //RunLoop();
    }
    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on("end", function () {
    console.log("Closing connection with the client");
    });

    socket.on("close", () => {
      console.log("connection is now closed. Debug flag 1");
      connectionsClosedCounter += 1;
      if(connectionsClosedCounter == neighbors.length){
        console.log(`Client ${myID} replica is: ${initialString}`);
        console.log(`Client ${myID} is exiting`);
        process.exit();
      }
    });
    //socket.on("error", function (err) {
    // console.log(`Error: ${err}`);
    // });
  });

  //if(numberOfOtherClients == neighbors.length)
    //ClientLoop();

  return server;
}

//sleepSync(10000);

//console.log((inputParser.actions).length);

function ParseUpdateOperationFromReceivedMessage(message) {
  const messageTokens = message.split("*");

  return messageTokens[0];
}

function ParseTimeStampFromReceivedMessage(message) {
  const messageTokens = message.split("*");

  return messageTokens[1];
}

function ParseSendersIDFromReceivedMessage(message) {
  const messageTokens = message.split("*");

  return messageTokens[2];
}

async function InitialiseTimeStamp(){
  timeStamp = 0;
}

async function InitialiseSystem(){

  const completeConnectionToClients = await connectToPeers();
  const generateServer = await setupServer(myPort, completeConnectionToClients);
  await InitialiseTimeStamp(generateServer);

  console.log("initialisation stage is complete!");

}

function ParseOperations(){

  var dataRead = fs.readFileSync("./input-file-" +  process.argv[2] + ".txt", {encoding : "utf8", flag : "r"});

  const dataReadParts = dataRead.split("\r\n");

  var parsingFlag = 9999999;
  var operations = [];

  for(i = 5; i < dataReadParts.length; i++){
    if(i < parsingFlag){
      if(dataReadParts[i] == "")
        parsingFlag = i;
    
    }
    else if(i > parsingFlag){
      if(dataReadParts[i] == "")
        break;
      else
        operations.push(dataReadParts[i]);
    }
  }

  return operations;

}

function RunLoop(){

  for(const operation of ParseOperations()){
    var message = operation + "*" + timeStamp.toString() + "*" + myID + "\n";

    for(const client of otherClients){
      client.write(message);
      timeStamp += 1;
    }

    //setTimeout(function () {}, 5000);
  }
}

function AddTaskToEventLoop(item){

  initialString = item.apply(initialString);
  /*var message = operations[0] + "*" + timeStamp.toString() + "*" + myID + "\n";
  operations.shift();

  for(const client of otherClients){
    client.write(message);
    timeStamp += 1;
  }*/
}

function SendGoodbye(){
  for(const client of otherClients){
    client.write("goodbye\n");
  }
}

function foo1(){
  console.log("Hello from foo1!");
}

function foo2(){
  console.log("Hello from foo2!");
}

function ClientLoop(){
 
  
  for(const actionToBeApplied of inputParser.actions){
    AddTaskToEventLoop(actionToBeApplied, join.add());
    //timeStamp += 1;
    //var message = operations[0] + "*" + timeStamp.toString() + "*" + myID + "\n";
    //operations.shift();
    //join.then(function(){
    //console.log("Hello from join!!!");
     // });

    for(const client of otherClients){
      timeStamp += 1;
      var message = operations[0] + "*" + timeStamp.toString() + "*" + myID + "\n";
      client.write(message);
      timeStamp += 1;
    }
    operations.shift();

     //join.then(function(){
    //console.log("Hello from join!!!");
    //});
    //actionToBeApplied.AddTask(join.add());
    //SendGoodbye(join.then());
  }

  SendGoodbye(join.then());

  //while(true){
    //if(goodbyesCounter == )
  //}
  
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
  // console.log(laterActions);
  workingString = performActionAndLog(timestamp, workingString, action);
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
    previousString: prevString,
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