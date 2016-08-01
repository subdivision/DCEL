//----------------------------------------------------------------------------
var DCEL = DCEL || {};

DCEL.IdGenerator = function(start, step)
{
  this.curr = start || 0;
  this.step = step || 1;
} 

DCEL.IdGenerator.prototype.getId = function()
{
  this.curr += this.step;
  return this.curr;
}

//============================= END OF FILE ==================================

