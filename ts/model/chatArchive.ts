export interface Message {
  from: string;
  to: string;
  text: string;
  time: Time;
  // TODO: maybe an additional field for special JSON symbols?
}

export interface Time {
  round: number;
  current_message: number;
}

export interface ChatArchiveInfo {
  messages: { [key: string]: Message[] };
  round: number;
  current_message: number;
}

function getKey(m: Message | string[]): string {
  if (Array.isArray(m)) {
    return m.sort().join("");
  }
  return [m.to, m.from].sort().join("");
}

export class ChatArchive {
  private messages: { [key: string]: Message[] } = {};

  private round = 0;
  private current_message = 0;

  public export(): ChatArchiveInfo {
    return {
      messages: this.messages,
      round: this.round,
      current_message: this.current_message,
    };
  }

  public import(info: ChatArchiveInfo): void {
    this.messages = info.messages;
    this.round = info.round;
    this.current_message = info.current_message;
  }

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

  public getCurrentTime(): Time {
    return { round: this.round, current_message: this.current_message };
  }
  public increaseRound() {
    this.round++;
  }
  public increaseMessageCount() {
    this.current_message++;
  }
  public resetTime() {
    this.round = 0;
    this.current_message = 0;
  }
}
