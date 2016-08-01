//----------------------------------------------------------------------------
var DCEL = DCEL || {};

DCEL.createTorus = function(MeshSize)
{
  var IdGen = new DCEL.IdGenerator();
  var IntRadius = 10;
  var ExtRadius = 20;
  var UpZ =  5.0;
  var DnZ = -5.0;
  var Mesh = new DCEL.Mesh(IdGen.getId());

  var i, t, ct, st, IntX, IntY, ExtX, ExtY;
  var IntUpPts = [];
  var IntDnPts = [];
  var ExtUpPts = [];
  var ExtDnPts = [];
  var ParamStep = 2.0 * Math.PI / MeshSize;
  for(i = 0; i < MeshSize; ++i)
  {
    t = i*ParamStep;
    ct = Math.cos(t);
    st = Math.sin(t)
    IntX = IntRadius * ct;
    IntY = IntRadius * st;
    ExtX = ExtRadius * ct;
    ExtY = ExtRadius * st;
    IntUpPts[i] = new DCEL.Vertex(IdGen.getId(), IntX, IntY, UpZ);
    IntDnPts[i] = new DCEL.Vertex(IdGen.getId(), IntX, IntY, DnZ);
    ExtUpPts[i] = new DCEL.Vertex(IdGen.getId(), ExtX, ExtY, UpZ);
    ExtDnPts[i] = new DCEL.Vertex(IdGen.getId(), ExtX, ExtY, DnZ);
    //IntUpPts[i].setNorm(-IntX, -IntY, UpZ);
    //IntDnPts[i].setNorm(-IntX, -IntY, DnZ);
    //ExtUpPts[i].setNorm(ExtX, ExtY, UpZ);
    //ExtDnPts[i].setNorm(ExtX, ExtY, DnZ);
    IntUpPts[i].setNorm(-ct, -st,  1);
    IntDnPts[i].setNorm(-ct, -st, -1);
    ExtUpPts[i].setNorm( ct,  st,  1);
    ExtDnPts[i].setNorm( ct,  st, -1);
  }
  var EdgeDB = {};
  var UppFaces = DCEL.create4VertFacesRing(IdGen, EdgeDB,
                                           IntUpPts, ExtUpPts, true);
  var BotFaces = DCEL.create4VertFacesRing(IdGen, EdgeDB,
                                           IntDnPts, ExtDnPts, false);
  var IntFaces = DCEL.create4VertFacesRing(IdGen, EdgeDB,
                                           IntUpPts, IntDnPts, false);
  var ExtFaces = DCEL.create4VertFacesRing(IdGen, EdgeDB,
                                           ExtUpPts, ExtDnPts, true);
  Mesh.v.extend(IntUpPts);
  Mesh.v.extend(IntDnPts);
  Mesh.v.extend(ExtUpPts);
  Mesh.v.extend(ExtDnPts);
  Mesh.f.extend(UppFaces);
  Mesh.f.extend(BotFaces);
  Mesh.f.extend(IntFaces);
  Mesh.f.extend(ExtFaces);
  var j = 0;
  for(i in EdgeDB)
    Mesh.e[j++] = EdgeDB[i];
  return Mesh;
}

//----------------------------------------------------------------------------
DCEL.create4VertFacesRing = function(IdGen, EdgeDB, IntPts, ExtPts, CCW)
{
  var Faces = [];
  var N = IntPts.length;
  var i;
  for(i = 0; i < N; ++i)
  {
    var i1 = IntPts[i];
    var i2 = IntPts[(i+1)%N];
    var e1 = ExtPts[i];
    var e2 = ExtPts[(i+1)%N];
    Faces[i] = DCEL.createFace(IdGen, EdgeDB,
                               (CCW?[e1, e2, i2, i1]:[e1, i1, i2, e2]));
  }
  return Faces;
}

//----------------------------------------------------------------------------
DCEL.createFace = function(IdGen, EdgeDB, Vs)
{
  var i;
  var N = Vs.length;
  var Edges = [];
  for(i = 0; i < N; ++i)
  {
    var MinId = Math.min(Vs[i].id, Vs[(i+1)%N].id);
    var MaxId = Math.max(Vs[i].id, Vs[(i+1)%N].id);
    var EdgeKey = "" + MinId + "-" + MaxId;
    Edges[i] = EdgeDB[EdgeKey];
    if(Edges[i] == undefined)
    {
      Edges[i] = new DCEL.Edge(IdGen.getId());
      EdgeDB[EdgeKey] = Edges[i];
    }
  }
  var Face = new DCEL.Face(IdGen.getId());
  var HEdges = [];
  for(i = 0; i < N; ++i)
    HEdges[i] = new DCEL.Halfedge();
  for(i = 0; i < N; ++i)
  {
    HEdges[i].vert = Vs[i];
    if(Vs[i].he == undefined)
      Vs[i].he = HEdges[i];
    HEdges[i].prev = HEdges[(i-1+N)%N];
    HEdges[i].next = HEdges[(i+1)%N];
    HEdges[i].edge = Edges[i];
    if(Edges[i].he != undefined)
    {
      HEdges[i].twin = Edges[i].he;
      Edges[i].he.twin = HEdges[i];
    }
    else
      Edges[i].he = HEdges[i];
    HEdges[i].face = Face;
  }
  Face.he = HEdges[0];
  return Face;
}
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

//============================= END OF FILE ==================================
