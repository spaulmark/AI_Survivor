export class PriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  private parent(i: number) {
    return Math.floor((i - 1) / 2);
  }
  private left(i: number) {
    return 2 * i + 1;
  }
  private right(i: number) {
    return 2 * i + 2;
  }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private heapifyUp(i: number) {
    while (
      i > 0 &&
      this.heap[i].priority > this.heap[this.parent(i)].priority
    ) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private heapifyDown(i: number) {
    let largest = i;
    const left = this.left(i);
    const right = this.right(i);

    if (
      left < this.heap.length &&
      this.heap[left].priority > this.heap[largest].priority
    ) {
      largest = left;
    }

    if (
      right < this.heap.length &&
      this.heap[right].priority > this.heap[largest].priority
    ) {
      largest = right;
    }

    if (largest !== i) {
      this.swap(i, largest);
      this.heapifyDown(largest);
    }
  }

  public enqueue(item: T, priority: number) {
    this.heap.push({ item, priority });
    this.heapifyUp(this.heap.length - 1);
  }

  public dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const root = this.heap[0].item;
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return root;
  }

  public peek(): T | undefined {
    return this.heap[0]?.item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}
