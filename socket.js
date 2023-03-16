import { Server } from "socket.io";

let io;

const socketIO = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: "*",
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
};

export default socketIO;
