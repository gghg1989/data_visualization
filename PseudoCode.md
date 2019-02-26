## Quad-tree Pseudo Code
### Data Structure
It is assumed these structures are used.
```java
// Simple coordinate object to represent points and vectors
struct XY

  float x;
  float y;

  function __construct(float _x, float _y) ...

// Axis-aligned bounding box with half dimension and center
struct AABB

  XY center;
  float halfDimension;

  function __construct(XY center, float halfDimension) ...
  function containsPoint(XY point) ...
  function intersectsAABB(AABB other) ...
```
### QuadTree class
This class represents both one quad tree and the node where it is rooted.
```java
class QuadTree

  // Arbitrary constant to indicate how many elements can be stored in this quad tree node
  constant int QT_NODE_CAPACITY = 4;

  // Axis-aligned bounding box stored as a center with half-dimensions
  // to represent the boundaries of this quad tree
  AABB boundary;

  // Points in this quad tree node
  Array of XY [size = QT_NODE_CAPACITY] points;

  // Children
  QuadTree* northWest;
  QuadTree* northEast;
  QuadTree* southWest;
  QuadTree* southEast;

  // Methods
  function __construct(AABB _boundary) ..
  function insert(XY p) ..
  function subdivide() .. // create four children that fully divide this quad into four quads of equal area
  function queryRange(AABB range) ..
```
### Insertion
The following method inserts a point into the appropriate quad of a quadtree, splitting if necessary.
```java
class QuadTree

  ...

  // Insert a point into the QuadTree
  function insert(XY p)
  
    // Ignore objects that do not belong in this quad tree
    if (!boundary.containsPoint(p))
      return false; // object cannot be added

    // If there is space in this quad tree and if doesn't have subdivisions, add the object here
    if (points.size < QT_NODE_CAPACITY && northWest == null)
    
      points.append(p);
      return true;
   

    // Otherwise, subdivide and then add the point to whichever node will accept it
    if (northWest == null)
      subdivide();
    //We have to add the points/data contained into this quad array to the new quads if we want that only 
    //the last node holds the data 

    if (northWest->insert(p)) return true;
    if (northEast->insert(p)) return true;
    if (southWest->insert(p)) return true;
    if (southEast->insert(p)) return true;

    // Otherwise, the point cannot be inserted for some unknown reason (this should never happen)
    return false;
 
```
### Query range
The following method finds all points contained within a range.
```java
class QuadTree

  ...

  // Find all points that appear within a range
  function queryRange(AABB range)
  
    // Prepare an array of results
    Array of XY pointsInRange;

    // Automatically abort if the range does not intersect this quad
    if (!boundary.intersectsAABB(range))
      return pointsInRange; // empty list

    // Check objects at this quad level
    for (int p = 0; p < points.size; p++)
    
      if (range.containsPoint(points[p]))
        pointsInRange.append(points[p]);
   

    // Terminate here, if there are no children
    if (northWest == null)
      return pointsInRange;

    // Otherwise, add the points from the children
    pointsInRange.appendArray(northWest->queryRange(range));
    pointsInRange.appendArray(northEast->queryRange(range));
    pointsInRange.appendArray(southWest->queryRange(range));
    pointsInRange.appendArray(southEast->queryRange(range));

    return pointsInRange;
 
```