import { Component, OnInit } from '@angular/core';
import {Client} from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import {Message} from './models/message';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  private client: Client;
  conectado:boolean = false;
  message: Message = new Message();
  messages: Message[] = [];
  constructor() { }

  ngOnInit(): void {
    this.client = new Client();
    this.client.webSocketFactory = ()=>{
      return new SockJS("http://localhost:8080/chat-websocket");
    }
    this.client.onConnect = (frame) =>{
      console.log('Conectados: ' + this.client.connected + ':' + frame);
      this.conectado=true;
      this.client.subscribe('/chat/message',e =>{
        let message: Message = JSON.parse(e.body) as Message;
        message.date = new Date(message.date);
        this.messages.push(message);

      })
    }
    this.client.onDisconnect = (frame) =>{
      console.log('Desconectados: ' + !this.client.connected + ':' + frame);
      this.conectado=false;

    }

  }
  conectar():void{
    this.client.activate();
  }
  desconectar():void{
    this.client.deactivate();
  }
  enviarMensaje():void{
    this.client.publish({destination: '/app/message',body: JSON.stringify(this.message)});
    this.message.text= '';
  }

}
