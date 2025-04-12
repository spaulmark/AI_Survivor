export interface Message {
  from: string;
  to: string;
  text: string;
  time: Time;
}

export interface Time {
  round: number;
  current_message: number;
}

export interface ChatArchiveInfo {
  messages: { [name1: string]: { [name2: string]: Message[] } };
  round: number;
  current_message: number;
}

function getKey(m: Message | string[]): string[] {
  if (Array.isArray(m)) {
    return m.sort();
  }
  return [m.to, m.from].sort();
}

export class ChatArchive {
  private messages: { [name1: string]: { [name2: string]: Message[] } } = {};

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

    if (!(key[0] in this.messages)) {
      this.messages[key[0]] = {};
    }
    if (!(key[1] in this.messages[key[0]])) {
      this.messages[key[0]][key[1]] = [m];
      return;
    }
    this.messages[key[0]][key[1]].push(m);
  }

  public getManyChatlogs(
    hero: string,
    villains: string[]
  ): { [name: string]: Message[] } {
    const result: any = {};
    for (const villain of villains) {
      result[villain] = this.getChatlog(hero, villain);
    }
    return result;
  }

  public getChatlog(hero: string, villian: string): Message[] {
    const key = getKey([hero, villian]);
    if (!(key[0] in this.messages)) return [];
    if (!(key[1] in this.messages[key[0]])) return [];
    return this.messages[key[0]][key[1]];
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
