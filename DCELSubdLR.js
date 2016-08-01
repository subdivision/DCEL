//----------------------------------------------------------------------------
var DCEL = DCEL || {};

DCEL.performLaneRiesenfeld = function(OrigMesh, Iters, AverageFunc)
{
  var Curr = OrigMesh;
  var Res;
  var i;
  for(i = 0; i < Iters; ++i)
  {
    Res = DCEL.performOneIterLR(Curr, AverageFunc);
    Curr = Res;
  }
  return Res;
}

//----------------------------------------------------------------------------
DCEL.performOneIterLR = function(OrigMesh, AverageFunc)
{
  var Step1, Step2;
  Step1 = DCEL.double4Mesh(OrigMesh, AverageFunc);
  Step2 = DCEL.refine4Mesh(Step1, AverageFunc);
  Res   = DCEL.refine4Mesh(Step2, AverageFunc);
  return Res;
}

//----------------------------------------------------------------------------
DCEL.double4Mesh = function(OrigMesh, AverageFunc)
{
  var IdGen = new DCEL.IdGenerator();
  var Res = new DCEL.Mesh(IdGen.getId());
  var OldElem2NewVertex = {};
  var EdgeDB = {};
  var NOrigFaces = OrigMesh.f.length;
  var i,j;
  for(i = 0; i < NOrigFaces; ++i)
  {
    //Build (or retrieve) a 3x3 matrix of new vertices.
    //Create a "vertex"-vertex (x4). Simple copy. Preservation event.
    //Indexes (0/2,0/2)
    //Create an "edge"-vertex (x4). Invoke averaging of two edge endpoints. 
    //Indexes (0,1),(1,0),(1,2),(2,1)
    //Create a "face"-vertex. Vertical candidate: average vertical neighbors,
    //Horizontal candidate: average horizontal neighbors. Average the both.
    //Index (1,1)
    var CurrOrigFace = OrigMesh.f[i];
    var OrigFaceElems = CurrOrigFace.getElems();
    var NewFaceVerts = [[],[],[]];
    var N = OrigFaceElems[0].length;
    for(j=0; j < N; ++j)
    {
      // "Vertex" vertex. Copying.
      var NewVert = OldElem2NewVertex[OrigFaceElems[0][j].id];
      if(NewVert == undefined)
      {
        NewVert = new DCEL.Vertex(IdGen.getId());
        NewVert.pt = OrigFaceElems[0][j].pt.clone();
        NewVert.nr = OrigFaceElems[0][j].nr.clone();
        OldElem2NewVertex[OrigFaceElems[0][j].id] = NewVert;
      }
      NewFaceVerts[j==0||j==3?0:2][j==0||j==1?0:2] = NewVert;
    }
    var k,m;
    for(j=0; j < N; ++j)
    {
      // "Edge" vertex.
      var NewVert = OldElem2NewVertex[OrigFaceElems[1][j].id];
      if(NewVert == undefined)
      {
        var Pt1 = OrigFaceElems[0][j].pt;
        var Nr1 = OrigFaceElems[0][j].nr;
        var Pt2 = OrigFaceElems[0][(j+1)%N].pt;
        var Nr2 = OrigFaceElems[0][(j+1)%N].nr;
        NewVert = new DCEL.Vertex(IdGen.getId());
        var Avg = AverageFunc(Pt1, Pt2, Nr1, Nr2); 
        NewVert.pt = Avg[0].clone();
        NewVert.nr = Avg[1].clone();
        OldElem2NewVertex[OrigFaceElems[1][j].id] = NewVert;
      }
      if(j==0){k=1;m=0;}
      else if(j==1){k=2;m=1;}
      else if(j==2){k=1;m=2;}
      else if(j==3){k=0;m=1;}
      NewFaceVerts[k][m] = NewVert;
    } 
    var Cand = [];
    for(j = 0; j < 2; ++j)
    {
      if(j==0){k=[1,0];m=[1,2];}
      if(j==1){k=[0,1];m=[2,1];}
      var Avg = AverageFunc(NewFaceVerts[k[0]][k[1]].pt,
                            NewFaceVerts[m[0]][m[1]].pt,
                            NewFaceVerts[k[0]][k[1]].nr,
                            NewFaceVerts[m[0]][m[1]].nr);
      Cand[2*j] = Avg[0];
      Cand[2*j+1] = Avg[1];
    }
    
    NewVert = new DCEL.Vertex(IdGen.getId());
    var Avg = AverageFunc(Cand[0], Cand[2], Cand[1], Cand[3]);
    NewVert.pt = Avg[0].clone();
    NewVert.nr = Avg[1].clone();
    OldElem2NewVertex[CurrOrigFace.id] = NewVert;
    NewFaceVerts[1][1] = NewVert;

    var NewFaces = [];
    //Create 4 new faces
    for(k = 0; k < 2; ++k)
    {
      for(m = 0; m < 2; ++m)
      {
        NewFaces[k*2 + m] = DCEL.createFace(IdGen, EdgeDB,
                                            [NewFaceVerts[k][m],
                                             NewFaceVerts[k+1][m],
                                             NewFaceVerts[k+1][m+1],
                                             NewFaceVerts[k][m+1]]);

       }
    }
    Res.f.extend(NewFaces);
  }
  j = 0;
  for(i in OldElem2NewVertex)
    Res.v[j++] = OldElem2NewVertex[i];  
  j = 0;
  for(i in EdgeDB)
    Res.e[j++] = EdgeDB[i];
  return Res;
}

