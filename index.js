// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuración de Socket.io para permitir conexiones desde cualquier origen (CORS)
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, cambia esto por la URL de tu frontend en Render/Vercel
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Unirse a un "room" (chat específico) basado en el nombre del contacto
  socket.on('join_chat', (contactName) => {
    socket.join(contactName);
    console.log(`Usuario se unió al chat con: ${contactName}`);
  });

  // Escuchar mensaje del cliente
  socket.on('send_message', (data) => {
    // data espera tener: { contactName, text, sender }
    console.log('Mensaje recibido:', data);

    // 1. Reenviar el mensaje al mismo usuario (para confirmación) o a otros en la sala
    // En un chat real entre dos humanos, usarías: socket.to(data.contactName).emit(...)
    // Para este demo, simplemente confirmamos recepción:
    socket.emit('receive_message', data);

    // 2. Simulación de respuesta del Servidor (IA o Contacto)
    // Esto reemplaza tu setTimeout del frontend
    setTimeout(() => {
      let replyText = "Mensaje recibido en el servidor.";

      if (data.text.toLowerCase().includes('hola')) {
        replyText = "¡Hola desde el servidor Render! 🚀";
      } else if (data.text.toLowerCase().includes('api')) {
        replyText = "La API está funcionando correctamente vía WebSockets.";
      }

      const replyData = {
        id: Date.now(),
        text: replyText,
        sender: 'contact',
        contactName: data.contactName
      };

      // Emitimos la respuesta a la sala de ese contacto
      io.to(data.contactName).emit('receive_message', replyData);

    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});