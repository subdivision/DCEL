var DCEL = DCEL || {};

//----------------------------------------------------------------------------
DCEL.Mesh = function(id)
{
  this.id = id || -1;
  this.v = [];
  this.e = [];
  this.f = [];
  this.pcg = undefined; //Point Cloud THREE.Geometry Object
};

DCEL.Mesh.prototype.display = function(Scene,
                                       MeshColor, Dashed,
                                       NormColor, ShowNorms)
{
  var i = 0;
  var N = this.e.length;
  var verticesGeometry = new THREE.Geometry();
  for( i = 0; i < N ; ++i )
  {
    var edge = this.e[i];
    var v1 = edge.he.vert.pt;
    var v2 = edge.he.twin.vert.pt;
    var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push( v1, v2 );
    verticesGeometry.vertices.push(v1);
    lineGeometry.computeLineDistances();
    var lineMaterial;
    if( Dashed == undefined || !Dashed )
      lineMaterial = new THREE.LineBasicMaterial();
    else // dashed = true
      lineMaterial = new THREE.LineDashedMaterial({dashSize: 0.5,
                                                   gapSize: 1});
    lineMaterial.color = MeshColor;
    edge.go = new THREE.Line( lineGeometry, lineMaterial );
    Scene.add(edge.go);
  }
  if( ShowNorms != undefined && ShowNorms )
  {
    N = this.v.length;
    for(i = 0; i < N; ++i)
    {
      var vert = this.v[i];
      vert.ngo = new THREE.ArrowHelper( vert.nr, vert.pt, 1, NormColor );
      Scene.add(vert.ngo);
    }
  }
  var verticesMaterial = new THREE.ParticleBasicMaterial();
  verticesMaterial.color = MeshColor;
  verticesMaterial.size = 0.2;
  this.pcg = new THREE.ParticleSystem(verticesGeometry, verticesMaterial);
  Scene.add(this.pcg);
};

DCEL.Mesh.prototype.hide = function(Scene)
{
  if(this.e[0] == undefined || this.e[0].go == undefined)
    return;
  var i = 0;
  var	N = this.e.length;
  for( i = 0; i < N ; ++i )
  {
    var edge = this.e[i];
    Scene.remove(edge.go);
    edge.go = undefined;
  }
  N = this.v.length;
  for(i = 0; i < N; ++i)
  {
    var vert = this.v[i];
    if(vert.ngo != undefined)
    {
      Scene.remove(vert.ngo);
      vert.ngo = undefined;
    }
  }
  if(this.pcg != undefined)
  {
    Scene.remove(this.pcg);
    this.pcg = undefined;
  }
};

//----------------------------------------------------------------------------
DCEL.Vertex = function(id,x,y,z)
{
  x = x || 0;
  y = y || 0;
  z = z || 0;
  this.id = id || -1;
  this.pt = new THREE.Vector3(x,y,z);
  this.nr = new THREE.Vector3(x,y,z);
  this.ngo = undefined; //Normal Vector THREE.Geometry object
  this.he = undefined;
};

DCEL.Vertex.prototype.setPos = function(x,y,z)
{
  this.pt.set(x,y,z)
};

DCEL.Vertex.prototype.copyPos = function(p)
{
  this.pt = p.clone();
};

DCEL.Vertex.prototype.setNorm = function(x,y,z)
{
  this.nr.set(x,y,z);
  this.nr.normalize();
};

DCEL.Vertex.prototype.getConnectingEdge = function(other)
{
  var curr = this.he;
  var res = undefined;
  do
  {
    if(curr == undefined || curr.twin == undefined)
      break;
    if(curr.twin.vert.id == other.id)
      res = curr.edge;
    curr = curr.twin.next;
  }while(curr != this.he && res == undefined);
  return res;
}

DCEL.Vertex.prototype.getElems = function()
{
  var res = [[],[]];
  var curr = this.he;
  var i = 0;
  do
  {
    res[0][i] = curr.face;
    res[1][i] = curr.edge; 
    curr = curr.twin.next;
    ++i;
  }while(curr != this.he);
  return res;
};

//----------------------------------------------------------------------------
DCEL.Edge = function(id)
{
  this.id = id || -1;
  this.he = undefined;
  this.go = undefined;
};

//----------------------------------------------------------------------------
DCEL.Face = function(id)
{
  this.id = id || -1;
  this.he = undefined;
};

DCEL.Face.prototype.getElems = function()
{
  var res = [[],[]];
  var curr = this.he;
  var i = 0;
  do
  {
    res[0][i] = curr.vert;
    res[1][i] = curr.edge; 
    curr = curr.next;
    ++i;
  }while(curr != this.he);
  return res;
};

//----------------------------------------------------------------------------
DCEL.Halfedge = function()
{
  this.next = undefined;
  this.prev = undefined;
  this.twin = undefined;
  this.vert = undefined;
  this.edge = undefined;
  this.face = undefined;
};

//============================= END OF FILE ==================================

