//----------------------------------------------------------------------------
function eeq( d1, d2, eps )
{
  eps = eps || 0.0001;
  if( Math.abs( d1 - d2 ) < eps )
    return true;
  else
    return false;
}

//----------------------------------------------------------------------------
function eeq_pts( p1, p2, eps )
{
  eps = eps || 0.0001;
  if( Math.abs( p1.x - p2.x ) < eps &&
      Math.abs( p1.y - p2.y ) < eps &&
      Math.abs( p1.z - p2.z ) < eps  )
    return true;
  else
    return false;
}

//----------------------------------------------------------------------------
function zvec( v )
{
  if( Math.abs( v.x ) < 0.0001 &&
      Math.abs( v.y ) < 0.0001 &&
      Math.abs( v.z ) < 0.0001 )
    return true;
  else
    return false;
}

//----------------------------------------------------------------------------
function doublePolygon( Poly, Norms, Preserve, Opened )
{	
  var i = 0;
  var j = 0;
  var ResPoly = [];
  var ResNorm = [];
  var N = Poly.length;
  var NN = Opened ? N-1:N;

  for( i = 0; i < NN; ++i )
  {
    var r = computeCircleAverage( Poly[i],  Poly[ (i+1)%N],
                                  Norms[i], Norms[(i+1)%N] );
    if( r[0] == undefined )
    {
      r[0] = getMidPoint( Poly[i], Poly[(i+1)%N] );
    }
    j = i;
    if( Preserve )
    {
      ResPoly[2*i] = Poly[i];
      ResNorm[2*i] = Norms[i];
      j = 2*i+1;
    }
    ResPoly[j] = r[0];
    ResNorm[j] = r[1];
  }
  if( Preserve )
  {
    ResPoly[2*(N-1)] = Poly[N-1];
    ResNorm[2*(N-1)] = Norms[N-1];
  }
  var Res = [ ResPoly, ResNorm ];
  return Res;
}

//----------------------------------------------------------------------------
function computeClassicAverage( p1, p2, n1, n2 )
{
  return [getMidPoint(p1, p2), getMidPoint(n1, n2)];
}

//----------------------------------------------------------------------------
function computeCircleAverage( p1, p2, n1, n2 )
{
  var Result  = [];
  var MiddlePlane = getMiddlePlane( p1, p2 );
  var MiddlePt = getMidPoint( p1, p2 );
  var Circ1 = getCircle( p1, n1, MiddlePlane );
  var Circ2 = getCircle( p2, n2, MiddlePlane );
  var CandPt1 = undefined;
  var CandPt2 = undefined;
  if( Circ1 != undefined )
  {
    CandPt1 = getCandidatePt( Circ1, MiddlePt );
  }
  if( Circ2 != undefined )
  {
    CandPt2 = getCandidatePt( Circ2, MiddlePt );
  }
  var ResPt;
  if(CandPt1 == undefined && CandPt2 == undefined)
    ResPt = getMidPoint(p1, p2);
  else if(CandPt1 == undefined && CandPt2 != undefined)
    ResPt = CandPt2;
  else if(CandPt1 != undefined && CandPt2 == undefined)
    ResPt = CandPt1;
  else
    ResPt = getMidPoint( CandPt1, CandPt2 );
  var ResNorm = getMidPoint( n1, n2 );
  ResNorm.normalize();
  Result = [ResPt, ResNorm];
  return Result;
}

//----------------------------------------------------------------------------
function getCandidatePt( Circle, MiddlePt )
{
  var p1 = Circle[0];
  var t = p1.distanceTo(MiddlePt) / Circle[1];
  if(Math.abs(t) < 0.0001)
    return MiddlePt.clone();
  var res = MiddlePt.clone().sub(
              p1.clone().multiplyScalar(1-t)).divideScalar(t);
  return res;
}

//----------------------------------------------------------------------------
function getCircle( p1, n1, MiddlePlane )
{
  var Res = [];
  var SegmSrc = p1.clone().add( n1.clone().multiplyScalar(100));
  var SegmDst = p1.clone().add( n1.clone().negate().multiplyScalar(100));
  var TheLine = new THREE.Line3( SegmSrc, SegmDst );
  var Center = MiddlePlane.intersectLine(TheLine);
  if(Center == undefined)
    return undefined;
  var Radius = Center.distanceTo(p1);
  Res[0] = Center;
  Res[1] = Radius;
  return Res;
}
//----------------------------------------------------------------------------
function getMiddlePlane( p1, p2 )
{
  var p = getMidPoint( p1, p2 );
  var n = p2.clone().sub( p1 );
  var MiddlePlane = new THREE.Plane(n, 0);
  MiddlePlane.setFromNormalAndCoplanarPoint(n, p);
  return MiddlePlane;
}

//----------------------------------------------------------------------------
function getMidPoint( p1, p2 )
{
  if( p1 == undefined || p2 == undefined )
    return undefined;
  var Result = p1.clone().add( p2 ).divideScalar( 2.0 );
  return Result;
}

//=============================== DRAWING ====================================
//----------------------------------------------------------------------------
function draw3DPolyline( Polyline, Color, bOpen )
{
  var N  = Polyline.length;
  var NN = bOpen? N-1 : N;
  var i;
  for( i = 0; i < NN; ++i )
  {
    draw3DSegment( Polyline[i],
                   Polyline[i+1],
                   Color );		
  }
}

//----------------------------------------------------------------------------
function draw3DSegment( P, Q, color, bDashed )
{
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push( P, Q );
  lineGeometry.computeLineDistances();
  var lineMaterial;
  if( bDashed === undefined || !bDashed )
    lineMaterial = new THREE.LineBasicMaterial();
  else // dashed = true
    lineMaterial = new THREE.LineDashedMaterial({dashSize:2, gapSize: 2});
  lineMaterial.color = color;
  var line = new THREE.Line( lineGeometry, lineMaterial );
  scene.add(line);
}	

//----------------------------------------------------------------------------
function draw3DNorms( Polygon, Norms, Color )
{
  var N = Polygon.length;
  var i;
  for( i = 0; i < N; ++i )
  {
    var Orig = Polygon[i];
    var Vect = Norms[i];
    var arrow = new THREE.ArrowHelper( Vect, Orig, 1, Color );
    scene.add( arrow );
  }
}

//================================ END OF FILE ===============================
