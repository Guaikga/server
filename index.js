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
  origin: "http://localhost:5173", // En producción, cambia esto por la URL de tu frontend en Render/Vercel
  methods: ["GET", "POST"]
 }
});

// Ruta de estado simple
app.get('/', (req, res) => {
  res.send('Servidor WebSocket de Chat está activo.');
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
  // data espera tener: { contactName, text, sender, id, senderId }
  // `senderId` es el id único del usuario que envía el mensaje (mandado desde el front)
  console.log('[LOG DEL SERVIDOR] Mensaje recibido:', data);

  // MODIFICACIÓN: Reenviar el mensaje a TODOS en la sala EXCEPTO el emisor
  socket.to(data.contactName).emit('receive_message', data);

  // Simulación de respuesta del Servidor (IA o Contacto)
  if (data.contactName === 'Servidor Render') {
    setTimeout(() => {
      let replyText = data.text;

      if (data.text.toLowerCase().includes('hola')) {
        replyText = data.text;
      } else if (data.text.toLowerCase().includes('api')) {
        replyText = "La API está funcionando correctamente vía WebSockets.";
      }

      const replyData = {
        id: socket.id,
        text: replyText,
        sender: 'contact',
        senderId: 'contact-server',
        contactName: data.contactName
      };

      // MODIFICACIÓN: Enviar la respuesta a todos en la sala EXCEPTO al emisor original
      socket.to(data.contactName).emit('receive_message', replyData);

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
