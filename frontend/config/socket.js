import { io } from "socket.io-client";
import { BASE_URL } from "./api"; // you already have this

let socket;
export const getSocket = (token) => {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ["websocket"],
      auth: { token },
    });
  }
  return socket;
};
