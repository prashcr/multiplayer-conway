# Multiplayer Conway's Game of Life

### How to run

Have a recent version of Node.js installed

```
npm install
npm start
```

Visit http://localhost:3000 to view the game running

### Technical details

* Express is used to render views to the client and manage sessions which are accessible from the websocket code
* All the game logic resides on the back-end, the front-end is only responsible for sending click events, drawing game state received from the server and displaying game UI
* There is no authentication but session cookies are used as identities and to persist user information such as their color between connections. The cookies only contain the sessionId, session data is stored on the back-end.
* Primus is a Websocket interface that supports a number of Node.js Websocket implementations and allows easy switching between them. It provides just the right amount of abstraction and saved me from a Windows-specific bug in a WebSocket library I previously used.
