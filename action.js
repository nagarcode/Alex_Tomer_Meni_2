class DeleteAction {
  constructor(index) {
    this.index = index;
  }
  static fromArr(arr) {
    return new DeleteAction(parseInt(arr[1]));
  }
  apply(str) {
    if(this.index < 0 || this.index > str.length) return str;
    return str.slice(0, this.index) + str.slice(this.index + 1);
  }
  str(){
    return 'delete '+ this.index;
  }
}
class InsertAction {
  constructor(index, toAppend) {
    this.index = index;
    this.toAppend = toAppend;
  }
  static fromArr(arr) {
    if (arr.length < 3) return new InsertAction(-1, arr[1]);
    return new InsertAction(parseInt(arr[2]), arr[1]);
  }
  apply(str) {
    if (this.index == -1) {
      return str + this.toAppend;
    }
    if(this.index < 0 || this.index > str.length) return str;
    return str.slice(0, this.index) + this.toAppend + str.slice(this.index);
  }
  str(){
    var toRet = 'insert ';
    if(this.index != -1) toRet += this.index;
    toRet += this.toAppend;
    return toRet;
  }
}
module.exports.DeleteAction = DeleteAction;
module.exports.InsertAction = InsertAction;
