export default class Paginator {
  items: any[]
  pageSize: number;

  constructor(items: any[], pageSize: number = 10) {
    this.items = items;
    this.pageSize = pageSize;
  }

  getPage(page: number): any[] {
    return this.items.slice((page - 1) * this.pageSize, page * this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.items.length / this.pageSize);
  }
}
