import io from 'socket.io-client';
import config from '../../app.config'
const PORT = config['PORT']

const socket = io(`http://192.168.1.177:${PORT}`, { autoConnect: false });

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

export function connectToSocket() {
  socket.connect();
}

export function disconnectFromSocket() {
  socket.disconnect();
}
