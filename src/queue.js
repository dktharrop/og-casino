export default class Queue {
    constructor() {
      this.items = []
      this.isProcessing = false
    }
  
    enqueue(element) {
      this.items.push(element)
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  
    isEmpty() {
      return this.items.length === 0;
    }
  
    peek() {
      if (this.isEmpty()) {
        return "Queue is empty"
      }
      return this.items[0];
    }

    async processQueue() {
        this.isProcessing = true;
        while (this.commands.length > 0) {
          const command = this.commands.shift();
          await executeCommand(command);
        }
        this.isProcessing = false;
      }
  }