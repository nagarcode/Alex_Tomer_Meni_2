class Timestamp {
  constructor(index, id) {
    this.index = index;
    this.id = id;
  }
  static greater(a, b) {
    if (a.index > b.index) return a;
    if (b.index > a.index) return b;
    return max(a.id, b.id);
  }
  greaterThan(b){
      if (this.index > b. index) return true;
      if(b.index > this.index) return false;
      return this.id > b.id;
  }
  str(){
    return 'index: ' + this.index+ ', id: ' + this.id;
  }
}
module.exports.Timestamp = Timestamp;