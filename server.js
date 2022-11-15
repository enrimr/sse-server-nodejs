const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));



app.get('/status', (request, response) => response.json({clients: clients.length}));
app.get('/current_status', (request, response) => {
  console.log("current_status")
  console.log(events)
  const eventId = request.query['eventId']
  const currentStatus = events[eventId]
  return response.json(
  {
    eventId,
    currentStatus
  })
});

const PORT = 3001;

let clients = [];
let facts = [];
let events = new Map();

// Middleware

function eventsHandler(request, response, next) {
  console.log("lele")
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    //const clientId = Date.now();
    const clientId = request.query['eventId']
    console.log("clientId: "+clientId);
    //const factsFiltered = facts.filter(fact => fact.info === clientId)
    ///console.log(factsFiltered)
    const data = `data: ${JSON.stringify(facts)}\n\n`;
    ///const data = `data: ${JSON.stringify(factsFiltered)}\n\n`;
    response.write(data);
    
    const newClient = {
      id: clientId,
      response
    };
    clients.push(newClient);
    
    events[clientId] = 'connected'

    request.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter(client => client.id !== clientId);
    });
}
  
app.get('/events', eventsHandler);

  // ...

function sendEventsToAll(newFact) {
    clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

function sendEventsToEachClient(newFact) {
  console.log(newFact)
  clients.forEach(client => {
    console.log(client.id)
    if (newFact.info === client.id) client.response.write(`data: ${JSON.stringify(newFact)}\n\n`)
  })
}

async function addFact(request, respsonse, next) {
    const newFact = request.body;
    events[newFact.info] = newFact.source;
    facts.push(newFact);
    respsonse.json(newFact)
    return sendEventsToEachClient(newFact);
}
  
app.post('/fact', addFact);


app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})