//----------------------------------------------------------------------------
DCEL.getFaceVertex = function(id, OrigFaceVrts, AverageFunc)
{
  var Cand = [];
  var i;
  for(i = 0; i < 2; ++i)
  {
    var Avg = AverageFunc(OrigFaceVrts[i].pt,
                          OrigFaceVrts[i+2].pt,
                          OrigFaceVrts[i].nr,
                          OrigFaceVrts[i+2].nr);
    Cand[2*i] = Avg[0];
    Cand[2*i+1] = Avg[1];
  } 
  NewVert = new DCEL.Vertex(id);
  var Avg = AverageFunc(Cand[0], Cand[2], Cand[1], Cand[3]);
  NewVert.pt = Avg[0].clone();
  NewVert.nr = Avg[1].clone();
  return NewVert;
}

//----------------------------------------------------------------------------
DCEL.refine4Mesh = function(OrigMesh, AverageFunc)
{
  var IdGen = new DCEL.IdGenerator();
  var Res = new DCEL.Mesh(IdGen.getId());
  var OldFace2NewVertex = {};
  var EdgeDB = {};
  var N = OrigMesh.f.length;
  var i,j,f;
  for(i = 0; i < N; ++i)
  {
    var OrigFaceVrts = OrigMesh.f[i].getElems()[0];
    var NewFaceVrtx = DCEL.getFaceVertex(IdGen.getId(),
                                         OrigFaceVrts,
                                         AverageFunc);
    OldFace2NewVertex[OrigMesh.f[i].id] = NewFaceVrtx;
  }
  N = OrigMesh.v.length;
  for(i = 0; i < N; ++i)
  {
    var NeighFaces = OrigMesh.v[i].getElems()[0];
    var M = NeighFaces.length;
    var NewVrts = [];
    for(j = 0; j < M; ++j)
      NewVrts[j] = OldFace2NewVertex[NeighFaces[j].id]
    var NewFace = DCEL.createFace(IdGen, EdgeDB, NewVrts);
    Res.f.extend([NewFace]);
  }
  j = 0;
  for(i in OldFace2NewVertex)
    Res.v[j++] = OldFace2NewVertex[i];  
  j = 0;
  for(i in EdgeDB)
    Res.e[j++] = EdgeDB[i];
  return Res;
}
//============================= END OF FILE ==================================
