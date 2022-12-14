export class CycleQueue<T> {
  private _queue: T[];

  public get head() {
    return this._queue[0];
  }

  public get tail() {
    return this._queue[this._queue.length - 1];
  }

  constructor(initArray: T[] = []) {
    this._queue = initArray;
  }

  add(item: T) {
    this._queue.push(item);
  }

  next() {
    const head = this._queue.shift();
    this._queue.push(head);

    return head;
  }
}
