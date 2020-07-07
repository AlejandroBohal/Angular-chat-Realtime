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
  writing: string;
  clientId: string;
  constructor() {
    this.clientId = 'id-'+ new Date().getTime() + '-' + Math.random().toString(36).substr(2);
  }

  ngOnInit(): void {
    this.client = new Client();
    this.client.webSocketFactory = ()=>{
      return new SockJS("https://chat-storage-mdb.herokuapp.com/chat-websocket");
    }
    this.client.onConnect = (frame) =>{
      this.conectado=true;
      this.client.subscribe('/chat/message',e =>{
        this.listenMessages(e);
      })
      this.client.subscribe('/chat/writing',e =>{
        this.writing = e.body;
        setTimeout(() =>this.writing ='',2500)
      });
      this.client.subscribe('/chat/history/'+this.clientId,e=>{
        const history = JSON.parse(e.body) as Message[];
        this.messages = history.map( m =>{
          m.date = new Date();
          return m;
        }).reverse();
      })
      this.client.publish({destination:'/app/history',body: this.clientId});
      this.message.type ='NEW_USER';
      this.client.publish({destination: '/app/message',body: JSON.stringify(this.message)});
    }

    this.client.onDisconnect = (frame) =>{
      this.conectado=false;
      this.message = new Message();
      this.messages = [];
    }

  }
  conectar():void{
    this.client.activate();
  }
  desconectar():void{
    this.client.deactivate();
  }
  enviarMensaje():void{
    this.message.type ='MESSAGE';
    this.client.publish({destination: '/app/message',body: JSON.stringify(this.message)});
    this.message.text= '';
  }
  writingEvent(): void{
    this.client.publish ({destination: '/app/writing',body: this.message.username});
  }
  private listenMessages(e): void{
    let message: Message = JSON.parse(e.body) as Message;
    message.date = new Date(message.date);
    if(!this.message.color && message.type == 'NEW_USER' && this.message.username == message.username){
      this.message.color = message.color;
    }
    this.messages.push(message);
  }
}
