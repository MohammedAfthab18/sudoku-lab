export class InvalidBoardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBoardError";
  }
}
