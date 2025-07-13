import { WebSocketServer } from "ws";
import * as crypto from "crypto";
import type { StateFileInfo, VisualizerMessage } from "./types.js";

export class VisualizerServer {
  private wss: WebSocketServer | null = null;
  private port: number;
  private token: string;
  private currentStates: StateFileInfo[] = [];

  constructor(port: number = 8080) {
    this.port = port;
    this.token = this.generateToken();
  }

  start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    console.log(
      `\\n🚀 Elevo Visualizer Server started on ws://localhost:${this.port}`
    );
    console.log(`🔑 Token: ${this.token}`);
    console.log(
      `🌐 Open visualizer at: http://localhost:3000?token=${this.token}\\n`
    );

    this.wss.on("connection", (ws, req) => {
      console.log("New visualizer connection");

      // Send initial data
      this.sendMessage(ws, {
        type: "initial_data",
        data: this.currentStates,
        token: this.token,
        timestamp: Date.now(),
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error("Invalid message from client:", error);
        }
      });

      ws.on("close", () => {
        console.log("Visualizer disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log("Visualizer server stopped");
    }
  }

  updateStates(states: StateFileInfo[]): void {
    this.currentStates = states;

    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          this.sendMessage(client, {
            type: "state_update",
            data: states,
            token: this.token,
            timestamp: Date.now(),
          });
        }
      });
    }
  }

  private sendMessage(ws: any, message: VisualizerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send message to client:", error);
    }
  }

  private handleClientMessage(ws: any, message: any): void {
    // Handle client messages if needed (e.g., authentication, requests)
    if (message.type === "ping") {
      this.sendMessage(ws, {
        type: "initial_data",
        data: "pong",
        token: this.token,
        timestamp: Date.now(),
      });
    }
  }

  private generateToken(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  getToken(): string {
    return this.token;
  }

  getPort(): number {
    return this.port;
  }
}
