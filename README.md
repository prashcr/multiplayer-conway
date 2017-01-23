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
* Primus is a Websocket interface that provides just the right amount of abstraction between a framework and directly using a WebSocket library. It also allows easy switching between WebSocket libraries (e.g. ws, uws, sockjs, faye, engineIO)
* There is a deliberate reset and increased delay in the gameTick() interval after a player has clicked the canvas. This is to allow the player enough time to draw as they please.
* Before deploying to production, I would configure Primus to use Redis for clustering, Express to use Redis as a session store, minify + serve the contents of the public folder as well as the generated Primus client library, and set NODE_ENV to "production".
* Nonetheless, the game handled over 100 connections without issues on my localhost, and should reasonably handle more than that.
