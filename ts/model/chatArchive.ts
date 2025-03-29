import { Time } from "./time";

export interface Message {
  from: string;
  to: string;
  text: string;
  time: Time;
  // TODO: maybe an additional field for special symbols?
}

function getKey(m: Message | string[]): string {
  if (Array.isArray(m)) {
    return m.sort().join("");
  }
  return [m.to, m.from].sort().join("");
}

export class ChatArchive {
  private messages: { [key: string]: Message[] } = {};

  public addMessage(m: Message): void {
    const key = getKey(m);
    if (key in this.messages) {
      this.messages[key].push(m);
    } else {
      this.messages[key] = [m];
    }
  }
  public getChatlog(hero: string, villian: string): Message[] {
    const key = getKey([hero, villian]);
    if (key in this.messages) return this.messages[key];
    else return [];
  }
}
