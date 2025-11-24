// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Permite que cualquier frontend se conecte
app.use(cors()); 

const server = http.createServer(app);

// Configuración de Socket.io para permitir conexiones desde cualquier origen
const io = new Server(server, {
  cors: {
    origin: "*", // Cambia esto por la URL de tu frontend en producción
    methods: ["GET", "POST"]
  }
});

// Ruta de estado simple
app.get('/', (req, res) => {
  res.send('Servidor WebSocket de Chat está activo.');
});

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Unirse a un "room" (chat específico)
  socket.on('join_chat', (contactName) => {
    socket.join(contactName);
    console.log(`Usuario ${socket.id} se unió al chat con: ${contactName}`);
  });

  // Escuchar mensaje del cliente
  socket.on('send_message', (data) => {
    // data espera: { id, text, sender, contactName }
    console.log('Mensaje recibido:', data);

    // 1. ✅ CORRECCIÓN CLAVE: Reenviar el mensaje a TODOS en la sala EXCEPTO el emisor.
    // El emisor ya lo vio gracias a la "Optimistic UI" en el frontend.
    socket.to(data.contactName).emit('receive_message', data); 

    // 2. Simulación de respuesta del Servidor
    if (data.contactName === 'Servidor Render') {
      setTimeout(() => {
        let replyText = "Mensaje recibido en el servidor.";

        if (data.text.toLowerCase().includes('hola')) {
          replyText = "¡Hola desde el servidor Render! 🚀";
        } else if (data.text.toLowerCase().includes('api') || data.text.toLowerCase().includes('websocket')) {
          replyText = "La API está funcionando correctamente vía WebSockets.";
        }

        const replyData = {
          id: Date.now() + 1, // Usar un ID ligeramente diferente
          text: replyText,
          sender: 'contact',
          contactName: data.contactName
        };

        // Emitimos la respuesta a la sala (todos la reciben)
        io.to(data.contactName).emit('receive_message', replyData);

      }, 1000);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
